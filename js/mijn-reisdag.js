/* Reisblik 9.6 – Mijn reisdag
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

  function diaryPhotoHtml(item){
    const sourceLocation=findLocation(item);
    if(!(sourceLocation && sourceLocation.userCreated && sourceLocation.photo))return '';
    return '<figure class="dagboek-foto">'+
      '<img src="'+escapeHtml(sourceLocation.photo)+'" alt="Foto '+
      escapeHtml(sourceLocation.name||item.name||'locatie')+'">'+
      '</figure>';
  }

  function diaryTextBlock(title,text){
    if(!text)return '';
    const paragraphs=String(text).split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
    if(!paragraphs.length)return '';
    return '<div class="dagboek-blok"><h3>'+escapeHtml(title)+'</h3>'+
      paragraphs.map(p=>'<p>'+escapeHtml(p).replace(/\n/g,'<br>')+'</p>').join('')+
      '</div>';
  }

  function makeTravelDiaryHtml(entries,dateFrom,dateTo){
    const period=rangeLabel(dateFrom,dateTo);
    const title=dateFrom===dateTo ? 'Mijn reisdag' : 'Mijn reisdagen';
    const firstName=entries[0]?.item?.name||'';

    const cards=entries.map((entry,index)=>{
      const item=entry.item||{};
      const location=findLocation(item)||{};
      const when=timePart(item.visitedAt);
      let factual='';

      if(entry.html){
        factual='<div class="dagboek-blok"><h3>Het verhaal</h3><div class="dagboek-vaste-tekst">'+entry.html+'</div></div>';
      }else if(entry.text){
        factual=diaryTextBlock('Het verhaal',entry.text);
      }

      const personal=location.userCreated
        ? diaryTextBlock('Mijn ervaring',location.story||location.experience||'')
        : '';

      const extras=entry.extra.length
        ? '<div class="dagboek-blok"><h3>Extra informatie</h3><ul>'+
          entry.extra.map(x=>'<li>'+(x.date?'<b>'+escapeHtml(x.date)+'</b> — ':'')+
          escapeHtml(x.text||'')+'</li>').join('')+'</ul></div>' : '';

      const address=location.address ? '<div class="dagboek-adres">'+escapeHtml(location.address)+'</div>' : '';
      const meta=[when,location.type||location.category].filter(Boolean).join(' · ');

      return '<article class="dagboek-locatie">'+
        '<div class="dagboek-locatie-kop"><span class="dagboek-nummer">'+String(index+1).padStart(2,'0')+'</span>'+
        '<div><h2>'+escapeHtml(item.name||location.name||'Onbekende locatie')+'</h2>'+
        (meta?'<div class="dagboek-meta">'+escapeHtml(meta)+'</div>':'')+address+'</div></div>'+
        diaryPhotoHtml(item)+factual+personal+extras+
        '</article>';
    }).join('');

    const intro=entries.length
      ? '<p class="dagboek-intro">Deze eerste opzet gebruikt de geselecteerde onderdelen van Mijn reisdag als bouwstenen voor een persoonlijk reisverhaal.</p>'
      : '<p class="dagboek-intro">Er zijn voor deze periode nog geen bezochte locaties geselecteerd.</p>';

    return '<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8">'+
      '<meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<title>'+escapeHtml(title+' — '+period)+'</title>'+
      '<style>'+travelDiaryCss()+'</style></head><body>'+
      '<main class="dagboek-pagina">'+
      '<header class="dagboek-header">'+
      '<div class="dagboek-label">REISBLIK · MIJN REISDAGBOEK</div>'+
      '<h1>'+escapeHtml(firstName||title)+'</h1>'+
      '<div class="dagboek-datum">'+escapeHtml(formatDiaryDate(dateFrom))+
      (dateFrom!==dateTo?' <span>t/m '+escapeHtml(formatDiaryDate(dateTo))+'</span>':'')+'</div>'+
      '</header>'+intro+cards+
      '<footer class="dagboek-footer"><strong>Mijn reisdagboek</strong><br>Opzet voor een later compleet reisdagboek.</footer>'+
      '</main></body></html>';
  }

  function travelDiaryCss(){
    return `
      *{box-sizing:border-box}
      body{margin:0;background:#e8e5df;color:#26353a;font-family:Georgia,'Times New Roman',serif;line-height:1.55}
      .dagboek-pagina{width:min(1180px,100%);margin:0 auto;background:#fff;min-height:100vh;padding:34px 42px 52px}
      .dagboek-header{position:relative;min-height:250px;padding:34px 34px 30px;margin-bottom:22px;background:#f2eee7;border-bottom:5px solid #26353a;overflow:hidden}
      .dagboek-header:after{content:'REISBLIK';position:absolute;right:-8px;bottom:-34px;font:700 115px/1 Arial,sans-serif;letter-spacing:-6px;color:rgba(38,53,58,.055)}
      .dagboek-label{position:relative;z-index:1;font:700 11px/1.2 Arial,sans-serif;letter-spacing:2.5px;color:#687276;margin-bottom:22px}
      .dagboek-header h1{position:relative;z-index:1;font-size:clamp(42px,6vw,76px);line-height:.98;margin:0 0 14px;font-weight:700;max-width:850px}
      .dagboek-datum{position:relative;z-index:1;font:600 18px/1.4 Arial,sans-serif;color:#59666b}
      .dagboek-datum span{white-space:nowrap}
      .dagboek-intro{font-size:18px;max-width:900px;margin:20px auto 38px;color:#4d585c;text-align:center}
      .dagboek-locatie{break-inside:avoid;margin:0 0 42px;padding:0 0 30px;border-bottom:1px solid #d5d1ca}
      .dagboek-locatie:last-of-type{border-bottom:0}
      .dagboek-locatie-kop{display:flex;gap:16px;align-items:flex-start;margin-bottom:14px;break-after:avoid}
      .dagboek-nummer{font:700 12px/1 Arial,sans-serif;color:#fff;background:#26353a;padding:8px 9px;min-width:34px;text-align:center;margin-top:4px}
      .dagboek-locatie-kop h2{font-size:32px;line-height:1.08;margin:0 0 5px}
      .dagboek-meta,.dagboek-adres{font:13px/1.45 Arial,sans-serif;color:#6c777b}
      .dagboek-adres{margin-top:2px}
      .dagboek-foto{margin:15px 0 24px;break-inside:avoid}
      .dagboek-foto img{display:block;width:100%;max-height:470px;height:auto;object-fit:cover}
      .dagboek-blok{margin:18px 0 0;max-width:none}
      .dagboek-blok h3{font:700 11px/1.2 Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 9px;color:#526066}
      .dagboek-blok p{margin:0 0 13px;font-size:17px}
      .dagboek-blok ul{margin:0;padding-left:23px;font-size:16px}
      .dagboek-vaste-tekst{font-size:16px}
      .dagboek-vaste-tekst h1,.dagboek-vaste-tekst h2,.dagboek-vaste-tekst h3{font-family:Georgia,'Times New Roman',serif}
      .dagboek-vaste-tekst h1{font-size:28px}.dagboek-vaste-tekst h2{font-size:23px}.dagboek-vaste-tekst h3{font-size:19px}
      .dagboek-vaste-tekst img{max-width:100%;height:auto}
      .dagboek-vaste-tekst figure{break-inside:avoid}
      .dagboek-footer{margin-top:35px;padding:22px 26px;background:#26353a;color:#fff;font:13px/1.55 Arial,sans-serif}
      .dagboek-footer strong{font-size:18px}
      @media(min-width:900px){
        .dagboek-pagina{padding-left:58px;padding-right:58px}
        .dagboek-locatie .dagboek-blok{column-count:2;column-gap:30px;column-rule:1px solid #ddd8d0;text-align:justify}
        .dagboek-locatie .dagboek-blok h3,.dagboek-locatie .dagboek-blok p,.dagboek-locatie .dagboek-blok ul{break-inside:avoid}
        .dagboek-locatie .dagboek-vaste-tekst{column-count:2;column-gap:30px;column-rule:1px solid #ddd8d0;text-align:justify}
        .dagboek-locatie .dagboek-vaste-tekst h1,.dagboek-locatie .dagboek-vaste-tekst h2,.dagboek-locatie .dagboek-vaste-tekst h3{column-span:all}
        .dagboek-locatie .dagboek-vaste-tekst img{break-inside:avoid}
      }
      @media(min-width:1120px){
        .dagboek-locatie .dagboek-blok,.dagboek-locatie .dagboek-vaste-tekst{column-count:3;column-gap:28px}
      }
      @media(max-width:700px){
        .dagboek-pagina{padding:18px 16px 35px}
        .dagboek-header{min-height:205px;padding:25px 22px}
        .dagboek-header h1{font-size:40px}
        .dagboek-locatie-kop h2{font-size:26px}
        .dagboek-intro{font-size:16px}
        .dagboek-blok p{font-size:16px}
        .dagboek-foto img{max-height:none}
      }
      @media print{
        body{background:#fff}.dagboek-pagina{width:auto;padding:12mm 14mm;box-shadow:none}
        .dagboek-header{background:#f2eee7;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .dagboek-footer{background:#26353a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      }
    `;
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
      const html=makeTravelDiaryHtml(entries,dateFrom,dateTo);
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
