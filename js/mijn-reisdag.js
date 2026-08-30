/* Reisblik 7.3 – Mijn reisdag: selectie bezochte locaties op datum */
(function(){
  const DATE_KEY='reisblik_mijn_reisdag_datum';
  const VISITED_KEY='reisblik_visited_v1';

  function byId(id){return document.getElementById(id);}

  function openMijnReisdag(){
    const overlay=byId('reisdagOverlay');
    const date=byId('reisdagDate');
    if(!overlay||!date)return;
    const saved=localStorage.getItem(DATE_KEY);
    if(saved) date.value=saved;
    overlay.style.display='flex';
    setTimeout(function(){date.focus();},0);
  }

  function closeMijnReisdag(){
    const overlay=byId('reisdagOverlay');
    if(overlay)overlay.style.display='none';
  }

  function loadVisited(){
    try{
      const raw=localStorage.getItem(VISITED_KEY);
      const data=JSON.parse(raw||'{}');
      return data&&typeof data==='object'?data:{};
    }catch(e){
      return {};
    }
  }

  function visitedDate(iso){
    if(!iso)return '';
    const d=new Date(iso);
    if(Number.isNaN(d.getTime()))return '';
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,'0');
    const day=String(d.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+day;
  }

  function showResults(selectedDate){
    const results=byId('reisdagResults');
    if(!results)return;

    const visited=loadVisited();
    const matches=Object.values(visited)
      .filter(function(item){
        return item && item.visitedAt && visitedDate(item.visitedAt)===selectedDate;
      })
      .sort(function(a,b){
        return new Date(a.visitedAt)-new Date(b.visitedAt);
      });

    results.innerHTML='';
    const title=document.createElement('h4');
    title.textContent='Bezocht op '+selectedDate;
    results.appendChild(title);

    if(!matches.length){
      const empty=document.createElement('div');
      empty.className='reisdag-empty';
      empty.textContent='Geen bezochte locaties gevonden voor deze datum.';
      results.appendChild(empty);
      return;
    }

    const ul=document.createElement('ul');
    matches.forEach(function(item){
      const li=document.createElement('li');
      const time=new Date(item.visitedAt);
      const timeText=Number.isNaN(time.getTime())?'':new Intl.DateTimeFormat('nl-NL',{
        hour:'2-digit',minute:'2-digit',hour12:false
      }).format(time);
      li.textContent=(timeText?timeText+' — ':'')+(item.name||'Onbekende locatie');
      if(item.category)li.textContent+=' ('+item.category+')';
      ul.appendChild(li);
    });
    results.appendChild(ul);
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
  }

  document.addEventListener('DOMContentLoaded',function(){
    const open=byId('reisdagOpenBtn');
    const cancel=byId('reisdagCancelBtn');
    const choose=byId('reisdagChooseBtn');
    const overlay=byId('reisdagOverlay');

    if(open)open.addEventListener('click',openMijnReisdag);
    if(cancel)cancel.addEventListener('click',closeMijnReisdag);
    if(choose)choose.addEventListener('click',chooseMijnReisdag);
    if(overlay)overlay.addEventListener('click',function(e){
      if(e.target===overlay)closeMijnReisdag();
    });

    /* If a date was already selected, show its current visited list. */
    const saved=localStorage.getItem(DATE_KEY);
    if(saved)showResults(saved);
  });
})();
