// Reisblik 9.0.2 — Vakantiekeuze
// Fase 1 + 2: dropdown uit config en koppeling aan de centrale vakantiecontext.
(function(){
  async function laadVakanties(){
    const select=document.getElementById('vakantieSelect');
    const status=document.getElementById('vakantieStatus');
    if(!select || !window.reisblikVakantie) return;

    try{
      const response=await fetch('config/vakanties.json?v='+Date.now(),{cache:'no-store'});
      if(!response.ok) throw new Error('HTTP '+response.status);
      const data=await response.json();
      const vakanties=Array.isArray(data.vakanties)?data.vakanties:[];
      window.reisblikVakantie.setVakanties(vakanties);

      select.innerHTML='';
      if(!vakanties.length){
        const option=document.createElement('option');
        option.value='';
        option.textContent='— nog geen vakanties ingesteld —';
        select.appendChild(option);
        select.disabled=true;
        if(status) status.textContent='Voeg vakanties toe in config/vakanties.json.';
        return;
      }

      for(const vakantie of window.reisblikVakantie.getVakanties()){
        const option=document.createElement('option');
        option.value=vakantie.id;
        option.textContent=vakantie.naam;
        select.appendChild(option);
      }

      const actief=window.reisblikVakantie.getActieveVakantie();
      if(actief) select.value=actief.id;
      select.disabled=false;
      if(status) status.textContent=actief ? 'Actieve vakantie: '+actief.naam : '';
    }catch(error){
      console.error('Vakanties konden niet worden geladen:',error);
      select.innerHTML='';
      const option=document.createElement('option');
      option.value='';
      option.textContent='— vakanties konden niet worden geladen —';
      select.appendChild(option);
      select.disabled=true;
      if(status) status.textContent='Controleer of config/vakanties.json aanwezig is.';
    }
  }

  function verbindKeuze(){
    const select=document.getElementById('vakantieSelect');
    const status=document.getElementById('vakantieStatus');
    if(!select || !window.reisblikVakantie) return;

    select.addEventListener('change',function(){
      if(window.reisblikVakantie.kiesVakantie(select.value)){
        const actief=window.reisblikVakantie.getActieveVakantie();
        if(status) status.textContent='Actieve vakantie: '+actief.naam;
      }
    });

    window.reisblikVakantie.onVakantieGewijzigd(function(vakantie){
      if(vakantie){
        select.value=vakantie.id;
        if(status) status.textContent='Actieve vakantie: '+vakantie.naam;
      }else if(status){
        status.textContent='Nog geen vakantie geselecteerd.';
      }
    });
  }

  document.addEventListener('DOMContentLoaded',function(){
    verbindKeuze();
    laadVakanties();
  });
})();
