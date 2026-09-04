/* Reisblik 9.0.4 — Backup lokale gegevens per vakantie */
(function(){
  "use strict";
  const BASE_KEYS=[
    {key:"reisblik_visited_v1",label:"Bezocht"},
    {key:"ruinekerk_extra_info_v1",label:"Extra informatie"},
    {key:"ruinekerk_extra_simple_v1",label:"Eenvoudige Extra informatie"},
    {key:"ruinekerk_notes_v1",label:"Persoonlijke notities en ervaringen"},
    {key:"ruinekerk_user_locations_v1",label:"Eigen locaties"},
    {key:"reisblik_agenda_evenementen_v1",label:"Mijn agenda evenementen"},
    {key:"reisblik_mijn_reisdag_datum",label:"Mijn reisdag datum"},
    {key:"reisblik_mijn_reisdag_datum_van",label:"Mijn reisdag datum van"},
    {key:"reisblik_mijn_reisdag_datum_tm",label:"Mijn reisdag datum t/m"}
  ];
  function idPart(id){return String(id||"").trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"_").replace(/^_+|_+$/g,"");}
  function scoped(base,id){return base+"__"+idPart(id);}
  function read(key){const raw=localStorage.getItem(key);if(raw===null)return null;try{return JSON.parse(raw);}catch(e){return raw;}}
  function count(v){if(Array.isArray(v))return v.length;if(v&&typeof v==="object")return Object.values(v).reduce((n,x)=>n+(Array.isArray(x)?x.length:1),0);return v===null?0:1;}
  function make(){
    const vacations={};
    const list=window.reisblikVakantie?.getVakanties ? window.reisblikVakantie.getVakanties() : [];
    list.forEach(v=>{
      const data={};
      BASE_KEYS.forEach(item=>data[item.key]=read(scoped(item.key,v.id)));
      vacations[String(v.id)]={naam:v.naam,type:v.type||"vast",data:data};
    });
    const active=window.reisblikVakantie?.getActieveVakantieId ? window.reisblikVakantie.getActieveVakantieId() : "";
    return {backupFormatVersion:"2.0",applicationVersion:"9.0.4",backupType:"Reisblik persoonlijke lokale content per vakantie",backupCreatedAt:new Date().toISOString(),activeVacationId:active,vacations:vacations,legacyData:Object.fromEntries(BASE_KEYS.map(x=>[x.key,read(x.key)])),includes:BASE_KEYS.map(x=>x.label),excludes:["Vaste HTML-content","Applicatiebestanden"]};
  }
  function fileDate(){const d=new Date(),p=n=>String(n).padStart(2,"0");return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"_"+p(d.getHours())+"-"+p(d.getMinutes());}
  function init(){
    const open=document.getElementById("backupOpenBtn"),modal=document.getElementById("backupModal"),close=document.getElementById("backupCloseBtn"),create=document.getElementById("backupCreateBtn"),status=document.getElementById("backupStatus");
    if(!open||!modal||!close||!create)return;
    if(open.dataset.backupBound==="true")return; open.dataset.backupBound="true";
    open.onclick=()=>{modal.style.display="block";if(status)status.textContent="";};
    close.onclick=()=>modal.style.display="none";
    modal.onclick=e=>{if(e.target===modal)modal.style.display="none";};
    create.onclick=()=>{try{const b=make();const json=JSON.stringify(b,null,2);const url=URL.createObjectURL(new Blob([json],{type:"application/json;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="Reisblik_content_backup_"+fileDate()+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);if(status)status.textContent="✅ Backup gemaakt met gegevens per vakantie.";}catch(e){console.error("Reisblik backup mislukt",e);if(status)status.textContent="⚠️ Backup maken is niet gelukt.";}};
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
