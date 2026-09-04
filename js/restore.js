/* Reisblik 9.0.4 — Restore lokale gegevens per vakantie */
(function(){
  const BASE_KEYS=["reisblik_visited_v1","ruinekerk_extra_info_v1","ruinekerk_extra_simple_v1","ruinekerk_notes_v1","ruinekerk_user_locations_v1","reisblik_agenda_evenementen_v1","reisblik_mijn_reisdag_datum","reisblik_mijn_reisdag_datum_van","reisblik_mijn_reisdag_datum_tm"];
  let selectedBackup=null;
  function idPart(id){return String(id||"").trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"_").replace(/^_+|_+$/g,"");}
  function scoped(base,id){return base+"__"+idPart(id);}
  function targetKey(base){return window.reisblikVakantie?.getVakantieStorageKey?window.reisblikVakantie.getVakantieStorageKey(base):base;}
  function writeActive(base,value){const key=targetKey(base);if(value===null||typeof value==="undefined")localStorage.removeItem(key);else localStorage.setItem(key,JSON.stringify(value));}
  function renderPreview(b){const el=document.getElementById("restorePreview");if(!el)return;el.textContent="Backupformaat "+(b?.backupFormatVersion||"onbekend")+" gecontroleerd.";}
  function init(){
    const open=document.getElementById("restoreOpenBtn"),modal=document.getElementById("restoreModal"),close=document.getElementById("restoreCloseBtn"),file=document.getElementById("restoreFile"),confirm=document.getElementById("restoreConfirmBtn"),status=document.getElementById("restoreStatus");
    if(!open||!modal||!close||!file||!confirm)return;
    if(open.dataset.restoreBound==="true")return;open.dataset.restoreBound="true";
    open.onclick=()=>{modal.style.display="block";file.value="";confirm.disabled=true;if(status)status.textContent="";};
    close.onclick=()=>modal.style.display="none";
    modal.onclick=e=>{if(e.target===modal)modal.style.display="none";};
    file.onchange=()=>{const f=file.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const b=JSON.parse(r.result);if(!b||!b.backupType||(!b.data&&!b.vacations))throw new Error("Geen geldige Reisblik-backup");selectedBackup=b;renderPreview(b);confirm.disabled=false;}catch(e){selectedBackup=null;confirm.disabled=true;if(status)status.textContent="⚠️ Ongeldige backup: "+e.message;}};r.readAsText(f);};
    confirm.onclick=()=>{if(!selectedBackup||!window.confirm("Weet je zeker dat je deze backup wilt terugzetten? De lokale gegevens worden overschreven."))return;try{
      if(selectedBackup.vacations&&typeof selectedBackup.vacations==='object'){
        Object.entries(selectedBackup.vacations).forEach(([id,v])=>Object.entries(v?.data||{}).forEach(([base,val])=>{if(!BASE_KEYS.includes(base))return;const key=scoped(base,id);if(val===null||typeof val==='undefined')localStorage.removeItem(key);else localStorage.setItem(key,JSON.stringify(val));}));
        if(selectedBackup.legacyData){Object.entries(selectedBackup.legacyData).forEach(([base,val])=>{if(BASE_KEYS.includes(base)&&val!==null&&typeof val!=="undefined"&&localStorage.getItem(targetKey(base))===null)writeActive(base,val);});}
      }else{BASE_KEYS.forEach(base=>{if(Object.prototype.hasOwnProperty.call(selectedBackup.data||{},base))writeActive(base,selectedBackup.data[base]);});}
      if(status)status.textContent="✅ Backup teruggezet. Reisblik wordt opnieuw geladen.";setTimeout(()=>window.location.reload(),700);
    }catch(e){if(status)status.textContent="⚠️ Backup terugzetten is niet gelukt: "+e.message;}};
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
