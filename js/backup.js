/* Reisblik 9.0.8 — Backup alle lokale gegevens per vakantie */
(function(){
  "use strict";

  const BASE_KEYS = [
    {key:"reisblik_visited_v1", label:"Bezocht"},
    {key:"ruinekerk_extra_info_v1", label:"Extra informatie"},
    {key:"ruinekerk_extra_simple_v1", label:"Eenvoudige Extra informatie"},
    {key:"ruinekerk_notes_v1", label:"Persoonlijke notities en ervaringen"},
    {key:"ruinekerk_user_locations_v1", label:"Eigen locaties"},
    {key:"reisblik_agenda_evenementen_v1", label:"Opgeslagen Agenda-evenementen"},
    {key:"reisblik_mijn_reisdag_datum", label:"Mijn reisdag datum"},
    {key:"reisblik_mijn_reisdag_datum_van", label:"Mijn reisdag datum van"},
    {key:"reisblik_mijn_reisdag_datum_tm", label:"Mijn reisdag datum t/m"}
  ];

  function idPart(id){
    return String(id||"").trim().toLowerCase()
      .replace(/[^a-z0-9_-]+/g,"_").replace(/^_+|_+$/g,"");
  }
  function scoped(base,id){ return base+"__"+idPart(id); }
  function read(key){
    const raw=localStorage.getItem(key);
    if(raw===null) return null;
    try{return JSON.parse(raw);}catch(e){return raw;}
  }
  function count(v){
    if(v===null || typeof v==="undefined") return 0;
    if(Array.isArray(v)) return v.length;
    if(v && typeof v==="object") return Object.keys(v).length;
    return 1;
  }

  function makeBackup(){
    const list = window.reisblikVakantie?.getVakanties
      ? window.reisblikVakantie.getVakanties() : [];
    const vacations = {};
    let totalItems = 0;

    list.forEach(v=>{
      const data={};
      const summary={};
      BASE_KEYS.forEach(item=>{
        const value=read(scoped(item.key,v.id));
        data[item.key]=value;
        summary[item.key]={label:item.label,itemCount:count(value),present:value!==null};
        totalItems += count(value);
      });
      vacations[String(v.id)]={
        id:String(v.id),
        naam:String(v.naam||v.id),
        type:String(v.type||"vast"),
        data,
        summary
      };
    });

    // Legacy/unscoped data is retained only so older installations are not lost.
    // New multi-vacation data is stored in the vacations object above.
    const legacyData={};
    BASE_KEYS.forEach(item=>legacyData[item.key]=read(item.key));

    return {
      backupFormatVersion:"3.0",
      applicationVersion:"9.0.8",
      backupType:"Reisblik persoonlijke lokale content per vakantie",
      backupCreatedAt:new Date().toISOString(),
      activeVacationId: window.reisblikVakantie?.getActieveVakantieId
        ? window.reisblikVakantie.getActieveVakantieId() : "",
      vacationCount:list.length,
      vacations,
      legacyData,
      includes:BASE_KEYS.map(x=>x.label),
      excludes:["Vaste HTML-content","Applicatiebestanden","config/vakanties.json"],
      summary:{vacationCount:list.length,totalItems}
    };
  }

  function fileDate(){
    const d=new Date(), p=n=>String(n).padStart(2,"0");
    return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"_"+
      p(d.getHours())+"-"+p(d.getMinutes());
  }

  function init(){
    const open=document.getElementById("backupOpenBtn");
    const modal=document.getElementById("backupModal");
    const close=document.getElementById("backupCloseBtn");
    const create=document.getElementById("backupCreateBtn");
    const status=document.getElementById("backupStatus");
    if(!open||!modal||!close||!create) return;
    if(open.dataset.backupBound==="true") return;
    open.dataset.backupBound="true";

    open.onclick=()=>{
      modal.style.display="block";
      if(status) status.textContent="";
    };
    close.onclick=()=>modal.style.display="none";
    modal.onclick=e=>{if(e.target===modal) modal.style.display="none";};

    create.onclick=()=>{
      try{
        const backup=makeBackup();
        const json=JSON.stringify(backup,null,2);
        const url=URL.createObjectURL(new Blob([json],{type:"application/json;charset=utf-8"}));
        const a=document.createElement("a");
        a.href=url;
        a.download="Reisblik_content_backup_"+fileDate()+".json";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
        if(status){
          status.textContent="✅ Backup gemaakt: "+backup.vacationCount+
            " vakantie(s), alle lokale gegevens per vakantie opgeslagen.";
        }
      }catch(e){
        console.error("Reisblik backup mislukt",e);
        if(status) status.textContent="⚠️ Backup maken is niet gelukt: "+e.message;
      }
    };
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
