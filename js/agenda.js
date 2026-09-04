/* Reisblik 8.8.8 – Agenda / JSON-import met aparte permanente opslag */
(function(){
  const SAVED_KEY='reisblik_agenda_evenementen_v1';
  const IMPORT_KEY='reisblik_agenda_import_v1';
  const TEST_IMPORT_URL='agenda/agenda-test.json';

  // Oude Ticketmaster-sleutel uit eerdere versies opruimen.
  try{localStorage.removeItem('reisblik_ticketmaster_api_key_v1');}catch(e){}

  function el(id){return document.getElementById(id);}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function formatCoord(v){return Number.isFinite(Number(v)) ? Number(v).toFixed(6) : '';}

  function readArray(key){
    try{const raw=localStorage.getItem(key); const data=raw?JSON.parse(raw):[]; return Array.isArray(data)?data:[];}
    catch(e){console.warn('Agenda-opslag kon niet worden gelezen',key,e); return [];}
  }
  function writeArray(key,data){localStorage.setItem(key,JSON.stringify(Array.isArray(data)?data:[]));}
  function loadSaved(){return readArray(SAVED_KEY);}
  function saveSaved(events){writeArray(SAVED_KEY,events);}
  function loadImported(){return readArray(IMPORT_KEY);}
  function saveImported(events){writeArray(IMPORT_KEY,events);}

  function eventKey(event){
    if(event && event.id) return String(event.id);
    return [event?.name,event?.date,event?.location].map(x=>String(x??'').trim().toLowerCase()).join('|');
  }

  function normalizeEvent(event, meta){
    return {
      id:event.id || null,
      name:String(event.name||'').trim(),
      date:String(event.date||'').trim(),
      location:String(event.location||'').trim(),
      lat:Number(event.lat ?? event.latitude),
      lon:Number(event.lon ?? event.longitude),
      type:String(event.type||'').trim(),
      organizer:String(event.organizer||'').trim(),
      price:String(event.price||'').trim(),
      description:String(event.description||'').trim(),
      source:String(event.source||'').trim(),
      url:String(event.url||'').trim(),
      image:String(event.image||'').trim(),
      reisblikMatch:Number.isFinite(Number(event.reisblikMatch))?Number(event.reisblikMatch):null,
      matchReasons:Array.isArray(event.matchReasons)?event.matchReasons:[],
      importedFrom:meta?.file||'agenda-json',
      importedAt:new Date().toISOString()
    };
  }

  async function importTestAgenda(){
    try{
      const response=await fetch(TEST_IMPORT_URL+'?v=8.8.8',{cache:'no-store'});
      if(!response.ok) throw new Error('HTTP '+response.status);
      const payload=await response.json();
      const incoming=Array.isArray(payload?.events)?payload.events:[];
      const imported=[]; const seen=new Set();
      incoming.forEach(event=>{
        const normalized=normalizeEvent(event,{file:payload.sourceFile||'agenda-test.json'});
        const key=eventKey(normalized);
        if(!normalized.name || !key || seen.has(key)) return;
        seen.add(key); imported.push(normalized);
      });
      saveImported(imported);
      return imported.length;
    }catch(error){
      console.warn('Agenda JSON-import niet uitgevoerd:',error);
      return 0;
    }
  }

  function isSaved(event){
    const key=eventKey(event); return !!key && loadSaved().some(ev=>eventKey(ev)===key);
  }

  function eventCard(ev, permanent){
    const card=document.createElement('div'); card.className='agenda-event-card';
    let html='<div class="agenda-event-title">📅 '+esc(ev.name||'Onbenoemd evenement')+'</div>'+
      (ev.date?'<div><strong>Datum:</strong> '+esc(ev.date)+'</div>':'')+
      (ev.location?'<div><strong>Locatie:</strong> '+esc(ev.location)+'</div>':'')+
      (ev.type?'<div><strong>Type:</strong> '+esc(ev.type)+'</div>':'')+
      (ev.organizer?'<div><strong>Organisator:</strong> '+esc(ev.organizer)+'</div>':'')+
      (ev.price?'<div><strong>Prijs:</strong> '+esc(ev.price)+'</div>':'')+
      (ev.description?'<div class="agenda-event-description">'+esc(ev.description)+'</div>':'');
    if(ev.url){html+='<div class="agenda-event-source"><a href="'+esc(ev.url)+'" target="_blank" rel="noopener noreferrer">🌐 Bekijk bron / evenementwebsite</a></div>';}
    if(ev.reisblikMatch!==null && ev.reisblikMatch!==undefined){html+='<div><strong>Reisblik-match:</strong> '+esc(ev.reisblikMatch)+'/100</div>';}
    if(Array.isArray(ev.matchReasons)&&ev.matchReasons.length){html+='<div class="agenda-match-reasons">'+ev.matchReasons.map(x=>'• '+esc(x)).join('<br>')+'</div>';}

    if(permanent){
      html+='<button type="button" class="agenda-remove-btn" data-agenda-key="'+esc(eventKey(ev))+'">Verwijder uit mijn agenda</button>';
    }else if(isSaved(ev)){
      html+='<div class="agenda-saved-note">✓ Staat al in Mijn agenda</div>';
    }else{
      html+='<button type="button" class="agenda-save-btn" data-agenda-key="'+esc(eventKey(ev))+'">⭐ Bewaar in Mijn agenda</button>';
    }
    card.innerHTML=html; return card;
  }

  function renderAgenda(){
    const savedBox=el('agendaSavedEvents'); const importedBox=el('agendaImportedEvents');
    const savedEmpty=el('agendaEmpty'); const importedEmpty=el('agendaImportedEmpty');
    if(!savedBox||!importedBox||!savedEmpty||!importedEmpty) return;

    const saved=loadSaved().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    const imported=loadImported().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));

    savedBox.innerHTML=''; importedBox.innerHTML='';
    savedEmpty.style.display=saved.length?'none':'block';
    importedEmpty.style.display=imported.length?'none':'block';
    saved.forEach(ev=>savedBox.appendChild(eventCard(ev,true)));
    imported.forEach(ev=>importedBox.appendChild(eventCard(ev,false)));

    savedBox.querySelectorAll('.agenda-remove-btn').forEach(btn=>btn.addEventListener('click',function(){
      const key=this.getAttribute('data-agenda-key'); saveSaved(loadSaved().filter(ev=>eventKey(ev)!==key)); renderAgenda();
    }));
    importedBox.querySelectorAll('.agenda-save-btn').forEach(btn=>btn.addEventListener('click',function(){
      const key=this.getAttribute('data-agenda-key'); const ev=loadImported().find(x=>eventKey(x)===key); if(ev) window.reisblikAgendaBewaarEvenement(ev);
    }));
  }

  function updateAgendaLocation(){
    const status=el('agendaLocationStatus'); const coords=el('agendaLocationCoords'); if(!status||!coords)return;
    if(typeof userLat==='number'&&typeof userLon==='number'&&Number.isFinite(userLat)&&Number.isFinite(userLon)){
      const source=window.reisblikLocationSource; const label=source&&source.label?source.label:'Gekozen locatie';
      status.textContent='Basis voor toekomstige evenementenzoekopdrachten: '+label+'.';
      coords.textContent='GPS: '+formatCoord(userLat)+', '+formatCoord(userLon);
    }else{status.textContent='Je locatie is nog niet bepaald. Kies eerst Mijn locatie of Testpositie.'; coords.textContent='';}
  }

  function openAgenda(){
    const overlay=el('agendaOverlay'); if(!overlay)return;
    updateAgendaLocation(); renderAgenda(); overlay.style.display='flex';
    importTestAgenda().then(function(){renderAgenda();});
  }
  function closeAgenda(){const overlay=el('agendaOverlay'); if(overlay)overlay.style.display='none';}

  window.reisblikAgendaBewaarEvenement=function(event){
    if(!event||!String(event.name||'').trim())return false;
    const events=loadSaved(); const key=eventKey(event);
    if(!events.some(ev=>eventKey(ev)===key)){
      const copy=normalizeEvent(event); copy.savedAt=new Date().toISOString(); delete copy.importedFrom; delete copy.importedAt;
      events.push(copy); saveSaved(events);
    }
    renderAgenda();
    if(typeof window.drawMarkers==='function') window.drawMarkers();
    return true;
  };
  window.reisblikAgendaGetEvenementen=function(){return loadSaved().slice();};
  window.reisblikAgendaIsOpgeslagen=function(event){return isSaved(event);};
  window.reisblikAgendaUpdateLocation=updateAgendaLocation;
  window.reisblikOpenAgenda=openAgenda;
  window.reisblikCloseAgenda=closeAgenda;

  function init(){
    const open=el('agendaOpenBtn'), close=el('agendaCloseBtn'), overlay=el('agendaOverlay');
    if(open)open.addEventListener('click',openAgenda); if(close)close.addEventListener('click',closeAgenda);
    if(overlay)overlay.addEventListener('click',e=>{if(e.target===overlay)closeAgenda();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAgenda();});
    renderAgenda();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
