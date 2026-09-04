// Reisblik 9.0.2 — Centrale vakantiecontext
(function(){
  const STORAGE_KEY='reisblik_actieve_vakantie_v1';
  let vakanties=[];
  let actieveVakantie=null;
  const listeners=[];
  let readyResolve;
  const readyPromise=new Promise(resolve=>{readyResolve=resolve;});

  function getVakanties(){return vakanties.slice();}
  function getActieveVakantie(){return actieveVakantie ? {...actieveVakantie} : null;}
  function getActieveVakantieId(){return actieveVakantie ? actieveVakantie.id : '';}
  function getActieveVakantieNaam(){return actieveVakantie ? actieveVakantie.naam : '';}
  function getActieveVakantieType(){return actieveVakantie ? (actieveVakantie.type||'vast') : '';}
  function getActieveVakantieBasePath(){return actieveVakantie ? String(actieveVakantie.basePath||actieveVakantie.id||'').replace(/^\/+|\/+$/g,'') : '';}
  function getActieveVakantieHtmlLocations(){return actieveVakantie && Array.isArray(actieveVakantie.htmlLocations) ? actieveVakantie.htmlLocations.slice() : [];}
  function isVakantieActief(){return !!actieveVakantie;}
  function whenReady(){return readyPromise;}

  function notify(){
    const context=getActieveVakantie();
    listeners.forEach(fn=>{try{fn(context);}catch(e){console.error('Vakantiecontext listener:',e);}});
    window.dispatchEvent(new CustomEvent('reisblikVakantieGewijzigd',{detail:context}));
  }

  function setVakanties(nieuweVakanties){
    vakanties=Array.isArray(nieuweVakanties) ? nieuweVakanties.filter(v=>v && v.id && v.naam) : [];
    const opgeslagen=localStorage.getItem(STORAGE_KEY)||'';
    const gevonden=vakanties.find(v=>v.id===opgeslagen);
    actieveVakantie=gevonden || (vakanties.length ? vakanties[0] : null);
    if(actieveVakantie)localStorage.setItem(STORAGE_KEY,actieveVakantie.id);
    else localStorage.removeItem(STORAGE_KEY);
    readyResolve(getActieveVakantie());
    notify();
  }

  function kiesVakantie(id){
    const gevonden=vakanties.find(v=>v.id===id);
    if(!gevonden)return false;
    actieveVakantie=gevonden;
    localStorage.setItem(STORAGE_KEY,gevonden.id);
    notify();
    return true;
  }

  function onVakantieGewijzigd(fn){
    if(typeof fn!=='function')return ()=>{};
    listeners.push(fn);
    return ()=>{const i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};
  }

  window.reisblikVakantie={
    getVakanties,getActieveVakantie,getActieveVakantieId,getActieveVakantieNaam,
    getActieveVakantieType,getActieveVakantieBasePath,getActieveVakantieHtmlLocations,
    isVakantieActief,setVakanties,kiesVakantie,onVakantieGewijzigd,whenReady
  };
})();
