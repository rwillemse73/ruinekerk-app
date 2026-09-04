/* Reisblik 8.8.4 – evenementenzoeker
 * Live bron: Ticketmaster Discovery API.
 * API-key wordt alleen lokaal in de browser opgeslagen.
 * De zoekresultaten worden heuristisch beoordeeld op de vaste Reisblik-criteria.
 */
(function(){
  const API_KEY_STORAGE='reisblik_ticketmaster_api_key_v1';
  const API_BASE='https://app.ticketmaster.com/discovery/v2/events.json';
  const DEFAULT_RADIUS=50;
  const MAX_RESULTS=30;
  const DAY_MS=86400000;

  function el(id){return document.getElementById(id);}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function clean(s){return String(s??'').replace(/\s+/g,' ').trim();}
  function apiKey(){try{return localStorage.getItem(API_KEY_STORAGE)||'';}catch(e){return '';}}
  function saveApiKey(v){try{localStorage.setItem(API_KEY_STORAGE,clean(v));}catch(e){}}
  function formatDateInput(d){return d.toISOString().slice(0,10);}
  function today(){const d=new Date();d.setHours(0,0,0,0);return d;}
  function defaultTo(){const d=today();d.setDate(d.getDate()+30);return d;}
  function parseDate(v,end){const d=new Date(String(v||'')); if(Number.isNaN(d.getTime())) return null; if(end)d.setHours(23,59,59,999); else d.setHours(0,0,0,0); return d;}
  function isoLocalStart(v){return v+'T00:00:00Z';}
  function isoLocalEnd(v){return v+'T23:59:59Z';}
  function formatNlDate(v){if(!v)return '';const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);return d.toLocaleDateString('nl-NL',{day:'2-digit',month:'2-digit',year:'numeric'});}
  function formatNlDateTime(v){if(!v)return '';const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);return d.toLocaleString('nl-NL',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});}
  function currentCoords(){
    if(typeof userLat==='number'&&typeof userLon==='number'&&Number.isFinite(userLat)&&Number.isFinite(userLon)) return {lat:userLat,lon:userLon};
    return null;
  }
  function sourceLabel(){return window.reisblikLocationSource?.label||'Gekozen locatie';}

  const criteria=[
    {key:'makers',label:'makers/contact',words:['kunstenaar','kunstenaar','maker','makers','artist','atelier','ontmoeting','creator','ambacht']},
    {key:'story',label:'verhaal/uitleg',words:['rondleiding','lezing','verhaal','uitleg','gids','talk','presentatie','demonstratie','workshop']},
    {key:'small',label:'kleinschalig',words:['kleinschalig','kleinschalige','lokaal','buurt','dorps','vereniging','community','intieme']},
    {key:'authentic',label:'lokaal/authentiek',words:['lokaal','streek','ambacht','stichting','vereniging','traditioneel','authentiek','historisch']},
    {key:'special',label:'bijzondere locatie',words:['fort','museum','kerk','kasteel','landgoed','molen','monument','theater','park','buitenplaats','abdij','slot']},
    {key:'nature',label:'natuur/wandelen',words:['wandeling','wandelen','natuur','route','buiten','park','bos','duin','landschap','fietstocht']},
    {key:'freedom',label:'vrijheid/zelf rondlopen',words:['vrij rondlopen','eigen tempo','zelfstandig','vrijheid','open atelier','markt','route']},
    {key:'social',label:'sociale ervaring',words:['ontmoet','ontmoeting','samen','community','buurt','social','gesprek','proeven']},
    {key:'unexpected',label:'onverwachte elementen',words:['bijzonder','verrassend','verrassing','eigenzinnig','uniek','onverwacht','alternatief']},
    {key:'knutter',label:'knutterigheid',words:['eigenzinnig','vrijwilligers','dorps','buurt','rommelig','alternatief','kleinschalig','onafhankelijk','lokaal initiatief']}
  ];

  function textForEvent(ev){
    const c=ev.classifications?.map(x=>[x.segment?.name,x.genre?.name,x.subGenre?.name]).flat().filter(Boolean).join(' ')||'';
    return clean([ev.name,ev.info,ev.pleaseNote,ev.description,ev.type,ev.subGenre,ev._venueName,c].filter(Boolean).join(' ')).toLocaleLowerCase('nl-NL');
  }
  function scoreEvent(ev){
    const text=textForEvent(ev);
    const matched=[];
    criteria.forEach(c=>{if(c.words.some(w=>text.includes(w.toLocaleLowerCase('nl-NL'))))matched.push(c);});
    let score=Math.min(100,35+matched.length*6);
    if(ev.url)score+=5;
    if(ev._venueName)score+=3;
    if(ev.dates?.start?.dateTime)score+=2;
    score=Math.min(100,score);
    return {score,matched};
  }
  function eventFromApi(ev){
    const venue=ev._embedded?.venues?.[0]||{};
    const location=clean([venue.name,venue.address?.line1,venue.city?.name].filter(Boolean).join(', '));
    const lat=Number(venue.location?.latitude),lon=Number(venue.location?.longitude);
    const date=ev.dates?.start?.localDate||'';
    const time=ev.dates?.start?.localTime||'';
    const start=date+(time?'T'+time:'');
    const price=ev.priceRanges?.length ? ev.priceRanges.map(p=>{ if(p.min===undefined)return ''; let v='€ '+Number(p.min).toFixed(2); if(p.max!==undefined && p.max!==p.min) v+=' – € '+Number(p.max).toFixed(2); return v; }).filter(Boolean).join(', ') : '';
    const score=scoreEvent({...ev,_venueName:venue.name});
    return {
      id:'tm-'+String(ev.id||''),
      name:clean(ev.name||'Onbenoemd evenement'),date,dateTime:start,location,lat,lon,
      type:clean(ev.classifications?.[0]?.genre?.name||ev.classifications?.[0]?.segment?.name||''),
      organizer:clean(ev.promoter?.name||ev.promoters?.[0]?.name||''),price,
      description:clean(ev.info||ev.pleaseNote||''),url:ev.url||'',
      source:'Ticketmaster',matchScore:score.score,matchCriteria:score.matched.map(x=>x.label),
      matchExplanation:score.matched.length?'Match op: '+score.matched.map(x=>x.label).join(', '):'Nog geen duidelijke inhoudelijke match op de Reisblik-criteria; bekijk de broninformatie.'
    };
  }
  function getParams(){
    const coords=currentCoords();
    if(!coords)return {error:'Kies eerst Mijn locatie of Testpositie.'};
    const from=el('agendaSearchFrom')?.value||formatDateInput(today());
    const to=el('agendaSearchTo')?.value||formatDateInput(defaultTo());
    const radius=Math.max(1,Math.min(500,Number(el('agendaSearchRadius')?.value||DEFAULT_RADIUS)));
    const keyword=clean(el('agendaSearchKeyword')?.value||'');
    if(!parseDate(from,false)||!parseDate(to,true)||from>to)return {error:'Controleer de periode: datum van moet vóór of gelijk aan datum t/m liggen.'};
    return {coords,from,to,radius,keyword};
  }
  async function search(){
    const status=el('agendaSearchStatus'),box=el('agendaSearchResults');
    if(!status||!box)return;
    const key=apiKey();
    if(!key){
      status.textContent='Voor live evenementen zoeken is eerst een Ticketmaster API-sleutel nodig.';
      box.innerHTML='<div class="agenda-search-help">Vul je persoonlijke API-sleutel in bij <strong>API-sleutel</strong>. De sleutel wordt alleen lokaal in deze browser bewaard.</div>';
      return;
    }
    const p=getParams(); if(p.error){status.textContent=p.error;box.innerHTML='';return;}
    status.textContent='Evenementen zoeken rond '+sourceLabel()+'…'; box.innerHTML='';
    const u=new URL(API_BASE);
    u.searchParams.set('apikey',key);u.searchParams.set('latlong',p.coords.lat+','+p.coords.lon);u.searchParams.set('radius',String(p.radius));u.searchParams.set('unit','km');u.searchParams.set('domain','nl');
    u.searchParams.set('startEndDateTime',isoLocalStart(p.from)+'/'+isoLocalEnd(p.to));u.searchParams.set('size',String(MAX_RESULTS));u.searchParams.set('sort','date,asc');u.searchParams.set('locale','nl-nl');
    if(p.keyword)u.searchParams.set('keyword',p.keyword);
    try{
      const r=await fetch(u.toString(),{cache:'no-store'});
      if(!r.ok){throw new Error('HTTP '+r.status);}
      const data=await r.json();
      const raw=data?._embedded?.events||[];
      const events=raw.map(eventFromApi).filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon));
      events.sort((a,b)=>b.matchScore-a.matchScore||String(a.date).localeCompare(String(b.date)));
      window.reisblikAgendaSearchResults=events;
      status.textContent=events.length+' evenementen gevonden binnen '+p.radius+' km.';
      renderResults(events);
    }catch(e){
      console.error(e); status.textContent='Evenementen zoeken mislukt.';
      box.innerHTML='<div class="agenda-search-help">De externe evenementenbron kon niet worden geraadpleegd. Controleer je API-sleutel en internetverbinding.</div>';
    }
  }
  function renderResults(events){
    const box=el('agendaSearchResults');if(!box)return;
    if(!events.length){box.innerHTML='<div class="agenda-empty">Geen evenementen gevonden met deze instellingen.</div>';return;}
    box.innerHTML=events.map((ev,i)=>{
      const saved=typeof window.reisblikAgendaIsOpgeslagen==='function'&&window.reisblikAgendaIsOpgeslagen(ev);
      return '<article class="agenda-search-card">'+
        '<div class="agenda-search-title">'+esc(ev.name)+'</div>'+
        '<div class="agenda-search-meta">'+esc(formatNlDate(ev.date))+(ev.dateTime?' · '+esc(ev.dateTime.slice(11,16)):'')+' · '+esc(ev.location||'Locatie onbekend')+'</div>'+
        (ev.type?'<div><strong>Type:</strong> '+esc(ev.type)+'</div>':'')+
        (ev.price?'<div><strong>Prijs:</strong> '+esc(ev.price)+'</div>':'')+
        '<div class="agenda-match"><strong>Reisblik-match: '+ev.matchScore+'/100</strong><br><span>'+esc(ev.matchExplanation)+'</span></div>'+ 
        '<div class="agenda-search-actions">'+
        (ev.url?'<a class="agenda-source-link" href="'+esc(ev.url)+'" target="_blank" rel="noopener">Bron bekijken</a>':'')+
        '<label class="agenda-save-label"><input type="checkbox" class="agenda-save-checkbox" data-index="'+i+'" '+(saved?'checked disabled':'')+'> '+(saved?'Lokaal opgeslagen':'Bewaar lokaal in mijn agenda')+'</label>'+
        '</div></article>';
    }).join('');
    box.querySelectorAll('.agenda-save-checkbox').forEach(cb=>cb.addEventListener('change',function(){
      if(!this.checked)return;
      const ev=window.reisblikAgendaSearchResults?.[Number(this.dataset.index)];
      if(!ev||typeof window.reisblikAgendaBewaarEvenement!=='function')return;
      if(window.reisblikAgendaBewaarEvenement(ev)){
        this.disabled=true;
        const label=this.closest('label'); if(label)label.lastChild.textContent=' Lokaal opgeslagen';
        if(typeof drawMarkers==='function')drawMarkers();
      }
    }));
  }
  function init(){
    const from=el('agendaSearchFrom'),to=el('agendaSearchTo'),key=el('agendaApiKey');
    if(from&&!from.value)from.value=formatDateInput(today());
    if(to&&!to.value)to.value=formatDateInput(defaultTo());
    if(key)key.value=apiKey();
    el('agendaApiSaveBtn')?.addEventListener('click',()=>{saveApiKey(key?.value||'');el('agendaApiStatus').textContent=apiKey()?'API-sleutel lokaal opgeslagen.':'API-sleutel verwijderd.';});
    el('agendaSearchBtn')?.addEventListener('click',search);
    if(key)key.addEventListener('keydown',e=>{if(e.key==='Enter'){saveApiKey(key.value);search();}});
  }
  window.reisblikAgendaZoekEvenementen=search;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
