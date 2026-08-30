/* Reisblik 7.2 – Mijn reisdag */
(function(){
  function byId(id){return document.getElementById(id);}

  function openMijnReisdag(){
    const overlay=byId('reisdagOverlay');
    const date=byId('reisdagDate');
    if(!overlay||!date)return;
    const saved=localStorage.getItem('reisblik_mijn_reisdag_datum');
    if(saved) date.value=saved;
    overlay.style.display='flex';
    setTimeout(function(){date.focus();},0);
  }

  function closeMijnReisdag(){
    const overlay=byId('reisdagOverlay');
    if(overlay) overlay.style.display='none';
  }

  function chooseMijnReisdag(){
    const date=byId('reisdagDate');
    const status=byId('reisdagStatus');
    if(!date||!date.value){
      if(status) status.textContent='Kies eerst een datum.';
      return;
    }
    localStorage.setItem('reisblik_mijn_reisdag_datum',date.value);
    if(status) status.textContent='Gekozen datum: '+date.value;
    setTimeout(closeMijnReisdag,700);
  }

  document.addEventListener('DOMContentLoaded',function(){
    const open=byId('reisdagOpenBtn');
    const cancel=byId('reisdagCancelBtn');
    const choose=byId('reisdagChooseBtn');
    const overlay=byId('reisdagOverlay');

    if(open) open.addEventListener('click',openMijnReisdag);
    if(cancel) cancel.addEventListener('click',closeMijnReisdag);
    if(choose) choose.addEventListener('click',chooseMijnReisdag);
    if(overlay) overlay.addEventListener('click',function(e){
      if(e.target===overlay) closeMijnReisdag();
    });
  });
})();
