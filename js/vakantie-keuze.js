// Reisblik 9.0.0 — Vakantiekeuze
// Fase 1: alleen de dropdown vullen vanuit config/vakanties.json.
(function(){
  async function laadVakanties(){
    const select=document.getElementById('vakantieSelect');
    const status=document.getElementById('vakantieStatus');
    if(!select) return;

    try{
      const response=await fetch('config/vakanties.json?v='+Date.now(),{cache:'no-store'});
      if(!response.ok) throw new Error('HTTP '+response.status);
      const data=await response.json();
      const vakanties=Array.isArray(data.vakanties)?data.vakanties:[];

      select.innerHTML='';
      if(vakanties.length===0){
        const option=document.createElement('option');
        option.value='';
        option.textContent='— nog geen vakanties ingesteld —';
        select.appendChild(option);
        select.disabled=true;
        if(status) status.textContent='Voeg vakanties toe in config/vakanties.json.';
        return;
      }

      for(const vakantie of vakanties){
        if(!vakantie || !vakantie.id || !vakantie.naam) continue;
        const option=document.createElement('option');
        option.value=vakantie.id;
        option.textContent=vakantie.naam;
        select.appendChild(option);
      }

      if(select.options.length===0){
        const option=document.createElement('option');
        option.value='';
        option.textContent='— geen geldige vakanties —';
        select.appendChild(option);
        select.disabled=true;
        if(status) status.textContent='Controleer config/vakanties.json.';
      }else if(status){
        status.textContent='';
      }
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

  document.addEventListener('DOMContentLoaded',laadVakanties);
})();
