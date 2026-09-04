/* Reisblik 8.8.2 – Agenda / lokaal bewaren van evenementen */
(function(){
  const STORAGE_KEY='reisblik_agenda_evenementen_v1';

  function el(id){return document.getElementById(id);}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

  function formatCoord(v){
    return Number.isFinite(Number(v)) ? Number(v).toFixed(6) : '';
  }

  function loadEvents(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      const data=raw?JSON.parse(raw):[];
      return Array.isArray(data)?data:[];
    }catch(e){
      console.error('Agenda: opgeslagen evenementen konden niet worden gelezen',e);
      return [];
    }
  }

  function saveEvents(events){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(events));
  }

  function eventKey(event){
    if(event && event.id) return String(event.id);
    return [event?.name,event?.date,event?.location].map(x=>String(x??'').trim().toLowerCase()).join('|');
  }

  function renderSavedEvents(){
    const box=el('agendaSavedEvents');
    const empty=el('agendaEmpty');
    if(!box || !empty) return;
    const events=loadEvents().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    box.innerHTML='';
    if(!events.length){
      empty.style.display='block';
      return;
    }
    empty.style.display='none';
    events.forEach(ev=>{
      const card=document.createElement('div');
      card.className='agenda-event-card';
      card.innerHTML='<div class="agenda-event-title">📅 '+esc(ev.name||'Onbenoemd evenement')+'</div>'+
        (ev.date?'<div><strong>Datum:</strong> '+esc(ev.date)+'</div>':'')+
        (ev.location?'<div><strong>Locatie:</strong> '+esc(ev.location)+'</div>':'')+
        (ev.type?'<div><strong>Type:</strong> '+esc(ev.type)+'</div>':'')+
        (ev.organizer?'<div><strong>Organisator:</strong> '+esc(ev.organizer)+'</div>':'')+
        '<button type="button" class="agenda-remove-btn" data-agenda-key="'+esc(eventKey(ev))+'">Verwijder uit mijn agenda</button>';
      box.appendChild(card);
    });
    box.querySelectorAll('.agenda-remove-btn').forEach(btn=>btn.addEventListener('click',function(){
      const key=this.getAttribute('data-agenda-key');
      saveEvents(loadEvents().filter(ev=>eventKey(ev)!==key));
      renderSavedEvents();
    }));
  }

  function updateAgendaLocation(){
    const status=el('agendaLocationStatus');
    const coords=el('agendaLocationCoords');
    if(!status || !coords) return;
    if(typeof userLat==='number' && typeof userLon==='number' && Number.isFinite(userLat) && Number.isFinite(userLon)){
      const source=window.reisblikLocationSource;
      const label=source && source.label ? source.label : 'Gekozen locatie';
      status.textContent='Basis voor toekomstige evenementenzoekopdrachten: '+label+'.';
      coords.textContent='GPS: '+formatCoord(userLat)+', '+formatCoord(userLon);
    }else{
      status.textContent='Je locatie is nog niet bepaald. Kies eerst Mijn locatie of Testpositie.';
      coords.textContent='';
    }
  }

  function openAgenda(){
    const overlay=el('agendaOverlay');
    if(!overlay) return;
    updateAgendaLocation();
    renderSavedEvents();
    overlay.style.display='flex';
  }

  function closeAgenda(){
    const overlay=el('agendaOverlay');
    if(overlay) overlay.style.display='none';
  }

  // Publieke functie voor de toekomstige evenementenzoeker.
  // Deze functie maakt het mogelijk om vanuit een zoekresultaat met één vinkje
  // een evenement lokaal in Mijn agenda te bewaren.
  window.reisblikAgendaBewaarEvenement=function(event){
    if(!event || !String(event.name||'').trim()) return false;
    const events=loadEvents();
    const key=eventKey(event);
    if(!events.some(ev=>eventKey(ev)===key)){
      events.push({
        id:event.id || null,
        name:String(event.name||'').trim(),
        date:String(event.date||'').trim(),
        location:String(event.location||'').trim(),
        type:String(event.type||'').trim(),
        organizer:String(event.organizer||'').trim(),
        price:String(event.price||'').trim(),
        description:String(event.description||'').trim(),
        savedAt:new Date().toISOString()
      });
      saveEvents(events);
    }
    renderSavedEvents();
    return true;
  };

  window.reisblikAgendaIsOpgeslagen=function(event){
    if(!event) return false;
    const key=eventKey(event);
    return loadEvents().some(ev=>eventKey(ev)===key);
  };

  window.reisblikAgendaUpdateLocation=updateAgendaLocation;
  window.reisblikOpenAgenda=openAgenda;
  window.reisblikCloseAgenda=closeAgenda;

  function init(){
    const open=el('agendaOpenBtn');
    const close=el('agendaCloseBtn');
    const overlay=el('agendaOverlay');
    if(open) open.addEventListener('click',openAgenda);
    if(close) close.addEventListener('click',closeAgenda);
    if(overlay) overlay.addEventListener('click',function(e){if(e.target===overlay)closeAgenda();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAgenda();});
    renderSavedEvents();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
