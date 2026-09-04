/* Reisblik 9.0.8 — Restore alle lokale gegevens per vakantie */
(function(){
  "use strict";

  const BASE_KEYS=[
    "reisblik_visited_v1",
    "ruinekerk_extra_info_v1",
    "ruinekerk_extra_simple_v1",
    "ruinekerk_notes_v1",
    "ruinekerk_user_locations_v1",
    "reisblik_agenda_evenementen_v1",
    "reisblik_mijn_reisdag_datum",
    "reisblik_mijn_reisdag_datum_van",
    "reisblik_mijn_reisdag_datum_tm"
  ];
  const ACTIVE_VACATION_KEY="reisblik_actieve_vakantie_v1";
  let selectedBackup=null;

  function idPart(id){
    return String(id||"").trim().toLowerCase()
      .replace(/[^a-z0-9_-]+/g,"_").replace(/^_+|_+$/g,"");
  }
  function scoped(base,id){return base+"__"+idPart(id);}
  function safeWrite(key,value){
    if(value===null || typeof value==="undefined") localStorage.removeItem(key);
    else localStorage.setItem(key,JSON.stringify(value));
  }
  function currentVacationIds(){
    const list=window.reisblikVakantie?.getVakanties
      ? window.reisblikVakantie.getVakanties() : [];
    return list.map(v=>idPart(v.id)).filter(Boolean);
  }
  function renderPreview(b){
    const el=document.getElementById("restorePreview");
    if(!el) return;
    if(b && b.vacations && typeof b.vacations==="object"){
      const ids=Object.keys(b.vacations);
      const known=ids.filter(id=>currentVacationIds().includes(idPart(id))).length;
      el.textContent="Backupformaat "+(b.backupFormatVersion||"onbekend")+
        " • "+ids.length+" vakantie(s) in backup • "+known+" aanwezig in deze app.";
    }else{
      el.textContent="Oud backupformaat gecontroleerd; gegevens worden aan de actieve vakantie gekoppeld.";
    }
  }

  function restoreMultiVacation(b){
    const entries=Object.entries(b.vacations||{});
    if(!entries.length) throw new Error("De backup bevat geen vakantiedata.");

    // First clear supported scoped data for vacations currently known by the app.
    // This makes restore an actual restore rather than a merge for configured vacations.
    currentVacationIds().forEach(id=>{
      BASE_KEYS.forEach(base=>localStorage.removeItem(scoped(base,id)));
    });

    // Restore every vacation present in the backup, including a vacation that is
    // not currently listed in config/vakanties.json. Its data remains recoverable
    // if that vacation is added to the configuration later.
    entries.forEach(([id,v])=>{
      BASE_KEYS.forEach(base=>{
        if(!Object.prototype.hasOwnProperty.call(v?.data||{},base)) return;
        safeWrite(scoped(base,id),v.data[base]);
      });
    });

    if(b.activeVacationId && currentVacationIds().includes(idPart(b.activeVacationId))){
      localStorage.setItem(ACTIVE_VACATION_KEY,String(b.activeVacationId));
    }
  }

  function restoreLegacy(b){
    const active=window.reisblikVakantie?.getActieveVakantieId
      ? window.reisblikVakantie.getActieveVakantieId() : "";
    if(!active) throw new Error("Geen actieve vakantie beschikbaar.");
    const id=idPart(active);
    const data=b.data||{};
    BASE_KEYS.forEach(base=>{
      if(Object.prototype.hasOwnProperty.call(data,base)) safeWrite(scoped(base,id),data[base]);
    });
  }

  function doRestore(){
    if(!selectedBackup) return;
    if(selectedBackup.vacations && typeof selectedBackup.vacations==="object"){
      restoreMultiVacation(selectedBackup);
    }else if(selectedBackup.data){
      restoreLegacy(selectedBackup);
    }else{
      throw new Error("Onbekend backupformaat.");
    }
  }

  function init(){
    const open=document.getElementById("restoreOpenBtn");
    const modal=document.getElementById("restoreModal");
    const close=document.getElementById("restoreCloseBtn");
    const file=document.getElementById("restoreFile");
    const confirm=document.getElementById("restoreConfirmBtn");
    const status=document.getElementById("restoreStatus");
    if(!open||!modal||!close||!file||!confirm) return;
    if(open.dataset.restoreBound==="true") return;
    open.dataset.restoreBound="true";

    open.onclick=()=>{
      modal.style.display="block";
      file.value="";
      selectedBackup=null;
      confirm.disabled=true;
      if(status) status.textContent="";
      const preview=document.getElementById("restorePreview");
      if(preview) preview.textContent="";
    };
    close.onclick=()=>modal.style.display="none";
    modal.onclick=e=>{if(e.target===modal) modal.style.display="none";};

    file.onchange=()=>{
      const f=file.files?.[0];
      if(!f) return;
      const r=new FileReader();
      r.onload=()=>{
        try{
          const b=JSON.parse(r.result);
          if(!b || !b.backupType || (!b.data && !b.vacations))
            throw new Error("Geen geldige Reisblik-backup");
          selectedBackup=b;
          renderPreview(b);
          confirm.disabled=false;
          if(status) status.textContent="";
        }catch(e){
          selectedBackup=null;
          confirm.disabled=true;
          if(status) status.textContent="⚠️ Ongeldige backup: "+e.message;
        }
      };
      r.readAsText(f);
    };

    confirm.onclick=()=>{
      if(!selectedBackup) return;
      const multi=!!(selectedBackup.vacations && typeof selectedBackup.vacations==="object");
      const message=multi
        ? "Weet je zeker dat je deze backup wilt terugzetten? De ondersteunde lokale gegevens van de in de app bekende vakanties worden vervangen."
        : "Weet je zeker dat je deze backup wilt terugzetten? De lokale gegevens van de actieve vakantie worden overschreven.";
      if(!window.confirm(message)) return;
      try{
        doRestore();
        if(status) status.textContent="✅ Backup teruggezet. Reisblik wordt opnieuw geladen.";
        setTimeout(()=>window.location.reload(),700);
      }catch(e){
        console.error("Reisblik restore mislukt",e);
        if(status) status.textContent="⚠️ Backup terugzetten is niet gelukt: "+e.message;
      }
    };
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
