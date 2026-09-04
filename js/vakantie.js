// Reisblik 9.0.1 — Centrale vakantiecontext
(function(){
  const STORAGE_KEY='reisblik_actieve_vakantie_v1';
  let vakanties=[];
  let actieveVakantie=null;
  const listeners=[];

  function getVakanties(){ return vakanties.slice(); }
  function getActieveVakantie(){ return actieveVakantie ? {...actieveVakantie} : null; }
  function getActieveVakantieId(){ return actieveVakantie ? actieveVakantie.id : ''; }
  function getActieveVakantieNaam(){ return actieveVakantie ? actieveVakantie.naam : ''; }
  function isVakantieActief(){ return !!actieveVakantie; }

  function notify(){
    const context=getActieveVakantie();
    listeners.forEach(fn=>{ try{ fn(context); }catch(e){ console.error('Vakantiecontext listener:',e); } });
    window.dispatchEvent(new CustomEvent('reisblikVakantieGewijzigd',{detail:context}));
  }

  function setVakanties(nieuweVakanties){
    vakanties=Array.isArray(nieuweVakanties) ? nieuweVakanties.filter(v=>v && v.id && v.naam) : [];
    const opgeslagen=localStorage.getItem(STORAGE_KEY) || '';
    const gevonden=vakanties.find(v=>v.id===opgeslagen);
    actieveVakantie=gevonden || (vakanties.length ? vakanties[0] : null);
    if(actieveVakantie) localStorage.setItem(STORAGE_KEY,actieveVakantie.id);
    else localStorage.removeItem(STORAGE_KEY);
    notify();
  }

  function kiesVakantie(id){
    const gevonden=vakanties.find(v=>v.id===id);
    if(!gevonden) return false;
    actieveVakantie=gevonden;
    localStorage.setItem(STORAGE_KEY,gevonden.id);
    notify();
    return true;
  }

  function onVakantieGewijzigd(fn){
    if(typeof fn!=='function') return ()=>{};
    listeners.push(fn);
    return ()=>{
      const i=listeners.indexOf(fn);
      if(i>=0) listeners.splice(i,1);
    };
  }

  window.reisblikVakantie={
    getVakanties,
    getActieveVakantie,
    getActieveVakantieId,
    getActieveVakantieNaam,
    isVakantieActief,
    setVakanties,
    kiesVakantie,
    onVakantieGewijzigd
  };
})();
