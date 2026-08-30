/* Reisblik 7.0 – UI */
(function(){
  let selectedLocationPhoto=null;
  let selectedLocationPhotoName='';

  function photoInput(){
    return document.getElementById('newLocationPhoto');
  }

  function setupLocationPhoto(){
    const input=photoInput();
    if(!input || input.dataset.photoBound) return;
    input.dataset.photoBound='1';
    input.addEventListener('change',()=>{
      const file=input.files && input.files[0];
      if(!file){ selectedLocationPhoto=null; selectedLocationPhotoName=''; return; }
      const reader=new FileReader();
      reader.onload=()=>{
        selectedLocationPhoto=reader.result;
        selectedLocationPhotoName=file.name;
        const preview=document.getElementById('newLocationPhotoPreview');
        if(preview){
          preview.innerHTML='<img class="location-add-preview" alt="Gekozen foto">';
          preview.querySelector('img').src=selectedLocationPhoto;
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function getSelectedLocationPhoto(){
    return selectedLocationPhoto;
  }

  // Expose tiny helpers for the existing save flow.
  window.__locationPhoto={
    setup:setupLocationPhoto,
    get:getSelectedLocationPhoto,
    getName:()=>selectedLocationPhotoName
  };

  // If the form is rendered dynamically, bind after DOM updates as well.
  setupLocationPhoto();
  new MutationObserver(setupLocationPhoto).observe(document.body,{childList:true,subtree:true});
})();

function updateCurrentDateTime(){
 const el=document.getElementById('currentDateTime');
 if(!el)return;
 const now=new Date();
 const date=String(now.getDate()).padStart(2,'0')+'-'+
            String(now.getMonth()+1).padStart(2,'0')+'-'+
            now.getFullYear();
 const time=String(now.getHours()).padStart(2,'0')+':'+
            String(now.getMinutes()).padStart(2,'0')+':'+
            String(now.getSeconds()).padStart(2,'0');
 el.textContent=date+' · '+time;
}
let __lastOpeningMinute='';
function refreshOpeningMinute(){
 const now=new Date();
 const key=now.getFullYear()+'-'+now.getMonth()+'-'+now.getDate()+'-'+now.getHours()+'-'+now.getMinutes();
 if(key!==__lastOpeningMinute){
  __lastOpeningMinute=key;
  openingStatusCache={};
  if(openOnly){
   toggleOpenOnly(true);
  }
 }
}
updateCurrentDateTime();
setInterval(updateCurrentDateTime,1000);
setInterval(refreshOpeningMinute,1000);

function reisblikInstallCloseButton(){
  let layer=document.getElementById('reisblikCloseLayer');
  if(!layer){
    layer=document.createElement('div');
    layer.id='reisblikCloseLayer';
    document.body.appendChild(layer);
  }
  let b=document.getElementById('reisblikCloseBtn');
  if(!b){
    b=document.createElement('button');
    b.id='reisblikCloseBtn';
    b.type='button';
    b.setAttribute('aria-label','App sluiten');
    b.title='App sluiten';
    b.textContent='×';
    b.addEventListener('click',function(){
      try{window.close()}catch(e){}
      setTimeout(function(){
        if(!document.hidden){
          try{history.back()}catch(e){}
        }
      },150);
    });
    layer.appendChild(b);
  }
}
document.addEventListener('DOMContentLoaded',function(){
  reisblikInstallCloseButton();
  // Re-assert after the app has rendered/re-rendered its content.
  [250,750,1500].forEach(function(ms){setTimeout(reisblikInstallCloseButton,ms)});
});
window.addEventListener('hashchange',reisblikInstallCloseButton);
window.addEventListener('popstate',reisblikInstallCloseButton);
