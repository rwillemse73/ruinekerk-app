/* Reisblik 7.3.1 – Mijn reisdag
   Alleen deze module gewijzigd.
   De resultatenlijst wordt nu in een altijd zichtbaar resultatenpaneel
   buiten de datum-pop-up getoond.
*/
(function(){
  const DATE_KEY='reisblik_mijn_reisdag_datum';
  const VISITED_KEY='reisblik_visited_v1';

  function byId(id){return document.getElementById(id);}

  function loadVisited(){
    try{
      const raw=localStorage.getItem(VISITED_KEY);
      const data=JSON.parse(raw||'{}');
      return data&&typeof data==='object'?data:{};
    }catch(e){
      return {};
    }
  }

  function datePart(iso){
    const d=new Date(iso);
    if(Number.isNaN(d.getTime())) return '';
    return d.getFullYear()+'-'+
      String(d.getMonth()+1).padStart(2,'0')+'-'+
      String(d.getDate()).padStart(2,'0');
  }

  function timePart(iso){
    const d=new Date(iso);
    if(Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('nl-NL',{
      hour:'2-digit',minute:'2-digit',hour12:false
    }).format(d);
  }

  function ensureResultsPanel(){
    let panel=byId('reisdagResults');
    if(panel) return panel;

    panel=document.createElement('div');
    panel.id='reisdagResults';
    panel.className='reisdag-results';

    const button=byId('reisdagOpenBtn');
    if(button && button.parentNode){
      button.parentNode.insertBefore(panel,button.nextSibling);
    }else{
      document.body.appendChild(panel);
    }
    return panel;
  }

  function showResults(selectedDate){
    const panel=ensureResultsPanel();
    panel.style.display='block';
    panel.innerHTML='';

    const title=document.createElement('h4');
    title.textContent='Mijn reisdag — '+selectedDate;
    panel.appendChild(title);

    const visited=loadVisited();
    const matches=Object.values(visited)
      .filter(function(item){
        return item && item.visitedAt && datePart(item.visitedAt)===selectedDate;
      })
      .sort(function(a,b){
        return new Date(a.visitedAt)-new Date(b.visitedAt);
      });

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
    matches.forEach(function(item){
      const li=document.createElement('li');
      const name=item.name||'Onbekende locatie';
      const category=item.category||'';
      li.textContent=timePart(item.visitedAt)+' — '+name+
        (category?' ('+category+')':'');
      ul.appendChild(li);
    });
    panel.appendChild(ul);
  }

  function openMijnReisdag(){
    const overlay=byId('reisdagOverlay');
    const date=byId('reisdagDate');
    if(!overlay||!date)return;

    const saved=localStorage.getItem(DATE_KEY);
    if(saved)date.value=saved;

    overlay.style.display='flex';
    setTimeout(function(){date.focus();},0);
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
