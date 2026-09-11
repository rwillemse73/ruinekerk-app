/* Reisblik 9.7.14 – Mijn reisdag
   Bestaande Mijn reisdag-selectie, Word-export en zelfstandige Reisdagboek-HTML.
*/
(function(){
  const DATE_BASE_KEY='reisblik_mijn_reisdag_datum';
  const DATE_FROM_BASE_KEY='reisblik_mijn_reisdag_datum_van';
  const DATE_TO_BASE_KEY='reisblik_mijn_reisdag_datum_tm';
  const VISITED_BASE_KEY='reisblik_visited_v1';
  const storageKey=(key)=>window.reisblikVakantie?.getVakantieStorageKey ? window.reisblikVakantie.getVakantieStorageKey(key) : key;
  const DATE_KEY=storageKey(DATE_BASE_KEY);
  const DATE_FROM_KEY=storageKey(DATE_FROM_BASE_KEY);
  const DATE_TO_KEY=storageKey(DATE_TO_BASE_KEY);
  const VISITED_KEY=storageKey(VISITED_BASE_KEY);

  function byId(id){return document.getElementById(id);}

  function loadVisited(){
    try{
      const data=JSON.parse(localStorage.getItem(storageKey(VISITED_BASE_KEY))||'{}');
      return data&&typeof data==='object'?data:{};
    }catch(e){return {};}
  }

  function loadStoredObject(key){
    try{
      const data=JSON.parse(localStorage.getItem(storageKey(key))||'{}');
      return data&&typeof data==='object'?data:{};
    }catch(e){return {};}
  }

  function datePart(iso){
    const d=new Date(iso);
    if(Number.isNaN(d.getTime()))return '';
    return d.getFullYear()+'-'+
      String(d.getMonth()+1).padStart(2,'0')+'-'+
      String(d.getDate()).padStart(2,'0');
  }

  function timePart(iso){
    const d=new Date(iso);
    if(Number.isNaN(d.getTime()))return '';
    return new Intl.DateTimeFormat('nl-NL',{
      hour:'2-digit',minute:'2-digit',hour12:false
    }).format(d);
  }

  function dateTimePart(iso){
    const d=new Date(iso);
    if(Number.isNaN(d.getTime()))return '';
    return new Intl.DateTimeFormat('nl-NL',{
      day:'2-digit',month:'2-digit',year:'numeric',
      hour:'2-digit',minute:'2-digit',hour12:false
    }).format(d);
  }


  function matchesForRange(dateFrom,dateTo){
    return Object.values(loadVisited())
      .filter(item=>{
        if(!item||!item.visitedAt)return false;
        const d=datePart(item.visitedAt);
        return d && d>=dateFrom && d<=dateTo;
      })
      .sort((a,b)=>new Date(a.visitedAt)-new Date(b.visitedAt));
  }

  function rangeLabel(dateFrom,dateTo){
    return dateFrom===dateTo ? dateFrom : dateFrom+' t/m '+dateTo;
  }

  function findLocation(item){
    if(typeof locations!=='undefined' && Array.isArray(locations)){
      const location=locations.find(x=>String(x.id)===String(item.id));
      if(location)return location;
    }
    // Een bezocht evenement is geen gewone locatie in locations[].
    // Haal het daarom rechtstreeks uit de permanente Agenda-opslag.
    if(typeof window.reisblikAgendaGetEvenementen==='function'){
      const event=window.reisblikAgendaGetEvenementen().find(x=>String(x.id)===String(item.id));
      if(event){
        return {
          id:event.id,
          name:event.name,
          category:'evenementen',
          type:event.type||'Evenement',
          address:event.location||'',
          lat:Number(event.lat),
          lon:Number(event.lon),
          agendaEvent:true,
          eventUrl:event.url||'',
          sourceUrl:event.sourceUrl||'',
          description:event.description||'',
          organizer:event.organizer||'',
          price:event.price||''
        };
      }
    }
    return null;
  }

  function getAgendaEvent(item){
    if(typeof window.reisblikAgendaGetEvenementen!=='function')return null;
    return window.reisblikAgendaGetEvenementen().find(x=>String(x.id)===String(item.id))||null;
  }

  async function getLocationText(item){
    const x=findLocation(item);

    if(x && x.agendaEvent){
      const ev=getAgendaEvent(item)||x;
      return [
        ev.description ? ev.description : '',
        ev.organizer ? 'Organisator: '+ev.organizer : '',
        ev.price ? 'Prijs: '+ev.price : '',
        ev.url ? 'Evenementwebsite: '+ev.url : ''
      ].filter(Boolean).join('\n\n').trim();
    }

    if(x && x.userCreated){
      return [
        x.description||'',
        x.story||'',
        x.experience||''
      ].filter(Boolean).join('\n\n').trim();
    }

    if(!x)return '';

    try{
      // app.js already contains the authoritative resolver for category
      // content URLs. Use it when available; otherwise resolve the content
      // path against the app URL/category directory.
      let url=null;
      if(typeof resolveContentUrl==='function'){
        url=resolveContentUrl(x);
      }
      if(!url && x.content){
        const category=String(x.category||x.type||'').toLowerCase();
        const raw=String(x.content);
        if(/^(https?:|\/)/i.test(raw)){
          url=new URL(raw,location.href).href;
        }else if(category && !raw.toLowerCase().startsWith(category+'/')){
          url=new URL(category+'/'+raw,location.href).href;
        }else{
          url=new URL(raw,location.href).href;
        }
      }
      if(!url)return '';

      const response=await fetch(url+'?reisdag='+Date.now(),{cache:'no-store'});
      if(!response.ok)return '';

      const source=await response.text();
      const doc=new DOMParser().parseFromString(source,'text/html');

      // The complete visible content of the fixed HTML is the source for
      // the Word document. Prefer article, otherwise main, otherwise body.
      const root=doc.querySelector('article')||
                 doc.querySelector('main')||
                 doc.body;

      if(!root)return '';

      // Remove controls/technical elements that should never become part
      // of the travel-day document.
      root.querySelectorAll(
        'script,style,noscript,button,input,textarea,select,nav,header,footer,'+
        '.reisblik-visited,.visited,.content-meta'
      ).forEach(el=>el.remove());

      const text=(root.innerText||root.textContent||'')
        .replace(/\r/g,'')
        .replace(/[ \t]+\n/g,'\n')
        .replace(/\n{3,}/g,'\n\n')
        .trim();

      return text;
    }catch(e){
      console.warn('Mijn reisdag: vaste HTML kon niet worden gelezen',x?.name,e);
      return '';
    }
  }

  async function getLocationHtml(item){
    const x=findLocation(item);
    if(!x)return '';
    if(x.agendaEvent)return '';

    try{
      let url=null;
      if(typeof resolveContentUrl==='function')url=resolveContentUrl(x);
      if(!url && x.content){
        const category=String(x.category||x.type||'').toLowerCase();
        const raw=String(x.content);
        if(/^(https?:|\/)/i.test(raw))url=new URL(raw,location.href).href;
        else if(category && !raw.toLowerCase().startsWith(category+'/'))
          url=new URL(category+'/'+raw,location.href).href;
        else url=new URL(raw,location.href).href;
      }
      if(!url)return '';

      const response=await fetch(url+'?reisdaghtml='+Date.now(),{cache:'no-store'});
      if(!response.ok)return '';
      const doc=new DOMParser().parseFromString(await response.text(),'text/html');
      const root=doc.querySelector('article')||doc.querySelector('main')||doc.body;
      if(!root)return '';

      root.querySelectorAll(
        'script,style,noscript,button,input,textarea,select,nav,header,footer,'+
        '.reisblik-visited,.visited,.content-meta'
      ).forEach(el=>el.remove());

      // Maak afbeeldingen en links zelfstandig bruikbaar in het latere
      // reisdagboek. De bronpagina kan relatieve paden gebruiken.
      root.querySelectorAll('img[src]').forEach(img=>{
        try{ img.setAttribute('src',new URL(img.getAttribute('src'),url).href); }catch(e){}
      });
      root.querySelectorAll('a[href]').forEach(a=>{
        try{ a.setAttribute('href',new URL(a.getAttribute('href'),url).href); }catch(e){}
      });

      return root.innerHTML.trim();
    }catch(e){
      console.warn('Mijn reisdag: HTML-opmaak kon niet worden gelezen',x?.name,e);
      return '';
    }
  }

  function getExtraForLocation(id){
    const legacy=loadStoredObject('ruinekerk_extra_info_v1');
    const current=loadStoredObject('ruinekerk_extra_simple_v1');
    const result=[];

    const addItems=(items)=>{
      (Array.isArray(items)?items:[]).forEach(x=>{
        const item={date:String(x?.date||''),text:String(x?.text||'')};
        if(!item.date && !item.text)return;
        const duplicate=result.some(y=>y.date===item.date && y.text===item.text);
        if(!duplicate)result.push(item);
      });
    };

    addItems(legacy[id]);
    const simple=current[id];
    if(Array.isArray(simple)) addItems(simple);
    else if(simple && typeof simple==='object') addItems([simple]);

    return result.sort((a,b)=>{
      const byDate=String(a.date).localeCompare(String(b.date));
      return byDate || String(a.text).localeCompare(String(b.text));
    });
  }

  function getFirstName(matches){
    if(!matches.length)return 'reisdag';
    return String(matches[0].name||'locatie')
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu,'-')
      .replace(/^-+|-+$/g,'')
      .toLowerCase() || 'locatie';
  }

  function downloadBlob(blob,filename){
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }

  function dataUrlToUint8Array(dataUrl){
    const m=String(dataUrl||'').match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
    if(!m)return null;
    try{
      if(m[2]){
        const bin=atob(m[3]);
        const bytes=new Uint8Array(bin.length);
        for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
        return {bytes,mime:m[1]||'image/jpeg'};
      }
      const decoded=decodeURIComponent(m[3]);
      const bytes=new TextEncoder().encode(decoded);
      return {bytes,mime:m[1]||'image/jpeg'};
    }catch(e){
      console.warn('Mijn reisdag: foto kon niet worden gelezen',e);
      return null;
    }
  }

  async function buildDayData(dateFrom,dateTo){
    const matches=matchesForRange(dateFrom,dateTo);
    const entries=[];

    for(const item of matches){
      entries.push({
        item:item,
        text:await getLocationText(item),
        html:await getLocationHtml(item),
        extra:getExtraForLocation(item.id)
      });
    }
    return entries;
  }

  function escapeHtml(value){
    return String(value??'')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  }

  function makeWordHtml(entries,selectedPeriod){
    const sections=entries.map((entry,index)=>{
      const item=entry.item;
      const title=(index+1)+'. '+(item.name||'Onbekende locatie');
      const time=timePart(item.visitedAt);
      let story='';
      if(item.category==='evenementen'){
        const ev=getAgendaEvent(item)||{};
        story='<h3>Evenement</h3>'+
          (ev.description?'<p>'+escapeHtml(ev.description)+'</p>':'')+
          (ev.location?'<p><b>Locatie:</b> '+escapeHtml(ev.location)+'</p>':'')+
          (ev.organizer?'<p><b>Organisator:</b> '+escapeHtml(ev.organizer)+'</p>':'')+
          (ev.price?'<p><b>Prijs:</b> '+escapeHtml(ev.price)+'</p>':'')+
          (ev.url?'<p><b>Evenementwebsite:</b> <a href="'+escapeHtml(ev.url)+'">'+escapeHtml(ev.url)+'</a></p>':'');
      }else{
        story=entry.html
          ? '<h3>Vaste tekst uit HTML</h3><div class="fixed-html">'+entry.html+'</div>'
          : (entry.text
            ? '<h3>Vaste tekst uit HTML</h3>'+
              entry.text.split(/\n\s*\n/).map(p=>
                '<p>'+escapeHtml(p).replace(/\n/g,'<br>')+'</p>'
              ).join('')
            : '<p><i>Geen tekst beschikbaar in het vaste HTML-bestand.</i></p>');
      }

      const extra=entry.extra.length
        ? '<h3>Extra informatie</h3><ul>'+
          entry.extra.map(x=>'<li><b>'+escapeHtml(x.date||'')+
          '</b> — '+escapeHtml(x.text||'')+'</li>').join('')+
          '</ul>'
        : '';

      // Eigen foto's staan op de locatie zelf (locations[] / eigen locaties),
      // niet op het compacte Bezocht-record. Gebruik daarom de gevonden locatie
      // als bron voor de foto.
      const sourceLocation=findLocation(item);
      const ownPhoto=(sourceLocation && sourceLocation.userCreated && sourceLocation.photo)
        ? '<div class="reisdag-photo"><p><b>Foto</b></p><img src="'+escapeHtml(sourceLocation.photo)+'" alt="Foto '+escapeHtml(sourceLocation.name||item.name||'locatie')+'" style="width:300px;max-width:300px;height:auto;display:block;margin:8px 0 16px" width="300"></div>'
        : '';

      return '<section style="page-break-inside:avoid;margin-bottom:28px">'+
        '<h2>'+escapeHtml(title)+'</h2>'+
        (dateTimePart(item.visitedAt)?'<p><b>Bezocht:</b> '+escapeHtml(dateTimePart(item.visitedAt))+'</p>':'')+
        (item.category?'<p><b>Type:</b> '+escapeHtml(item.category)+'</p>':'')+
        ownPhoto+story+extra+
        '</section>';
    }).join('\n');

    return '<!DOCTYPE html><html><head><meta charset="utf-8">'+
      '<title>Mijn reisdag '+escapeHtml(selectedPeriod)+'</title>'+
      '<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#222}'+
      'h1{font-size:20pt}h2{font-size:16pt;border-bottom:1px solid #ccc;padding-bottom:4px}'+
      'h3{font-size:12pt;margin-bottom:6px}.fixed-html h1{font-size:20pt}.fixed-html h2{font-size:16pt}.fixed-html h3{font-size:12pt}.fixed-html p{line-height:1.45}.fixed-html a{color:#1155cc;text-decoration:underline}.fixed-html ul,.fixed-html ol{margin-top:4px;margin-bottom:10px}.fixed-html img{max-width:100%;height:auto}'+
      '</style></head><body>'+
      '<h1>Mijn reisdag — '+escapeHtml(selectedPeriod)+'</h1>'+
      '<p>Samengesteld uit de op deze datum als bezocht geregistreerde locaties.</p>'+
      sections+
      '</body></html>';
  }

  async function downloadWord(dateFrom,dateTo){
    const matches=matchesForRange(dateFrom,dateTo);
    const selectedPeriod=rangeLabel(dateFrom,dateTo);
    if(!matches.length){
      alert('Geen bezochte locaties gevonden voor '+selectedPeriod+'.');
      return;
    }
    const btn=byId('reisdagWordBtn');
    if(btn)btn.disabled=true;
    try{
      const entries=await buildDayData(dateFrom,dateTo);
      const filename=(dateFrom===dateTo?dateFrom:dateFrom+'-tm-'+dateTo)+'-'+getFirstName(matches)+'.doc';
      downloadBlob(new Blob(['\ufeff',makeWordHtml(entries,selectedPeriod)],{
        type:'application/msword;charset=utf-8'
      }),filename);
    }finally{
      if(btn)btn.disabled=false;
    }
  }

  function formatDiaryDate(value){
    if(!value)return '';
    const parts=String(value).split('-');
    if(parts.length!==3)return value;
    const d=new Date(Number(parts[0]),Number(parts[1])-1,Number(parts[2]));
    if(Number.isNaN(d.getTime()))return value;
    return new Intl.DateTimeFormat('nl-NL',{
      weekday:'long',day:'numeric',month:'long',year:'numeric'
    }).format(d);
  }

  function diaryPhotoSrc(item,html){
    const sourceLocation=findLocation(item);
    if(sourceLocation && sourceLocation.userCreated && sourceLocation.photo)return sourceLocation.photo;
    if(html){
      try{
        const doc=new DOMParser().parseFromString(html,'text/html');
        const img=doc.querySelector('img[src]');
        if(img){
          const raw=img.getAttribute('src');
          if(raw)return new URL(raw,document.baseURI).href;
        }
      }catch(e){}
    }
    return '';
  }

  function diaryPhotoHtml(item,html,caption){
    const src=diaryPhotoSrc(item,html);
    if(!src)return '';
    return '<figure class="dagboek-foto">'+
      '<img src="'+escapeHtml(src)+'" alt="Foto '+escapeHtml(item.name||'locatie')+'">'+
      (caption?'<figcaption>'+escapeHtml(caption)+'</figcaption>':'')+
      '</figure>';
  }

  function diaryTextBlock(title,text,extraClass){
    if(!text)return '';
    const paragraphs=String(text).split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
    if(!paragraphs.length)return '';
    return '<div class="dagboek-blok '+(extraClass||'')+'"><h3>'+escapeHtml(title)+'</h3>'+ 
      paragraphs.map(p=>'<p>'+escapeHtml(p).replace(/\n/g,'<br>')+'</p>').join('')+
      '</div>';
  }

  // Zet de bestaande <dialog>-slideshow uit de locatie-HTML om naar een
  // zelfstandige slideshow die ook in de gegenereerde reisdagboekpagina werkt.
  // De trigger blijft op dezelfde plek in de broninhoud staan.
  function diaryPrepareFixedHtml(rawHtml,cardIndex){
    if(!rawHtml)return {html:'',extras:[]};
    try{
      const doc=new DOMParser().parseFromString('<div id="diaryFixedRoot">'+rawHtml+'</div>','text/html');
      const root=doc.getElementById('diaryFixedRoot');
      if(!root)return {html:rawHtml,extras:[]};
      const dialogs=new Map();
      root.querySelectorAll('dialog[id]').forEach(dialog=>dialogs.set(dialog.id,dialog));
      const extras=[];
      let extraCounter=0;

      root.querySelectorAll('button[onclick*="showModal"]').forEach(button=>{
        const onclick=button.getAttribute('onclick')||'';
        const m=onclick.match(/getElementById\(['"]([^'"]+)['"]\)/);
        if(!m)return;
        const dialog=dialogs.get(m[1]);
        if(!dialog)return;
        const id='reisdag-slideshow-'+cardIndex+'-'+extraCounter++;
        const caption=(button.parentElement?.querySelector('figcaption')?.textContent||'Extra foto\'s').trim();
        const trigger=document.createElement('div');
        trigger.className='dagboek-extra-trigger';
        trigger.innerHTML='<button type="button" data-open-diary-slideshow="'+id+'">📷 Extra foto\'s</button>'+
          (caption?'<span>'+escapeHtml(caption)+'</span>':'');
        const holder=button.closest('.omkaderde-tekst')||button.parentElement||button;
        holder.replaceWith(trigger);
        extras.push({id,dialog});
      });

      // Slideshow-dialogen zonder expliciete trigger worden niet weggegooid;
      // ze krijgen alsnog een blok onderaan de betreffende locatie.
      dialogs.forEach((dialog,id)=>{
        if(extras.some(x=>x.dialog===dialog))return;
        const newId='reisdag-slideshow-'+cardIndex+'-'+extraCounter++;
        extras.push({id:newId,dialog});
      });

      const modalHtml=extras.map((extra)=>{
        const dialog=extra.dialog;
        const slides=Array.from(dialog.querySelectorAll('.slide'));
        const slideNodes=slides.length?slides:[dialog];
        const slideHtml=slideNodes.map((slide,i)=>{
          const clone=slide.cloneNode(true);
          clone.querySelectorAll('[onclick]').forEach(el=>el.removeAttribute('onclick'));
          clone.querySelectorAll('script,style').forEach(el=>el.remove());
          clone.querySelectorAll('img[src]').forEach(img=>{
            const src=img.getAttribute('src');
            if(src)img.setAttribute('src',src);
          });
          return '<div class="dagboek-slide" data-slide="'+i+'">'+clone.innerHTML+'</div>';
        }).join('\n');
        return '<dialog class="dagboek-slideshow-dialog" id="'+extra.id+'">'+
          '<div class="dagboek-slideshow-head"><strong>Extra foto\'s</strong><button type="button" data-close-diary-slideshow="'+extra.id+'">✕</button></div>'+
          '<div class="dagboek-slideshow-body">'+slideHtml+'</div>'+
          '<div class="dagboek-slideshow-controls"><button type="button" data-slide-prev="'+extra.id+'">‹</button><span data-slide-status="'+extra.id+'"></span><button type="button" data-slide-next="'+extra.id+'">›</button></div>'+
          '</dialog>';
      }).join('\n');

      root.querySelectorAll('dialog').forEach(d=>d.remove());
      return {html:root.innerHTML.trim(),extrasHtml:modalHtml,extras};
    }catch(e){
      console.warn('Mijn reisdag: slideshow kon niet worden voorbereid',e);
      return {html:rawHtml,extrasHtml:'',extras:[]};
    }
  }

  function diaryHeroData(entries){
    const result=[];
    for(const entry of entries){
      const src=diaryPhotoSrc(entry.item,entry.html);
      if(src && !result.some(x=>x.src===src)){
        result.push({src,caption:entry.item?.name||'Bezocht'});
      }
      if(result.length>=2)break;
    }
    return result;
  }

  function diaryClientScript(){
    return `<script>
(function(){
  function showSlide(dialog,index){
    if(!dialog)return;
    const slides=[...dialog.querySelectorAll('.dagboek-slide')];
    if(!slides.length)return;
    let n=((index%slides.length)+slides.length)%slides.length;
    slides.forEach((slide,i)=>slide.hidden=i!==n);
    const status=dialog.querySelector('[data-slide-status]');
    if(status)status.textContent=(n+1)+' / '+slides.length;
    dialog.dataset.slideIndex=n;
  }
  function stepSlide(dialog,delta){
    const current=Number(dialog?.dataset.slideIndex||0);
    showSlide(dialog,current+delta);
  }
  function setupSlides(){
    document.querySelectorAll('[data-open-diary-slideshow]').forEach(button=>{
      button.addEventListener('click',()=>{
        const dialog=document.getElementById(button.dataset.openDiarySlideshow);
        if(!dialog)return;
        dialog.showModal();
        showSlide(dialog,0);
      });
    });
    document.querySelectorAll('[data-close-diary-slideshow]').forEach(button=>{
      button.addEventListener('click',()=>{
        document.getElementById(button.dataset.closeDiarySlideshow)?.close();
      });
    });
    document.querySelectorAll('[data-slide-prev]').forEach(button=>{
      button.addEventListener('click',()=>{
        stepSlide(document.getElementById(button.dataset.slidePrev),-1);
      });
    });
    document.querySelectorAll('[data-slide-next]').forEach(button=>{
      button.addEventListener('click',()=>{
        stepSlide(document.getElementById(button.dataset.slideNext),1);
      });
    });
    document.querySelectorAll('.dagboek-slideshow-dialog').forEach(dialog=>showSlide(dialog,0));
  }
  document.addEventListener('DOMContentLoaded',setupSlides);
})();
</script>`;
  }


  function japanImagePlaceholder(img, index) {
    const attrW=img.getAttribute('width')||'';
    const attrH=img.getAttribute('height')||'';
    const originalStyle=img.getAttribute('style')||'';
    const div=img.ownerDocument.createElement('div');
    div.className='japan-foto-plaats';
    if(originalStyle) div.setAttribute('style',originalStyle);
    if(attrW) div.setAttribute('data-original-width',attrW);
    if(attrH) div.setAttribute('data-original-height',attrH);
    const format=[attrW?('breedte '+attrW):'',attrH?('hoogte '+attrH):''].filter(Boolean).join(' × ');
    div.textContent='FOTO-PLAATS'+(format?' — '+format:'');
    return div;
  }

  function japanReplaceImages(root) {
    let n=1;
    root.querySelectorAll('img').forEach(img=>img.replaceWith(japanImagePlaceholder(img,n++)));
  }

  function japanSetLocationHeading(root,locationName) {
    const first=root.querySelector('h2');
    if(first) first.textContent=locationName||'Onbekende locatie';
    else {
      const h2=root.ownerDocument.createElement('h2');
      h2.textContent=locationName||'Onbekende locatie';
      root.insertBefore(h2,root.firstChild);
    }
  }

  function japanPrettyNode(node,depth=0) {
    const pad='    '.repeat(depth);
    if(node.nodeType===8) return pad+'<!--'+node.nodeValue+'-->';
    if(node.nodeType===3) {
      const text=node.nodeValue.replace(/\r/g,'').replace(/\n+/g,' ').replace(/[ \t]+/g,' ').trim();
      return text ? pad+text : '';
    }
    if(node.nodeType!==1) return '';
    const attrs=[...node.attributes].map(a=>` ${a.name}="${escapeHtml(a.value)}"`).join('\n');
    const children=[...node.childNodes].map(ch=>japanPrettyNode(ch,depth+1)).filter(Boolean);
    const tag=node.tagName.toLowerCase();
    if(!children.length) return `${pad}<${tag}${attrs}></${tag}>`;
    if(children.length===1 && node.firstChild?.nodeType===3) return `${pad}<${tag}${attrs}>${children[0].trim()}</${tag}>`;
    return `${pad}<${tag}${attrs}>\n${children.join('\n')}\n${pad}</${tag}>`;
  }

  function japanFormatFragment(root) {
    return [...root.childNodes].map(node=>japanPrettyNode(node,1)).filter(Boolean).join('\n');
  }

  function japanPrepareLocationHtml(rawHtml,locationName,locationIndex) {
    if(!rawHtml)return {html:'',dialogsHtml:''};
    try {
      const doc=new DOMParser().parseFromString('<div id="japanRoot">'+rawHtml+'</div>','text/html');
      const root=doc.getElementById('japanRoot');
      if(!root)return {html:'',dialogsHtml:''};
      root.querySelectorAll('script,style,noscript,input,textarea,select,nav,header,footer').forEach(el=>el.remove());
      japanSetLocationHeading(root,locationName);

      const dialogs=[...root.querySelectorAll('dialog')];
      const dialogHtml=[];
      dialogs.forEach((dialog,dialogIndex)=>{
        const oldId=dialog.id||('slideshow-'+dialogIndex);
        const newId='japan-slideshow-'+locationIndex+'-'+dialogIndex;
        dialog.id=newId;

        root.querySelectorAll('button[onclick*="'+oldId+'"]').forEach(button=>{
          button.setAttribute('data-japan-open',newId);
          button.removeAttribute('onclick');
        });
        dialog.querySelectorAll('.prev,.prev2').forEach(button=>{
          button.setAttribute('data-japan-prev',newId);
          button.removeAttribute('onclick');
        });
        dialog.querySelectorAll('.next,.next2').forEach(button=>{
          button.setAttribute('data-japan-next',newId);
          button.removeAttribute('onclick');
        });
        dialog.querySelectorAll('.close-btn').forEach(button=>{
          button.setAttribute('data-japan-close',newId);
          button.removeAttribute('onclick');
        });
        dialog.querySelectorAll('script,style').forEach(el=>el.remove());
        japanReplaceImages(dialog);
        dialogHtml.push(japanPrettyNode(dialog,1));
        dialog.remove();
      });

      root.querySelectorAll('[data-japan-open]').forEach(trigger=>trigger.classList.add('japan-slideshow-trigger-source'));
      japanReplaceImages(root);
      return {html:japanFormatFragment(root),dialogsHtml:dialogHtml.join('\n')};
    } catch(e) {
      console.warn('Mijn reisdag: Japanstijl HTML kon niet worden voorbereid',e);
      return {html:'<h2>'+escapeHtml(locationName||'Onbekende locatie')+'</h2><p>'+escapeHtml(rawHtml)+'</p>',dialogsHtml:''};
    }
  }

  function japanTopMapHtml(points) {
    const valid=points.filter(p=>p && p.location && Number.isFinite(Number(p.location.lat)) && Number.isFinite(Number(p.location.lon)));
    const mapData=valid.map((p,i)=>({n:i+1,name:p.item?.name||p.location?.name||'Locatie',lat:Number(p.location.lat),lon:Number(p.location.lon)}));
    const safeMapData=JSON.stringify(mapData).replace(/</g,'\\u003c');
    return `<div class="japan-map-slot">
    <div id="japan-reisdag-map" class="japan-reisdag-map"></div>
    <div class="japan-map-caption">Kaart — bezochte locaties in chronologische volgorde</div>
</div>
<script>
    window.__REISBLIK_JAPAN_MAP__=${safeMapData};
    (function(){
        function init(){
            var data=window.__REISBLIK_JAPAN_MAP__||[];
            var el=document.getElementById('japan-reisdag-map');
            if(!el||!window.L||!data.length)return;
            var map=L.map(el,{scrollWheelZoom:false});
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
            var bounds=[];
            data.forEach(function(p){
                bounds.push([p.lat,p.lon]);
                L.marker([p.lat,p.lon]).addTo(map).bindPopup('<b>'+String(p.n)+'. '+String(p.name).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];})+'</b>');
            });
            if(bounds.length===1)map.setView(bounds[0],14);
            else map.fitBounds(bounds,{padding:[20,20],maxZoom:14});
        }
        if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
    })();
</script>`;
  }

  function japanTravelCss() {
    return `        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f0f2f5;
            padding: 20px;
            margin-top: 0;
        }
		
        .indeling-kolommen {
            margin-top: 8px;
			columns: 3; /* Aantal kolommen */
            column-gap: 30px; /* Ruimte tussen kolommen */
            column-rule: 1px solid #ccc; /* Lijn tussen kolommen */
            text-align: justify;
            font-size: 1rem;
        }
        
        /* Container: 2 kolommen op grotere schermen, 1 op mobiel */
        .grid-container-1 {
           display: grid;
             margin-top: 8px;
			grid-template-columns: repeat(3, 2fr);
            gap: 20px;
			margin-bottom: 10px;
            max-width: 1500px;
          }
 		
        /* Individuele tegel */ /*https://htmlcolorcodes.com/*/
        .tile {
			text-align: left;           
		   background-color :#AB9F9F;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            /* Flexbox om de inhoud netjes te centreren en de tegelhoogte te laten groeien */
			display : flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			box-sizing: border-box;
        
        }

.omkaderde-tekst {
grid-template-columns: 1fr;   
   border: 2px solid #333333;   /* 2 pixels dikke, doorgetrokken lijn in donkergrijs */
    padding: 15px;              /* Ruimte tussen de tekst en de rand */
    border-radius: 8px;         /* Optioneel: maakt de hoeken mooi afgerond */
    background-color:#AB9F9F;  /* Optioneel: geeft de achtergrond een lichte kleur */
	break-inside: avoid-column;
	margin-bottom: 8px;
	 
	 /*https://htmlcolorcodes.com/*/
}
        .hoofdtekst {
            position: relative;
            display: flow-root;
            box-sizing: border-box;
            min-height: 230px;
            text-align: center;
            background-color: #C4BF37;
            border-bottom: 3px solid #000;
            border-top: 3px solid #000;
            padding: 55px 230px 20px;
            margin-bottom: 20px;
        }

        .hoofdtekst > img {
            position: absolute;
            top: 15px;
            width: 200px;
            height: 200px;
            object-fit: cover;
            margin: 0 !important;
        }

        .hoofdtekst > img:first-child { left: 15px; }
        .hoofdtekst > img:nth-child(2) { right: 15px; }

        .top-fotobalk {
            display: flex;
            gap: 15px;
            justify-content: center;
            align-items: center;
        }

        .top-fotobalk img {
            display: block;
        }

        .fotobalk-caption {
            color: white;
            background-color: gray;
        }

        .voettekst  {
            text-align: left ;
			 background-color :#6DD1BE;
            border-bottom: 3px solid #000;
            border-top: 3px solid #000;
            padding: 15px 0;
            margin-top: 10px;
			margin-bottom: 10px;
        }
	
       .hoofdtekst h1 {
            font-size: 3.5rem;
            text-transform: uppercase;
            margin: 0;
            font-weight: bold;
            letter-spacing: 2px;
        }

       .hoofdtekst h2 {
           font-style: italic;
            margin-top: 5px;
            font-size: 1rem;
        }
		 .tekst-normaal {
			break-inside: avoid-column;           
		   margin-top: 8px;
			font-family: 'Times New Roman', Times, serif;
            background-color: #fdfcf7; /* Klassieke krantenkleur */
            color: #111;
            line-height: 1.4;
            margin: 0;
            padding: 20px;
			margin-bottom: 10px; 
			
        }
  

		 .tekst-bij-elkaar {
			break-inside: avoid-column; 
			
			}
       .slideshow-container {
            max-width: 600px;
            position: relative;
            margin: auto;
            margin-bottom: 50px; /* Ruimte tussen de slideshows */
            background-color: #EDD9C7; /* Zorgt dat witte knoppen zichtbaar zijn */
			border-radius: 8px; 
			
        }
        
        /* Zorg dat slides standaard verborgen zijn */
        .slide {
            display: none;
 }
 
 .prev, .next {
  position: absolute; /* Haalt de pijlen uit de normale stroom van de content */
  top: 50%;
  transform: translateY(-50%); /* Zet de pijl exact verticaal gecentreerd */
  color: green;
  font-weight: bold;
  font-size: 18px;
 
}
 .prev { 
    left: 15px; 
}

.next { 
    right: 15px; 
}
dialog#ochtend-middag {
  width: 700px;
  height: auto;
  background-color:#EDD9C7;
}

dialog#middag-avond {
  width: 700px;
  height: auto;
  background-color:#EDD9C7;
}
 .prev2, .next2 {
  position: absolute; /* Haalt de pijlen uit de normale stroom van de content */
  top: 50%;
  transform: translateY(-50%); /* Zet de pijl exact verticaal gecentreerd */
  color: green;
  font-weight: bold;
  font-size: 18px;
 
}
 .prev2 { 
    left: 15px; 
}

.next2 { 
    right: 15px; 
}

.foto-uitsnede {
    width: 400px;
    height: 200px;
    /* Snijdt een rechthoek uit: boven, rechts, onder, links */
    clip-path: inset(10px 10px 10px 10px);
	
  }
.foto-uitsnede-1 {
    width: 400px;
    height: 300px;
    /* Snijdt een rechthoek uit: boven, rechts, onder, links */
    clip-path: inset(10px 10px 10px 10px);
	
  }
  /* Slideshow images */
.Slide-in {
 width: 400px;
    height: 200px;
}
.slide {
 position: relative;
  text-align: center;
  display: flex;
  flex-wrap: wrap; /* Zorgt dat de tekst eventueel naar de volgende regel zakt */
  gap: 10px;       /* Ruimte tussen de grote afbeelding en de rechter kolom */
  align-items: flex-start;
}

.slide img {
    border-radius: 15px; /* Verhoog of verlaag dit getal voor meer of minder ronding */
  margin: 8px
}

/* Stijling voor de tekstvlakken */
.text-slide {
  color: #333333; /* Donkergrijze tekstkleur */
  font-size: 16px;
  padding: 8px 12px;
  background-color: #EDD9C7; /* Licht transparante achtergrond */
  border-radius: 4px;
  margin-top: 10px; /* Ruimte tussen foto en tekst */
  display: block;
}
/* Positionering voor de sluitknop */
.close-btn {
  position: absolute;
  bottom: 16px;   /* Afstand tot de onderkant */
  right: 16px;    /* Afstand tot de rechterkant */
  
  /* Optionele styling voor een nette knop */
  padding: 8px 16px;
  background-color:#333333;
  border: 1px solid #ccc;
  cursor: pointer;
}
/* Zorgt dat de twee kleine afbeeldingen onder elkaar komen te staan */
.rechter-kolom {
  display: flex;
  flex-direction: column;
  gap: 10px;       /* Ruimte tussen de twee kleine afbeeldingen */
}
.foto-naast {
  display: flex;
  flex-wrap: nowrap; /* Dwingt ze om naast elkaar te blijven staan */
  gap: 10px;
}
.foto-onder {
  display: flex; justify-content: center;
  flex-wrap: nowrap; /* Dwingt ze om naast elkaar te blijven staan */
  gap: 10px;
}



/* =========================================================
   RESPONSIEVE DIAVOORSTELLING
   - dialoog blijft volledig op het scherm
   - pijlen blijven op vaste plaatsen
   - foto's schalen mee met scherm/venster
   - geen horizontale of verticale overflow binnen de dia
   ========================================================= */

dialog#ochtend-middag,
dialog#middag-avond {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(92vw, 900px);
    height: min(88vh, 760px);
    max-width: 92vw;
    max-height: 88vh;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    overflow: hidden;
    background-color: #EDD9C7;
    border: 2px solid #333;
    border-radius: 8px;
}

/* De slideshow vult de beschikbare ruimte van de dialog. */
.slideshow-container {
    position: relative;
    width: 100%;
    height: 100%;
    max-width: none;
    margin: 0;
    padding: 42px 55px 60px;
    box-sizing: border-box;
    background-color: #EDD9C7;
    border-radius: 8px;
    overflow: hidden;
}

/* Eén dia krijgt altijd precies de beschikbare ruimte. */
.slideshow-container .slide {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    display: none;
    align-items: center;
    justify-content: center;
    align-content: center;
    flex-wrap: wrap;
    gap: 10px;
    overflow: hidden;
}

/* Foto's mogen nooit groter worden dan de dia. */
.slideshow-container .slide img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    box-sizing: border-box;
}

/* Combinaties van foto's blijven binnen de beschikbare breedte/hoogte. */
.slideshow-container .foto-naast {
    display: flex;
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    align-items: center;
    justify-content: center;
    gap: 10px;
    overflow: hidden;
    box-sizing: border-box;
}

.slideshow-container .foto-naast > img {
    max-width: calc(100% - 185px);
    max-height: 100%;
    width: auto !important;
    height: auto !important;
}

.slideshow-container .rechter-kolom {
    display: flex;
    flex-direction: column;
    width: 30%;
    max-width: 30%;
    max-height: 100%;
    gap: 10px;
    overflow: hidden;
}

.slideshow-container .rechter-kolom img {
    width: auto !important;
    max-width: 100%;
    max-height: calc((100% - 10px) / 2);
    height: auto !important;
}

.slideshow-container .foto-onder {
    display: flex;
    width: 100%;
    max-width: 100%;
    max-height: 45%;
    align-items: center;
    justify-content: center;
    gap: 10px;
    overflow: hidden;
    box-sizing: border-box;
}

.slideshow-container .foto-onder img {
    max-width: 100%;
    max-height: 100%;
    width: auto !important;
    height: auto !important;
}

/* Tekst boven een diafoto schaalt mee. */
.slideshow-container .text-slide {
    flex: 0 0 100%;
    max-width: 100%;
    box-sizing: border-box;
    text-align: center;
    margin: 0;
}

/* Pijlen staan altijd op exact dezelfde plaats binnen het venster. */
dialog .prev,
dialog .next {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 20;
    width: 34px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: green;
    font-weight: bold;
    font-size: 30px;
    line-height: 1;
    cursor: pointer;
    text-decoration: none;
}

dialog .prev {
    left: 12px;
}

dialog .next {
    right: 12px;
}

/* Sluitknop blijft onderaan rechts in de vaste dia. */
dialog .close-btn {
    position: absolute;
    right: 16px;
    bottom: 16px;
    z-index: 30;
}

/* Op een smal telefoonscherm wordt de ruimte optimaal benut. */
@media (max-width: 700px) {
    dialog#ochtend-middag,
    dialog#middag-avond {
        width: 94vw;
        height: 88vh;
        max-width: 94vw;
        max-height: 88vh;
    }

    .slideshow-container {
        padding: 38px 42px 58px;
    }

    dialog .prev,
    dialog .next {
        width: 30px;
        font-size: 26px;
    }

    dialog .prev {
        left: 6px;
    }

    dialog .next {
        right: 6px;
    }

    .slideshow-container .foto-naast {
        gap: 5px;
    }

    .slideshow-container .foto-naast > img {
        max-width: calc(100% - 125px);
    }

    .slideshow-container .rechter-kolom {
        width: 28%;
        max-width: 28%;
        gap: 5px;
    }
}

/* Reisblik 9.7.14 — foto-plaatsen en kaart */
.japan-foto-plaats {
    background-color: #d8d8d8;
    border: 1px dashed #777;
    color: #555;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-style: italic;
    box-sizing: border-box;
    padding: 8px;
}
.hoofdtekst > .japan-hoofd-foto {
    position: absolute;
    top: 15px;
    width: 200px;
    height: 200px;
    min-height: 0;
    margin: 0 !important;
}
.hoofdtekst > .japan-hoofd-foto:first-child { left: 15px; }
.hoofdtekst > .japan-hoofd-foto:nth-child(2) { right: 15px; }
.japan-map-slot {
    position: relative;
    width: 23%;
    height: 180px;
    min-width: 0;
    background-color: #ddd;
    border: 1px dashed #777;
    box-sizing: border-box;
}
.japan-reisdag-map { width: 100%; height: 100%; }
.japan-map-caption {
    position: absolute;
    left: 5px;
    bottom: 5px;
    z-index: 500;
    background: rgba(80,80,80,.8);
    color: #fff;
    padding: 3px 6px;
    font: 11px Arial, sans-serif;
}
.japan-foto-top {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 180px;
    box-sizing: border-box;
    min-width: 0;
}
@media (max-width: 700px) {
    .hoofdtekst > .japan-hoofd-foto { width: 90px; height: 90px; top: 10px; }
    .hoofdtekst > .japan-hoofd-foto:first-child { left: 10px; }
    .hoofdtekst > .japan-hoofd-foto:nth-child(2) { right: 10px; }
    .japan-map-slot, .japan-foto-top { width: 100%; height: 180px; }
    .top-fotobalk { flex-wrap: wrap; }
}
`;
  }

  function japanSlideshowScript() {
    return `<script>
    (function(){
        function show(dialog,index){
            var slides=[...dialog.querySelectorAll('.slide')];
            if(!slides.length)return;
            var n=((index%slides.length)+slides.length)%slides.length;
            slides.forEach(function(s,i){s.style.display=i===n?'flex':'none';});
        }
        document.addEventListener('click',function(e){
            var open=e.target.closest('[data-japan-open]');
            if(open){var d=document.getElementById(open.getAttribute('data-japan-open'));if(d){d.showModal();show(d,0);}return;}
            var close=e.target.closest('[data-japan-close]');
            if(close){document.getElementById(close.getAttribute('data-japan-close'))?.close();return;}
            var prev=e.target.closest('[data-japan-prev]');
            if(prev){var d=document.getElementById(prev.getAttribute('data-japan-prev'));if(d){var s=[...d.querySelectorAll('.slide')],i=s.findIndex(x=>x.style.display!=='none');show(d,(i<0?0:i)-1);}return;}
            var next=e.target.closest('[data-japan-next]');
            if(next){var d=document.getElementById(next.getAttribute('data-japan-next'));if(d){var s=[...d.querySelectorAll('.slide')],i=s.findIndex(x=>x.style.display!=='none');show(d,(i<0?0:i)+1);}return;}
        });
        document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('dialog').forEach(function(d){if(d.querySelectorAll('.slide').length)show(d,0);});});
    })();
</script>`;
  }

  async function makeJapanTravelHtml(entries,dateFrom,dateTo) {
    const period=rangeLabel(dateFrom,dateTo);
    const points=entries.map(entry=>({item:entry.item,location:findLocation(entry.item)}));
    const prepared=[];
    for(let index=0;index<entries.length;index++){
      const entry=entries[index];
      const item=entry.item||{};
      const location=findLocation(item)||{};
      const name=item.name||location.name||'Onbekende locatie';
      let result;
      if(entry.html) result=japanPrepareLocationHtml(entry.html,name,index);
      else if(entry.text) result={html:'<h2>'+escapeHtml(name)+'</h2>'+String(entry.text).split(/\n\s*\n/).filter(Boolean).map(p=>'<p>'+escapeHtml(p).replace(/\n/g,'<br>')+'</p>').join(''),dialogsHtml:''};
      else result={html:'<h2>'+escapeHtml(name)+'</h2><p><i>Geen tekst beschikbaar voor deze locatie.</i></p>',dialogsHtml:''};
      prepared.push({name,html:result.html,dialogsHtml:result.dialogsHtml});
    }

    const locationBlocks=prepared.map(entry=>`    <div class="tekst-normaal">\n${entry.html}\n    </div>`).join('\n');
    const dialogs=prepared.map(x=>x.dialogsHtml).filter(Boolean).join('\n');
    const topMap=japanTopMapHtml(points);

    return `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mijn reisdag — ${escapeHtml(period)}</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <style>
${japanTravelCss()}
    </style>
</head>
<body>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<div class="hoofdtekst">
    <div class="japan-foto-plaats japan-hoofd-foto">FOTO-PLAATS — hoofdafbeelding links</div>
    <div class="japan-foto-plaats japan-hoofd-foto">FOTO-PLAATS — hoofdafbeelding rechts</div>
    <h1>Mijn reisdag</h1>
    <h2><i>${escapeHtml(period)}</i></h2>
</div>

<div class="top-fotobalk">
${topMap}
    <div class="japan-foto-plaats japan-foto-top" style="height: 25%; width: 25%;">FOTO-PLAATS 2</div>
    <div class="japan-foto-plaats japan-foto-top" style="height: 25%; width: 25%;">FOTO-PLAATS 3</div>
    <div class="japan-foto-plaats japan-foto-top" style="height: 25%; width: 23%;">FOTO-PLAATS 4</div>
</div>
<figcaption><span class="fotobalk-caption">
    Kaart in foto 1; de overige drie plaatsen zijn gereserveerd voor reisfoto's.
</span></figcaption>

<div class="indeling-kolommen">

    <div class="tekst-bij-elkaar">
${locationBlocks}
    </div>
</div>

<div class="voettekst">
    <ul>
        <li>Reisdagboek — bezochte locaties in chronologische volgorde</li>
        <li>Foto-plaatsen blijven behouden zodat foto's later kunnen worden toegevoegd</li>
    </ul>
    <div style="display: flex; justify-content: center;">
        <button onclick="window.scrollTo({top:0,behavior:'smooth'})">Naar boven</button>
    </div>
</div>

${dialogs}

${japanSlideshowScript()}
</body>
</html>`;
  }

  async function generateJapanTravelHtml(dateFrom,dateTo){
    const btn=byId('maak-html-reis');
    if(btn){btn.disabled=true;btn.textContent='⏳ maak-html-reis…';}
    try{
      const matches=matchesForRange(dateFrom,dateTo);
      const period=rangeLabel(dateFrom,dateTo);
      if(!matches.length){alert('Geen bezochte locaties gevonden voor '+period+'.');return;}
      const entries=await buildDayData(dateFrom,dateTo);
      const html=await makeJapanTravelHtml(entries,dateFrom,dateTo);
      const filename=(dateFrom===dateTo?dateFrom:dateFrom+'-tm-'+dateTo)+'-maak-html-reis.html';
      downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),filename);
    }catch(e){console.error('Mijn reisdag: Japanstijl HTML kon niet worden gemaakt',e);alert('De Japanstijl HTML kon niet worden gemaakt.');}
    finally{if(btn){btn.disabled=false;btn.textContent='📖 maak-html-reis';}}
  }

  function makeTravelDiaryHtml(entries,dateFrom,dateTo){
    const period=rangeLabel(dateFrom,dateTo);
    const title=dateFrom===dateTo ? 'Mijn reisdag' : 'Mijn reisdagen';
    const heroes=diaryHeroData(entries);

    const heroHtml=heroes.length ? '<section class="dagboek-hero">'+heroes.map(h=>
      '<figure><img src="'+escapeHtml(h.src)+'" alt="'+escapeHtml(h.caption)+'"><figcaption>'+escapeHtml(h.caption)+'</figcaption></figure>'
    ).join('')+'</section>' : '';

    const prepared=entries.map((entry,index)=>diaryPrepareFixedHtml(entry.html,index));

    const cards=entries.map((entry,index)=>{
      const item=entry.item||{};
      const location=findLocation(item)||{};
      const when=timePart(item.visitedAt);

      let factual='';
      const fixed=prepared[index];
      if(fixed?.html){
        factual='<div class="dagboek-vaste-tekst">'+fixed.html+'</div>';
      }else if(entry.text){
        factual=diaryTextBlock('Het verhaal',entry.text);
      }

      const image=diaryPhotoHtml(item,entry.html,item.name||location.name||'');
      const meta=[when,location.address||location.category||location.type].filter(Boolean).join(' · ');

      const personal=location.userCreated
        ? (location.story||location.experience||'')
        : '';

      const experience=personal
        ? '<div class="dagboek-ervaring"><h3>MIJN ERVARING</h3>'+
          String(personal).split(/\n\s*\n/).filter(Boolean)
            .map(p=>'<p>'+escapeHtml(p).replace(/\n/g,'<br>')+'</p>').join('')+
          '</div>'
        : '';

      return '<article class="dagboek-kaart">'+
        '<div class="dagboek-kaart-kop"><span class="dagboek-nummer">'+String(index+1)+'</span>'+
        '<div class="dagboek-kaart-titel"><h2>'+escapeHtml(item.name||location.name||'Onbekende locatie')+'</h2>'+
        (meta?'<div class="dagboek-meta">'+escapeHtml(meta)+'</div>':'')+'</div></div>'+
        '<div class="dagboek-kaart-inhoud">'+image+
        '<div class="dagboek-feit">'+(factual?'<h3>HET VERHAAL</h3>'+factual:'')+'</div>'+
        '</div>'+experience+
        (fixed?.extrasHtml||'')+
        '</article>';
    }).join('\n');

    const closing=entries.length
      ? '<section class="dagboek-afsluiting"><span>✦</span><div><strong>MIJN DAG</strong><p>'+
        'Een dag vol plaatsen, verhalen en eigen herinneringen.'+
        '</p></div></section>'
      : '';

    return '<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8">'+
      '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover">'+
      '<title>'+escapeHtml(title+' — '+period)+'</title>'+
      '<style>'+travelDiaryCss()+'</style></head><body>'+
      '<main class="dagboek-pagina">'+
      '<header class="dagboek-header"><div class="dagboek-header-top"><div class="dagboek-label">REISBLIK · MIJN REISDAGBOEK</div></div>'+
      '<h1>MIJN REISDAG</h1>'+
      '<h2>'+escapeHtml(title)+'</h2>'+
      '<div class="dagboek-datum">'+escapeHtml(formatDiaryDate(dateFrom))+
      (dateFrom!==dateTo?' <span>t/m '+escapeHtml(formatDiaryDate(dateTo))+'</span>':'')+'</div></header>'+
      heroHtml+
      '<section class="dagboek-bezocht"><span class="dagboek-pin">●</span><strong>BEZOCHT</strong><em>De plekken van vandaag</em></section>'+
      (entries.length?'<section class="dagboek-grid">'+cards+'</section>':'<p class="dagboek-leeg">Er zijn voor deze periode nog geen bezochte locaties geselecteerd.</p>')+
      closing+
      '<footer class="dagboek-footer">Reizen verrijkt niet alleen je blik, maar ook je verhaal.</footer>'+
      '</main>'+diaryClientScript()+'</body></html>';
  }

  async function buildSelectedDiaryHtml(dateFrom,dateTo){
    const matches=matchesForRange(dateFrom,dateTo);
    const period=rangeLabel(dateFrom,dateTo);
    if(!matches.length){
      alert('Geen bezochte locaties gevonden voor '+period+'.');
      return null;
    }
    const entries=await buildDayData(dateFrom,dateTo);
    return makeTravelDiaryHtml(entries,dateFrom,dateTo);
  }

  async function generateSelectedDiaryHtml(dateFrom,dateTo){
    const btn=byId('reisdagDiaryBtn');
    if(btn){btn.disabled=true;btn.textContent='⏳ HTML maken…';}
    try{
      const html=await buildSelectedDiaryHtml(dateFrom,dateTo);
      if(!html)return;
      const filename=(dateFrom===dateTo?dateFrom:dateFrom+'-tm-'+dateTo)+'-reisdagboek.html';
      downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),filename);
    }catch(e){
      console.error('Mijn reisdag: HTML kon niet worden gemaakt',e);
      alert('De reisdagboek-HTML kon niet worden gemaakt.');
    }finally{
      if(btn){btn.disabled=false;btn.textContent='📖 HTML maken';}
    }
  }

  async function showSelectedDiaryHtml(dateFrom,dateTo){
    const win=window.open('about:blank','_blank');
    if(!win){alert('De reisdag kan niet worden geopend. Sta pop-ups voor Reisblik toe.');return;}
    win.document.write('<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>Reisdag wordt opgebouwd…</title></head><body style="font-family:Arial,sans-serif;padding:30px">Reisdag wordt opgebouwd…</body></html>');
    win.document.close();
    try{
      const html=await buildSelectedDiaryHtml(dateFrom,dateTo);
      if(!html){win.close();return;}
      const base=new URL('./',location.href).href.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
      const previewHtml=html.replace('<head>','<head><base href="'+base+'">');
      win.document.open();
      win.document.write(previewHtml);
      win.document.close();
    }catch(e){
      console.error('Mijn reisdag: HTML kon niet worden getoond',e);
      win.document.open();
      win.document.write('<!doctype html><html lang="nl"><body style="font-family:Arial,sans-serif;padding:30px"><strong>De reisdag kon niet worden getoond.</strong></body></html>');
      win.document.close();
    }
  }

  function travelDiaryCss(){
    return `
      *{box-sizing:border-box}
      html{width:100%;min-width:0}body{margin:0;width:100%;min-width:0;background:#e8e5df;color:#202b2f;font-family:Georgia,'Times New Roman',serif;line-height:1.48;overflow-x:hidden}
      .dagboek-pagina{width:100%;max-width:1180px;margin:0 auto;background:#fbfaf6;min-height:100vh;padding:30px 34px 46px}
      .dagboek-header{background:#e8df73;border-top:4px solid #1e292d;border-bottom:4px solid #1e292d;text-align:center;padding:18px 28px 22px;margin-bottom:18px}
      .dagboek-header-top{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:6px}
      .dagboek-label{font:700 11px/1.2 Arial,sans-serif;letter-spacing:3px;color:#354247}
      .dagboek-header h1{margin:0;font-size:clamp(40px,6vw,72px);line-height:.95;letter-spacing:1px}
      .dagboek-header h2{margin:10px 0 8px;font-size:clamp(22px,3vw,38px);font-style:italic;line-height:1.1}
      .dagboek-datum{font:600 13px/1.3 Arial,sans-serif;letter-spacing:2px;text-transform:uppercase}
      .dagboek-hero{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:0 0 18px}
      .dagboek-hero figure{position:relative;margin:0;min-width:0}.dagboek-hero img{display:block;width:100%;height:300px;object-fit:cover}
      .dagboek-hero figcaption,.dagboek-foto figcaption{position:absolute;left:8px;bottom:8px;background:rgba(25,34,38,.82);color:#fff;padding:4px 8px;font:italic 14px/1.2 Georgia,serif}
      .dagboek-intro{background:#f1ead8;border-left:5px solid #a9bfae;padding:13px 16px;margin:0 0 18px}.dagboek-intro p{margin:0 0 7px}.dagboek-intro p:last-child{margin-bottom:0}
      .dagboek-bezocht{display:flex;align-items:center;gap:12px;background:#c7e1df;padding:11px 16px;margin:0 0 22px;border-top:1px solid #a9c9c7;border-bottom:1px solid #a9c9c7}.dagboek-pin{font:22px Arial,sans-serif}.dagboek-bezocht strong{font-size:28px;letter-spacing:1px}.dagboek-bezocht em{margin-left:auto;font-size:20px}
      .dagboek-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}.dagboek-kaart{break-inside:avoid;border:1px solid #ddd4ca;background:#fcfaf5;overflow:hidden}
      .dagboek-kaart-kop{display:flex;background:#e8d2cb;min-height:54px;align-items:stretch}.dagboek-nummer{display:flex;align-items:center;justify-content:center;background:#1e292d;color:#fff;font:bold 22px Arial,sans-serif;width:52px;flex:0 0 52px}.dagboek-kaart-titel{padding:8px 10px 7px;min-width:0}.dagboek-kaart-kop h2{font-size:22px;line-height:1.08;margin:0 0 4px}.dagboek-meta{font:12px/1.3 Arial,sans-serif;color:#5e686b}
      .dagboek-kaart-inhoud{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px 12px 0}.dagboek-foto{margin:0;position:relative;min-width:0}.dagboek-foto img{display:block;width:100%;height:190px;object-fit:cover}.dagboek-feit{min-width:0}.dagboek-feit h3,.dagboek-blok h3,.dagboek-vaste-tekst h3{font:bold 11px/1.2 Arial,sans-serif;letter-spacing:1.5px;margin:0 0 7px;color:#3d4b50}.dagboek-vaste-tekst{font-size:15px;line-height:1.45}.dagboek-vaste-tekst p{margin:0 0 9px}.dagboek-vaste-tekst h1,.dagboek-vaste-tekst h2,.dagboek-vaste-tekst h3{font-family:Georgia,'Times New Roman',serif}.dagboek-vaste-tekst img{max-width:100%;height:auto}.dagboek-vaste-tekst .omkaderde-tekst{display:block}
      .dagboek-ervaring,.dagboek-notitie{margin:12px;background:#dce8df;padding:10px 12px}.dagboek-ervaring p,.dagboek-notitie p{font-size:15px;margin:0 0 6px}.dagboek-ervaring p:last-child,.dagboek-notitie p:last-child{margin-bottom:0}.dagboek-notitie{background:#eee8d7}
      .dagboek-extra-trigger{display:flex;align-items:center;gap:10px;background:#dce8df;margin:12px;padding:9px 10px}.dagboek-extra-trigger button{border:1px solid #8ca79a;background:#fff;border-radius:8px;padding:8px 11px;font:700 13px Arial,sans-serif;cursor:pointer}.dagboek-extra-trigger span{font-size:13px;font-style:italic}
      .dagboek-slideshow-dialog{border:0;border-radius:12px;padding:0;width:min(900px,94vw);max-width:900px;background:#fbfaf6;box-shadow:0 20px 60px rgba(0,0,0,.3)}.dagboek-slideshow-dialog::backdrop{background:rgba(0,0,0,.65)}.dagboek-slideshow-head{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #ddd4ca;font:700 16px Arial,sans-serif}.dagboek-slideshow-head button{border:0;background:transparent;font-size:22px;cursor:pointer}.dagboek-slideshow-body{padding:14px;min-height:180px;display:flex;align-items:center;justify-content:center}.dagboek-slide{width:100%;text-align:center}.dagboek-slide img{max-width:100%;max-height:68vh;width:auto;height:auto;object-fit:contain;margin:4px;vertical-align:middle}.dagboek-slide[hidden]{display:none}.dagboek-slideshow-controls{display:flex;justify-content:center;align-items:center;gap:22px;padding:10px 16px 16px}.dagboek-slideshow-controls button{width:42px;height:42px;border-radius:50%;border:1px solid #9ba9a9;background:#fff;font-size:30px;line-height:1;cursor:pointer}.dagboek-slideshow-controls span{font:600 13px Arial,sans-serif;color:#596467}
      .dagboek-afsluiting{display:flex;gap:12px;align-items:center;border-top:2px solid #26353a;border-bottom:1px solid #c9c2b8;margin:28px 0 18px;padding:13px 4px}.dagboek-afsluiting>span{font-size:28px}.dagboek-afsluiting strong{font:bold 18px Arial,sans-serif;letter-spacing:1.5px}.dagboek-afsluiting p{margin:2px 0 0;font-style:italic;font-size:16px}.dagboek-leeg{text-align:center;padding:30px}.dagboek-footer{text-align:center;padding:15px;font-style:italic;font-size:17px;border-top:1px solid #26353a}
      @media(max-width:760px){html,body{width:100%;min-width:0}.dagboek-pagina{width:100%;max-width:none;margin:0;padding:14px 12px 30px}.dagboek-header{padding:16px 12px 17px}.dagboek-header-top{align-items:flex-start}.dagboek-label{letter-spacing:2px;font-size:9px}.dagboek-header h1{font-size:39px}.dagboek-header h2{font-size:22px}.dagboek-hero{grid-template-columns:1fr;gap:10px}.dagboek-hero img{height:230px}.dagboek-bezocht{margin-bottom:14px}.dagboek-bezocht strong{font-size:24px}.dagboek-bezocht em{font-size:15px}.dagboek-grid{grid-template-columns:1fr;gap:14px}.dagboek-kaart-kop h2{font-size:20px}.dagboek-kaart-inhoud{grid-template-columns:1fr;padding:10px 10px 0}.dagboek-foto img{height:auto;max-height:none}.dagboek-feit{padding-top:2px}.dagboek-vaste-tekst{font-size:16px}.dagboek-extra-trigger{margin:10px}.dagboek-slideshow-dialog{width:96vw}.dagboek-slide img{max-height:62vh}}
      @media print{body{background:#fff}.dagboek-pagina{width:auto;padding:10mm}.dagboek-header,.dagboek-bezocht,.dagboek-kaart-kop,.dagboek-ervaring,.dagboek-notitie{-webkit-print-color-adjust:exact;print-color-adjust:exact}.dagboek-grid{gap:12px}.dagboek-kaart{break-inside:avoid}.dagboek-extra-trigger{break-inside:avoid}}
    `;
  }

  function ensureResultsPanel(){
    let panel=byId('reisdagResults');
    if(panel)return panel;

    panel=document.createElement('div');
    panel.id='reisdagResults';
    panel.className='reisdag-results';

    const host=byId('reisdagResultsHost');
    if(host)host.appendChild(panel);
    else{
      const button=byId('reisdagOpenBtn');
      if(button&&button.parentNode)button.parentNode.insertBefore(panel,button.nextSibling);
      else document.body.appendChild(panel);
    }
    return panel;
  }

  let reisdagMapInstance=null;
  let reisdagMapMarkers=[];

  function closeSelectedLocationsMap(){
    const overlay=byId('reisdagMapOverlay');
    if(overlay)overlay.style.display='none';
    reisdagMapMarkers.forEach(m=>{
      try{reisdagMapInstance?.removeLayer(m);}catch(e){}
    });
    reisdagMapMarkers=[];
  }

  function showSelectedLocationsOnMap(dateFrom,dateTo){
    const overlay=byId('reisdagMapOverlay');
    const mapEl=byId('reisdagMap');
    const status=byId('reisdagMapStatus');
    if(!overlay||!mapEl||typeof L==='undefined'){
      alert('De kaart kan niet worden geopend.');
      return;
    }

    const matches=matchesForRange(dateFrom,dateTo);
    const points=matches.map(item=>({item,location:findLocation(item)}))
      .filter(x=>x.location && Number.isFinite(Number(x.location.lat)) && Number.isFinite(Number(x.location.lon)));

    if(!points.length){
      alert('Voor '+rangeLabel(dateFrom,dateTo)+' zijn geen geselecteerde locaties met GPS-coördinaten gevonden.');
      return;
    }

    overlay.style.display='flex';
    const title=byId('reisdagMapTitle');
    if(title)title.textContent='🗺️ Mijn reisdag — '+rangeLabel(dateFrom,dateTo);
    if(status)status.textContent=points.length+' geselecteerde locatie'+(points.length===1?'':'s');

    if(!reisdagMapInstance){
      reisdagMapInstance=L.map(mapEl).setView([points[0].location.lat,points[0].location.lon],13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        maxZoom:19,
        attribution:'© OpenStreetMap contributors'
      }).addTo(reisdagMapInstance);
    }

    reisdagMapMarkers.forEach(m=>{
      try{reisdagMapInstance.removeLayer(m);}catch(e){}
    });
    reisdagMapMarkers=[];

    const bounds=[];
    points.forEach(({item,location})=>{
      const lat=Number(location.lat),lon=Number(location.lon);
      bounds.push([lat,lon]);
      const marker=L.marker([lat,lon],{
        icon:typeof categoryIcon==='function'
          ? categoryIcon(userLocationCategory(location))
          : undefined
      }).addTo(reisdagMapInstance);
      marker.bindPopup(
        '<div class="marker-popup">'+
        '<div style="font-weight:700;font-size:16px">'+escapeHtml(item.name||location.name||'Onbekende locatie')+'</div>'+
        (location.address?'<div style="margin:3px 0 8px;color:#555">'+escapeHtml(location.address)+'</div>':'')+
        '<div style="margin-top:6px">Bezocht: '+escapeHtml(dateTimePart(item.visitedAt))+'</div>'+
        '</div>'
      );
      reisdagMapMarkers.push(marker);
    });

    if(bounds.length===1){
      reisdagMapInstance.setView(bounds[0],14);
    }else{
      reisdagMapInstance.fitBounds(bounds,{padding:[60,60],maxZoom:14});
    }
    setTimeout(()=>reisdagMapInstance.invalidateSize(),100);
  }

  function showResults(dateFrom,dateTo){
    const panel=ensureResultsPanel();
    panel.style.display='block';
    panel.innerHTML='';

    const title=document.createElement('h4');
    title.textContent='Mijn reisdag — '+rangeLabel(dateFrom,dateTo);
    panel.appendChild(title);

    const matches=matchesForRange(dateFrom,dateTo);

    if(!matches.length){
      const empty=document.createElement('div');
      empty.className='reisdag-empty';
      empty.textContent='Geen bezochte locaties gevonden voor deze datum.';
      panel.appendChild(empty);
      return;
    }

    const intro=document.createElement('div');
    intro.className='reisdag-summary';
    intro.textContent=matches.length+' bezochte locatie'+(matches.length===1?'':'s');
    panel.appendChild(intro);

    const ul=document.createElement('ul');
    matches.forEach(item=>{
      const li=document.createElement('li');
      const when=dateTimePart(item.visitedAt);
      li.textContent=(when?when+' — ':'')+(item.name||'Onbekende locatie')+
        (item.category?' ('+item.category+')':'');
      ul.appendChild(li);
    });
    panel.appendChild(ul);

    const actions=document.createElement('div');
    actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:12px';

    const word=document.createElement('button');
    word.id='reisdagWordBtn';
    word.type='button';
    word.textContent='📄 Download DOC';
    word.onclick=()=>downloadWord(dateFrom,dateTo);

    const map=document.createElement('button');
    map.id='reisdagMapBtn';
    map.type='button';
    map.textContent='🗺️ Toon op kaart';
    map.onclick=()=>showSelectedLocationsOnMap(dateFrom,dateTo);

    const diary=document.createElement('button');
    diary.id='reisdagDiaryBtn';
    diary.type='button';
    diary.textContent='📖 HTML maken';
    diary.onclick=()=>generateSelectedDiaryHtml(dateFrom,dateTo);

    const japan=document.createElement('button');
    japan.id='maak-html-reis';
    japan.type='button';
    japan.textContent='📖 maak-html-reis';
    japan.onclick=()=>generateJapanTravelHtml(dateFrom,dateTo);

    const preview=document.createElement('button');
    preview.id='reisdagPreviewBtn';
    preview.type='button';
    preview.textContent='👁️ Toon reisdag';
    preview.onclick=()=>showSelectedDiaryHtml(dateFrom,dateTo);

    actions.appendChild(word);
    actions.appendChild(diary);
    actions.appendChild(japan);
    actions.appendChild(preview);
    actions.appendChild(map);
    panel.appendChild(actions);
  }

  function openMijnReisdag(){
    const overlay=byId('reisdagOverlay');
    const from=byId('reisdagDateFrom');
    const to=byId('reisdagDateTo');
    if(!overlay||!from||!to)return;
    const savedFrom=localStorage.getItem(storageKey(DATE_FROM_BASE_KEY))||localStorage.getItem(storageKey(DATE_BASE_KEY))||'';
    const savedTo=localStorage.getItem(storageKey(DATE_TO_BASE_KEY))||savedFrom;
    if(savedFrom)from.value=savedFrom;
    if(savedTo)to.value=savedTo;
    overlay.style.display='flex';
    setTimeout(()=>from.focus(),0);
  }

  function closeMijnReisdag(){
    const overlay=byId('reisdagOverlay');
    if(overlay)overlay.style.display='none';
  }

  function chooseMijnReisdag(){
    const from=byId('reisdagDateFrom');
    const to=byId('reisdagDateTo');
    const status=byId('reisdagStatus');
    if(!from||!from.value||!to||!to.value){
      if(status)status.textContent='Kies zowel een datum van als een datum t/m.';
      return;
    }
    if(to.value<from.value){
      if(status)status.textContent='Datum t/m kan niet vóór Datum van liggen.';
      return;
    }
    localStorage.setItem(storageKey(DATE_FROM_BASE_KEY),from.value);
    localStorage.setItem(storageKey(DATE_TO_BASE_KEY),to.value);
    // Keep the old single-date key compatible with existing app state.
    localStorage.setItem(storageKey(DATE_BASE_KEY),from.value);
    if(status)status.textContent='Gekozen periode: '+rangeLabel(from.value,to.value);
    showResults(from.value,to.value);
    closeMijnReisdag();
  }

  function refreshForVacation(){
    const from=localStorage.getItem(storageKey(DATE_FROM_BASE_KEY))||localStorage.getItem(storageKey(DATE_BASE_KEY))||'';
    const to=localStorage.getItem(storageKey(DATE_TO_BASE_KEY))||from;
    if(from&&to)showResults(from,to);
    else { const box=byId('reisdagResults'); if(box) box.innerHTML=''; }
  }

  document.addEventListener('DOMContentLoaded',function(){
    const open=byId('reisdagOpenBtn');
    const cancel=byId('reisdagCancelBtn');
    const choose=byId('reisdagChooseBtn');
    if(open)open.addEventListener('click',openMijnReisdag);
    if(cancel)cancel.addEventListener('click',closeMijnReisdag);
    if(choose)choose.addEventListener('click',chooseMijnReisdag);

    const mapClose=byId('reisdagMapCloseBtn');
    if(mapClose)mapClose.addEventListener('click',closeSelectedLocationsMap);
    const mapOverlay=byId('reisdagMapOverlay');
    if(mapOverlay)mapOverlay.addEventListener('click',function(e){
      if(e.target===mapOverlay)closeSelectedLocationsMap();
    });
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape' && byId('reisdagMapOverlay')?.style.display==='flex')closeSelectedLocationsMap();
    });

    const savedFrom=localStorage.getItem(storageKey(DATE_FROM_BASE_KEY))||localStorage.getItem(storageKey(DATE_BASE_KEY));
    const savedTo=localStorage.getItem(storageKey(DATE_TO_BASE_KEY))||savedFrom;
    if(savedFrom&&savedTo)showResults(savedFrom,savedTo);
    if(window.reisblikVakantie?.onVakantieGewijzigd) window.reisblikVakantie.onVakantieGewijzigd(refreshForVacation);
  });
})();