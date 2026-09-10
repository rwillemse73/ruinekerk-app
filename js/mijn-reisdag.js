/* Reisblik 9.7.4 – Mijn reisdag
   Bestaande Mijn reisdag-selectie, Word-export en nieuwe Reisdagboek-tussenpagina.
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
    }).join('');

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
        }).join('');
        return '<dialog class="dagboek-slideshow-dialog" id="'+extra.id+'">'+
          '<div class="dagboek-slideshow-head"><strong>Extra foto\'s</strong><button type="button" data-close-diary-slideshow="'+extra.id+'">✕</button></div>'+
          '<div class="dagboek-slideshow-body">'+slideHtml+'</div>'+
          '<div class="dagboek-slideshow-controls"><button type="button" data-slide-prev="'+extra.id+'">‹</button><span data-slide-status="'+extra.id+'"></span><button type="button" data-slide-next="'+extra.id+'">›</button></div>'+
          '</dialog>';
      }).join('');

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

  function diaryClientScript(storageKey,initialDraft,count){
    const safeKey=JSON.stringify(String(storageKey||'')).replace(/</g,'\\u003c');
    const safeDraft=JSON.stringify(initialDraft||{}).replace(/</g,'\\u003c');
    return `<script>
(function(){
  const storageKey=${safeKey};
  let state=${safeDraft};
  const count=${Number(count)||0};
  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\"/g,'&quot;');}
  function paragraphs(text){return String(text||'').split(/\\n\\s*\\n/).map(s=>s.trim()).filter(Boolean).map(p=>'<p>'+esc(p).replace(/\\n/g,'<br>')+'</p>').join('');}
  function save(){
    try{localStorage.setItem(storageKey,JSON.stringify({version:'1',savedAt:new Date().toISOString(),...state}));return true;}catch(e){return false;}
  }
  function openEditor(){
    const modal=document.getElementById('dagboekEditModal'); if(!modal)return;
    document.getElementById('diaryPageTitleInput').value=state.title||'';
    document.getElementById('diaryPageIntroInput').value=state.intro||'';
    for(let i=0;i<count;i++){
      const item=(state.items||[])[i]||{};
      const s=document.querySelector('[data-edit-story="'+i+'"]');
      const n=document.querySelector('[data-edit-note="'+i+'"]');
      if(s)s.value=item.story||''; if(n)n.value=item.note||'';
    }
    modal.showModal();
  }
  function apply(){
    const title=document.getElementById('diaryPageTitleInput')?.value||'Mijn reisdag';
    const intro=document.getElementById('diaryPageIntroInput')?.value||'';
    state={...state,title,intro,items:Array.from({length:count},(_,i)=>({
      story:document.querySelector('[data-edit-story="'+i+'"]')?.value||'',
      note:document.querySelector('[data-edit-note="'+i+'"]')?.value||''
    }))};
    save();
    const h=document.querySelector('.dagboek-header h2'); if(h)h.textContent=title;
    const introEl=document.querySelector('.dagboek-intro');
    if(introEl){introEl.innerHTML=intro?paragraphs(intro):'';introEl.hidden=!intro;}
    state.items.forEach((item,i)=>{
      const card=document.querySelector('[data-diary-card="'+i+'"]'); if(!card)return;
      const exp=card.querySelector('[data-diary-experience]');
      const note=card.querySelector('[data-diary-note-display]');
      if(exp){exp.innerHTML=item.story?'<h3>MIJN ERVARING</h3>'+paragraphs(item.story):'';exp.hidden=!item.story;}
      if(note){note.innerHTML=item.note?'<h3>MIJN NOTITIE</h3>'+paragraphs(item.note):'';note.hidden=!item.note;}
    });
    document.getElementById('dagboekEditModal')?.close();
    const status=document.getElementById('dagboekEditStatus'); if(status){status.textContent='✓ Opgeslagen op dit apparaat';setTimeout(()=>status.textContent='',2200);}
  }
  function generate(){
    // Maak een schone kopie van de huidige pagina zonder de bewerkinterface.
    const clone=document.documentElement.cloneNode(true);
    clone.querySelector('#dagboekEditModal')?.remove();
    clone.querySelector('#dagboekEditBtn')?.remove();
    clone.querySelectorAll('.dagboek-slideshow-dialog').forEach(d=>d.remove());
    const html='<!DOCTYPE html>\\n'+clone.outerHTML;
    const blob=new Blob([html],{type:'text/html;charset=utf-8'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url;a.download=(document.title||'reisdagboek').replace(/[\\/:*?"<>|]+/g,'-')+'.html';
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  function setupSlides(){
    document.querySelectorAll('[data-open-diary-slideshow]').forEach(btn=>btn.addEventListener('click',()=>{
      const d=document.getElementById(btn.dataset.openDiarySlideshow); if(!d)return; d.showModal();showSlide(d,0);
    }));
    document.querySelectorAll('[data-close-diary-slideshow]').forEach(btn=>btn.addEventListener('click',()=>document.getElementById(btn.dataset.closeDiarySlideshow)?.close());
    document.querySelectorAll('[data-slide-prev]').forEach(btn=>btn.addEventListener('click',()=>stepSlide(document.getElementById(btn.dataset.slidePrev),-1)));
    document.querySelectorAll('[data-slide-next]').forEach(btn=>btn.addEventListener('click',()=>stepSlide(document.getElementById(btn.dataset.slideNext),1)));
    document.querySelectorAll('.dagboek-slideshow-dialog').forEach(d=>showSlide(d,0));
  }
  function showSlide(d,i){if(!d)return;const slides=[...d.querySelectorAll('.dagboek-slide')];if(!slides.length)return;let n=((i%slides.length)+slides.length)%slides.length;slides.forEach((s,j)=>s.hidden=j!==n);const st=d.querySelector('[data-slide-status]');if(st)st.textContent=(n+1)+' / '+slides.length;d.dataset.slideIndex=n;}
  function stepSlide(d,delta){const i=Number(d?.dataset.slideIndex||0);showSlide(d,i+delta);}
  document.addEventListener('DOMContentLoaded',function(){
    document.getElementById('dagboekEditBtn')?.addEventListener('click',openEditor);
    document.getElementById('dagboekEditSave')?.addEventListener('click',apply);
    document.getElementById('dagboekGenerateBtn')?.addEventListener('click',generate);
    document.getElementById('dagboekEditClose')?.addEventListener('click',()=>document.getElementById('dagboekEditModal')?.close());
    setupSlides();
  });
})();
</script>`;
  }

  function makeTravelDiaryHtml(entries,dateFrom,dateTo,draft){
    const period=rangeLabel(dateFrom,dateTo);
    const title=dateFrom===dateTo ? 'Mijn reisdag' : 'Mijn reisdagen';
    const saved=draft||{};
    const firstName=entries[0]?.item?.name||'';
    const pageTitle=saved.title || firstName || title;
    const intro=saved.intro || '';
    const savedItems=Array.isArray(saved.items)?saved.items:[];
    const heroes=diaryHeroData(entries);

    const heroHtml=heroes.length ? '<section class="dagboek-hero">'+heroes.map(h=>
      '<figure><img src="'+escapeHtml(h.src)+'" alt="'+escapeHtml(h.caption)+'"><figcaption>'+escapeHtml(h.caption)+'</figcaption></figure>'
    ).join('')+'</section>' : '';

    const prepared=entries.map((entry,index)=>diaryPrepareFixedHtml(entry.html,index));
    const cards=entries.map((entry,index)=>{
      const item=entry.item||{};
      const location=findLocation(item)||{};
      const savedItem=savedItems[index]||{};
      const when=timePart(item.visitedAt);
      const personal=savedItem.story ?? (location.userCreated?(location.story||location.experience||''):'');
      const note=savedItem.note ?? '';
      let factual='';
      const fixed=prepared[index];
      if(fixed?.html){
        factual='<div class="dagboek-vaste-tekst">'+fixed.html+'</div>';
      }else if(entry.text){
        factual=diaryTextBlock('Het verhaal',entry.text);
      }
      const image=diaryPhotoHtml(item,entry.html,item.name||location.name||'');
      const meta=[when,location.address||location.category||location.type].filter(Boolean).join(' · ');
      const experience=personal ? '<div class="dagboek-ervaring" data-diary-experience><h3>MIJN ERVARING</h3>'+String(personal).split(/\n\s*\n/).filter(Boolean).map(p=>'<p>'+escapeHtml(p).replace(/\n/g,'<br>')+'</p>').join('')+'</div>' : '<div class="dagboek-ervaring" data-diary-experience hidden></div>';
      const noteBlock=note ? '<div class="dagboek-notitie" data-diary-note-display><h3>MIJN NOTITIE</h3>'+String(note).split(/\n\s*\n/).filter(Boolean).map(p=>'<p>'+escapeHtml(p).replace(/\n/g,'<br>')+'</p>').join('')+'</div>' : '<div class="dagboek-notitie" data-diary-note-display hidden></div>';
      return '<article class="dagboek-kaart" data-diary-card="'+index+'">'+
        '<div class="dagboek-kaart-kop"><span class="dagboek-nummer">'+String(index+1)+'</span>'+ 
        '<div class="dagboek-kaart-titel"><h2>'+escapeHtml(item.name||location.name||'Onbekende locatie')+'</h2>'+ 
        (meta?'<div class="dagboek-meta">'+escapeHtml(meta)+'</div>':'')+'</div></div>'+ 
        '<div class="dagboek-kaart-inhoud">'+image+ 
        '<div class="dagboek-feit">'+(factual?'<h3>HET VERHAAL</h3>'+factual:'')+'</div>'+ 
        '</div>'+experience+noteBlock+
        (fixed?.extrasHtml||'')+
        '</article>';
    }).join('');

    const closing=entries.length ? '<section class="dagboek-afsluiting"><span>✦</span><div><strong>MIJN DAG</strong><p>'+
      (intro?escapeHtml(intro):'Een dag vol plaatsen, verhalen en eigen herinneringen.')+
      '</p></div></section>' : '';

    const introHtml=intro?'<section class="dagboek-intro">'+String(intro).split(/\n\s*\n/).filter(Boolean).map(p=>'<p>'+escapeHtml(p).replace(/\n/g,'<br>')+'</p>').join('')+'</section>':'<section class="dagboek-intro" hidden></section>';
    const storageKeyForPage=diaryDraftKey(dateFrom,dateTo);
    const editModal='<dialog id="dagboekEditModal" class="dagboek-edit-dialog">'+
      '<div class="dagboek-edit-head"><h2>✏️ Reisdagboek bewerken</h2><button type="button" id="dagboekEditClose">✕</button></div>'+
      '<label>Titel<textarea id="diaryPageTitleInput" rows="2"></textarea></label>'+
      '<label>Inleiding<textarea id="diaryPageIntroInput" rows="4"></textarea></label>'+
      entries.map((entry,index)=>'<fieldset><legend>'+(index+1)+'. '+escapeHtml(entry.item?.name||'Locatie')+'</legend><label>Mijn ervaring<textarea data-edit-story="'+index+'" rows="6"></textarea></label><label>Mijn notitie<textarea data-edit-note="'+index+'" rows="4"></textarea></label></fieldset>').join('')+
      '<div class="dagboek-edit-actions"><button type="button" id="dagboekEditSave">💾 Opslaan</button><button type="button" id="dagboekGenerateBtn">🌐 HTML genereren</button><span id="dagboekEditStatus"></span></div>'+
      '</dialog>';

    return '<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8">'+
      '<meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<title>'+escapeHtml(pageTitle+' — '+period)+'</title>'+
      '<style>'+travelDiaryCss()+'</style></head><body>'+ 
      '<main class="dagboek-pagina">'+
      '<header class="dagboek-header"><div class="dagboek-header-top"><div class="dagboek-label">REISBLIK · MIJN REISDAGBOEK</div><button id="dagboekEditBtn" type="button" class="dagboek-edit-btn">✏️ Bewerken</button></div>'+ 
      '<h1>MIJN REISDAG</h1>'+ 
      '<h2>'+escapeHtml(pageTitle)+'</h2>'+ 
      '<div class="dagboek-datum">'+escapeHtml(formatDiaryDate(dateFrom))+
      (dateFrom!==dateTo?' <span>t/m '+escapeHtml(formatDiaryDate(dateTo))+'</span>':'')+'</div></header>'+heroHtml+introHtml+ 
      '<section class="dagboek-bezocht"><span class="dagboek-pin">●</span><strong>BEZOCHT</strong><em>De plekken van vandaag</em></section>'+ 
      (entries.length?'<section class="dagboek-grid">'+cards+'</section>':'<p class="dagboek-leeg">Er zijn voor deze periode nog geen bezochte locaties geselecteerd.</p>')+
      closing+ 
      '<footer class="dagboek-footer">Reizen verrijkt niet alleen je blik, maar ook je verhaal.</footer>'+ 
      '</main>'+editModal+diaryClientScript(storageKeyForPage,saved,entries.length)+'</body></html>';
  }

  function travelDiaryCss(){
    return `
      *{box-sizing:border-box}
      body{margin:0;background:#e8e5df;color:#202b2f;font-family:Georgia,'Times New Roman',serif;line-height:1.48}
      .dagboek-pagina{width:min(1180px,100%);margin:0 auto;background:#fbfaf6;min-height:100vh;padding:30px 34px 46px}
      .dagboek-header{background:#e8df73;border-top:4px solid #1e292d;border-bottom:4px solid #1e292d;text-align:center;padding:18px 28px 22px;margin-bottom:18px}
      .dagboek-header-top{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:6px}
      .dagboek-label{font:700 11px/1.2 Arial,sans-serif;letter-spacing:3px;color:#354247}
      .dagboek-edit-btn{border:0;border-radius:999px;background:#26353a;color:#fff;padding:9px 15px;font:700 13px Arial,sans-serif;cursor:pointer}
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
      .dagboek-edit-dialog{border:0;border-radius:12px;width:min(760px,94vw);max-height:90vh;padding:0;background:#fbfaf6;box-shadow:0 20px 60px rgba(0,0,0,.35)}.dagboek-edit-dialog::backdrop{background:rgba(0,0,0,.6)}.dagboek-edit-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#c7e1df;border-bottom:1px solid #a9c9c7}.dagboek-edit-head h2{margin:0;font-size:22px}.dagboek-edit-head button{border:0;background:transparent;font-size:22px;cursor:pointer}.dagboek-edit-dialog>label,.dagboek-edit-dialog fieldset{display:block;margin:14px 18px}.dagboek-edit-dialog label{font:700 13px Arial,sans-serif;color:#344348}.dagboek-edit-dialog textarea{display:block;width:100%;margin-top:6px;border:1px solid #c9c2b8;border-radius:7px;padding:9px;font:15px/1.45 Georgia,serif;background:#fff}.dagboek-edit-dialog fieldset{border:1px solid #d7cec2;border-radius:8px}.dagboek-edit-dialog legend{padding:0 6px;font-weight:700}.dagboek-edit-actions{position:sticky;bottom:0;background:#fbfaf6;border-top:1px solid #ddd4ca;padding:12px 18px;display:flex;align-items:center;gap:8px}.dagboek-edit-actions button{border:0;border-radius:7px;padding:9px 13px;font:700 13px Arial,sans-serif;cursor:pointer}.dagboek-edit-actions button:first-child{background:#26353a;color:#fff}.dagboek-edit-actions span{font:12px Arial,sans-serif;color:#4d695b}
      @media(max-width:760px){.dagboek-pagina{padding:14px 12px 30px}.dagboek-header{padding:16px 12px 17px}.dagboek-header-top{align-items:flex-start}.dagboek-label{letter-spacing:2px;font-size:9px}.dagboek-edit-btn{padding:8px 10px;font-size:12px}.dagboek-header h1{font-size:39px}.dagboek-header h2{font-size:22px}.dagboek-hero{grid-template-columns:1fr;gap:10px}.dagboek-hero img{height:230px}.dagboek-bezocht{margin-bottom:14px}.dagboek-bezocht strong{font-size:24px}.dagboek-bezocht em{font-size:15px}.dagboek-grid{grid-template-columns:1fr;gap:14px}.dagboek-kaart-kop h2{font-size:20px}.dagboek-kaart-inhoud{grid-template-columns:1fr;padding:10px 10px 0}.dagboek-foto img{height:auto;max-height:none}.dagboek-feit{padding-top:2px}.dagboek-vaste-tekst{font-size:16px}.dagboek-extra-trigger{margin:10px}.dagboek-slideshow-dialog{width:96vw}.dagboek-slide img{max-height:62vh}}
      @media print{body{background:#fff}.dagboek-pagina{width:auto;padding:10mm}.dagboek-header,.dagboek-bezocht,.dagboek-kaart-kop,.dagboek-ervaring,.dagboek-notitie{-webkit-print-color-adjust:exact;print-color-adjust:exact}.dagboek-grid{gap:12px}.dagboek-kaart{break-inside:avoid}.dagboek-edit-btn{display:none}.dagboek-extra-trigger{break-inside:avoid}}
    `;
  }

  function diaryDraftKey(dateFrom,dateTo){
    const base='reisblik_mijn_reisdagboek_draft_v1';
    const vac=window.reisblikVakantie?.getActiveVakantie?.()||window.reisblikVakantie?.activeVakantie||{};
    const vid=String(vac.id||window.reisblikVakantie?.getActieveVakantie?.()?.id||'default');
    return base+'__'+vid+'__'+dateFrom+'__'+dateTo;
  }

  function loadDiaryDraft(dateFrom,dateTo){
    try{
      const raw=localStorage.getItem(diaryDraftKey(dateFrom,dateTo));
      const data=raw?JSON.parse(raw):null;
      return data&&typeof data==='object'?data:null;
    }catch(e){return null;}
  }

  function saveDiaryDraft(dateFrom,dateTo,draft){
    localStorage.setItem(diaryDraftKey(dateFrom,dateTo),JSON.stringify({
      version:'1',savedAt:new Date().toISOString(),...draft
    }));
  }

  function makeDiaryEditorHtml(entries,dateFrom,dateTo){
    const period=rangeLabel(dateFrom,dateTo);
    const saved=loadDiaryDraft(dateFrom,dateTo)||{};
    const firstName=entries[0]?.item?.name||'Mijn reisdag';
    const title=saved.title ?? firstName;
    const intro=saved.intro ?? '';
    const savedItems=Array.isArray(saved.items)?saved.items:[];
    const itemHtml=entries.map((entry,index)=>{
      const item=entry.item||{}, loc=findLocation(item)||{};
      const old=savedItems[index]||{};
      const story=old.story ?? (loc.userCreated?(loc.story||loc.experience||''):'');
      const note=old.note ?? '';
      return '<section class="dagboek-editor-item">'+
        '<div class="dagboek-editor-kop"><span class="dagboek-nummer">'+String(index+1).padStart(2,'0')+'</span><div><h3>'+escapeHtml(item.name||loc.name||'Onbekende locatie')+'</h3><div class="dagboek-meta">'+escapeHtml(timePart(item.visitedAt)||'')+'</div></div></div>'+
        '<label>Mijn verhaal / ervaring<textarea data-diary-story="'+index+'" rows="7">'+escapeHtml(story)+'</textarea></label>'+
        '<label>Extra tekst voor het reisdagboek<textarea data-diary-note="'+index+'" rows="5">'+escapeHtml(note)+'</textarea></label>'+
        '</section>';
    }).join('');
    return '<div class="dagboek-editor" id="reisdagEditor">'+
      '<div class="dagboek-editor-header"><h2>✏️ Reisdagboek bewerken</h2><p>De wijzigingen worden lokaal opgeslagen voor deze vakantie en deze datum. De oorspronkelijke locatiegegevens blijven ongewijzigd.</p></div>'+
      '<label>Titel<textarea id="diaryEditTitle" rows="2">'+escapeHtml(title)+'</textarea></label>'+
      '<label>Inleiding<textarea id="diaryEditIntro" rows="4" placeholder="Schrijf hier eventueel een korte inleiding voor deze dag…">'+escapeHtml(intro)+'</textarea></label>'+
      itemHtml+
      '<div class="dagboek-editor-actions"><button type="button" id="diarySaveBtn">💾 Opslaan</button><button type="button" id="diaryGenerateBtn">🌐 HTML genereren</button><button type="button" id="diaryCancelBtn">Annuleren</button></div>'+
      '<div id="diarySaveStatus" class="dagboek-save-status"></div>'+
      '</div>';
  }

  function collectDiaryDraft(entries,dateFrom,dateTo){
    const items=entries.map((entry,index)=>({
      story:byId('diaryEditEditor')?byId('diaryEditEditor').value:'',
      note:''
    }));
    // Use the editor data attributes so this remains robust when locations are added later.
    const editor=byId('reisdagEditor');
    return {
      title:byId('diaryEditTitle')?.value||entries[0]?.item?.name||'Mijn reisdag',
      intro:byId('diaryEditIntro')?.value||'',
      items:entries.map((entry,index)=>({
        story:editor?.querySelector('[data-diary-story="'+index+'"]')?.value||'',
        note:editor?.querySelector('[data-diary-note="'+index+'"]')?.value||''
      }))
    };
  }

  function makeTravelDiaryHtmlWithDraft(entries,dateFrom,dateTo,draft){
    return makeTravelDiaryHtml(entries,dateFrom,dateTo,draft||{});
  }

  async function generateDiaryHtml(entries,dateFrom,dateTo,draft){
    const html=makeTravelDiaryHtml(entries,dateFrom,dateTo,draft||{});
    const filename=(dateFrom===dateTo?dateFrom:dateFrom+'-tm-'+dateTo)+'-reisdagboek.html';
    downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),filename);
  }

  function showDiaryEditor(entries,dateFrom,dateTo){
    // Compatibiliteitsfunctie voor oudere aanroepen. De editor zelf staat nu
    // in de reisdagboekpagina achter de potloodknop.
    openTravelDiaryPreview(dateFrom,dateTo);
  }

  async function openTravelDiaryPreview(dateFrom,dateTo){
    const matches=matchesForRange(dateFrom,dateTo);
    const period=rangeLabel(dateFrom,dateTo);
    if(!matches.length){
      alert('Geen bezochte locaties gevonden voor '+period+'.');
      return;
    }

    const btn=byId('reisdagDiaryBtn');
    // Open the tab synchronously so the browser sees it as a direct result
    // of the user's click; the generated page is filled in afterwards.
    const win=window.open('', '_blank');
    if(!win){
      alert('De tussenpagina kon niet worden geopend. Sta pop-ups voor Reisblik toe.');
      return;
    }
    if(btn){btn.disabled=true;btn.textContent='⏳ Reisdagboek maken…';}
    try{
      win.document.write('<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>Reisdagboek maken…</title></head><body style="font-family:Arial,sans-serif;padding:30px">Reisdagboek wordt opgebouwd…</body></html>');
      win.document.close();
      const entries=await buildDayData(dateFrom,dateTo);
      const draft=loadDiaryDraft(dateFrom,dateTo)||{};
      const html=makeTravelDiaryHtml(entries,dateFrom,dateTo,draft);
      const blob=new Blob([html],{type:'text/html;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      win.location.href=url;
      setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(e){
      try{win.close();}catch(_e){}
      console.error('Mijn reisdagboek: tussenpagina kon niet worden gemaakt',e);
      alert('De reisdagboek-tussenpagina kon niet worden gemaakt.');
    }finally{
      if(btn){btn.disabled=false;btn.textContent='📖 Reisdagboek bekijken';}
    }
  }

  function ensureResultsPanel(){
    let panel=byId('reisdagResults');
    if(panel)return panel;

    panel=document.createElement('div');
    panel.id='reisdagResults';
    panel.className='reisdag-results';

    const row=document.querySelector('.maintenance-buttons');
    if(row&&row.parentNode)row.parentNode.insertBefore(panel,row.nextSibling);
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
    diary.textContent='📖 Reisdagboek bekijken';
    diary.onclick=()=>openTravelDiaryPreview(dateFrom,dateTo);

    actions.appendChild(word);
    actions.appendChild(diary);
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
