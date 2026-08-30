/* Reisblik 7.4.1 – Mijn reisdag
   Datumselectie, lijst met bezochte locaties en download van de reisdag.
   Word-download gebruikt een Word-compatibel HTML-document met .doc-extensie.
*/
(function(){
  const DATE_KEY='reisblik_mijn_reisdag_datum';
  const VISITED_KEY='reisblik_visited_v1';

  function byId(id){return document.getElementById(id);}

  function loadVisited(){
    try{
      const data=JSON.parse(localStorage.getItem(VISITED_KEY)||'{}');
      return data&&typeof data==='object'?data:{};
    }catch(e){return {};}
  }

  function loadExtraInfo(){
    try{
      const data=JSON.parse(localStorage.getItem('ruinekerk_extra_info_v1')||'{}');
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

  function displayDate(date){
    return date;
  }

  function matchesForDate(selectedDate){
    return Object.values(loadVisited())
      .filter(item=>item&&item.visitedAt&&datePart(item.visitedAt)===selectedDate)
      .sort((a,b)=>new Date(a.visitedAt)-new Date(b.visitedAt));
  }

  function findLocation(item){
    if(typeof locations==='undefined' || !Array.isArray(locations))return null;
    return locations.find(x=>String(x.id)===String(item.id))||null;
  }

  async function getLocationText(item){
    const x=findLocation(item);

    if(x && x.userCreated){
      return [
        x.description||'',
        x.story||''
      ].filter(Boolean).join('\n\n').trim();
    }

    if(x && x.content){
      try{
        const response=await fetch(x.content+'?reisdag='+Date.now(),{cache:'no-store'});
        if(response.ok){
          const source=await response.text();
          const doc=new DOMParser().parseFromString(source,'text/html');
          const article=doc.querySelector('article');
          const root=article||doc.body;
          return (root.innerText||root.textContent||'').trim();
        }
      }catch(e){}
    }

    return '';
  }

  function getExtraForLocation(id){
    return loadExtraInfo()[id]||[];
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

  async function buildDayData(selectedDate){
    const matches=matchesForDate(selectedDate);
    const entries=[];

    for(const item of matches){
      entries.push({
        item:item,
        text:await getLocationText(item),
        extra:getExtraForLocation(item.id)
      });
    }
    return entries;
  }

  function escapeHtml(value){
    return String(value??'')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function makeTxt(entries,selectedDate){
    const lines=[
      'MIJN REISDAG',
      'Datum: '+selectedDate,
      ''
    ];

    entries.forEach((entry,index)=>{
      const item=entry.item;
      lines.push(
        (index+1)+'. '+(timePart(item.visitedAt)?timePart(item.visitedAt)+' — ':'')+
        (item.name||'Onbekende locatie')
      );
      if(item.category)lines.push('Type: '+item.category);
      lines.push('');

      if(entry.text){
        lines.push('HET VERHAAL');
        lines.push(entry.text);
        lines.push('');
      }

      if(entry.extra.length){
        lines.push('EXTRA INFORMATIE');
        entry.extra.forEach(x=>{
          lines.push((x.date||'')+' — '+(x.text||''));
        });
        lines.push('');
      }

      lines.push('----------------------------------------');
      lines.push('');
    });

    return lines.join('\n');
  }

  function makeWordHtml(entries,selectedDate){
    const sections=entries.map((entry,index)=>{
      const item=entry.item;
      const title=(index+1)+'. '+(item.name||'Onbekende locatie');
      const time=timePart(item.visitedAt);
      const story=entry.text
        ? '<h3>Het verhaal</h3><p>'+escapeHtml(entry.text).replace(/\n/g,'<br>')+'</p>'
        : '<p><i>Geen tekst beschikbaar.</i></p>';

      const extra=entry.extra.length
        ? '<h3>Extra informatie</h3><ul>'+
          entry.extra.map(x=>'<li><b>'+escapeHtml(x.date||'')+
          '</b> — '+escapeHtml(x.text||'')+'</li>').join('')+
          '</ul>'
        : '';

      return '<section style="page-break-inside:avoid;margin-bottom:28px">'+
        '<h2>'+escapeHtml(title)+'</h2>'+
        (time?'<p><b>Bezocht:</b> '+escapeHtml(time)+'</p>':'')+
        (item.category?'<p><b>Type:</b> '+escapeHtml(item.category)+'</p>':'')+
        story+extra+
        '</section>';
    }).join('');

    return '<!DOCTYPE html><html><head><meta charset="utf-8">'+
      '<title>Mijn reisdag '+escapeHtml(selectedDate)+'</title>'+
      '<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#222}'+
      'h1{font-size:20pt}h2{font-size:16pt;border-bottom:1px solid #ccc;padding-bottom:4px}'+
      'h3{font-size:12pt;margin-bottom:4px}p{line-height:1.45}'+
      '</style></head><body>'+
      '<h1>Mijn reisdag — '+escapeHtml(selectedDate)+'</h1>'+
      '<p>Samengesteld uit de op deze datum als bezocht geregistreerde locaties.</p>'+
      sections+
      '</body></html>';
  }

  async function downloadWord(selectedDate){
    const matches=matchesForDate(selectedDate);
    if(!matches.length){
      alert('Geen bezochte locaties gevonden voor '+selectedDate+'.');
      return;
    }
    const btn=byId('reisdagWordBtn');
    if(btn)btn.disabled=true;
    try{
      const entries=await buildDayData(selectedDate);
      const filename=selectedDate+'-'+getFirstName(matches)+'.doc';
      downloadBlob(new Blob(['\ufeff',makeWordHtml(entries,selectedDate)],{
        type:'application/msword;charset=utf-8'
      }),filename);
    }finally{
      if(btn)btn.disabled=false;
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

  function showResults(selectedDate){
    const panel=ensureResultsPanel();
    panel.style.display='block';
    panel.innerHTML='';

    const title=document.createElement('h4');
    title.textContent='Mijn reisdag — '+displayDate(selectedDate);
    panel.appendChild(title);

    const matches=matchesForDate(selectedDate);

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
      li.textContent=timePart(item.visitedAt)+' — '+(item.name||'Onbekende locatie')+
        (item.category?' ('+item.category+')':'');
      ul.appendChild(li);
    });
    panel.appendChild(ul);

    const actions=document.createElement('div');
    actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:12px';

    actions.appendChild(word);
    panel.appendChild(actions);
  }

  function openMijnReisdag(){
    const overlay=byId('reisdagOverlay');
    const date=byId('reisdagDate');
    if(!overlay||!date)return;
    const saved=localStorage.getItem(DATE_KEY);
    if(saved)date.value=saved;
    overlay.style.display='flex';
    setTimeout(()=>date.focus(),0);
  }

  function closeMijnReisdag(){
    const overlay=byId('reisdagOverlay');
    if(overlay)overlay.style.display='none';
  }

  function chooseMijnReisdag(){
    const date=byId('reisdagDate');
    const status=byId('reisdagStatus');
    if(!date||!date.value){
      if(status)status.textContent='Kies eerst een datum.';
      return;
    }
    localStorage.setItem(DATE_KEY,date.value);
    if(status)status.textContent='Gekozen datum: '+date.value;
    showResults(date.value);
    closeMijnReisdag();
  }

  document.addEventListener('DOMContentLoaded',function(){
    const open=byId('reisdagOpenBtn');
    const cancel=byId('reisdagCancelBtn');
    const choose=byId('reisdagChooseBtn');
    if(open)open.addEventListener('click',openMijnReisdag);
    if(cancel)cancel.addEventListener('click',closeMijnReisdag);
    if(choose)choose.addEventListener('click',chooseMijnReisdag);

    const saved=localStorage.getItem(DATE_KEY);
    if(saved)showResults(saved);
  });
})();
