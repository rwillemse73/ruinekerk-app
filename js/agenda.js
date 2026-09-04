/* Reisblik 8.8.0 – Agenda basis */
(function(){
  function el(id){return document.getElementById(id);}

  function formatCoord(v){
    return Number.isFinite(Number(v)) ? Number(v).toFixed(6) : '';
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
    overlay.style.display='flex';
  }

  function closeAgenda(){
    const overlay=el('agendaOverlay');
    if(overlay) overlay.style.display='none';
  }

  function init(){
    const open=el('agendaOpenBtn');
    const close=el('agendaCloseBtn');
    const overlay=el('agendaOverlay');
    if(open) open.addEventListener('click',openAgenda);
    if(close) close.addEventListener('click',closeAgenda);
    if(overlay) overlay.addEventListener('click',function(e){if(e.target===overlay)closeAgenda();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAgenda();});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();

  window.reisblikAgendaUpdateLocation=updateAgendaLocation;
})();
