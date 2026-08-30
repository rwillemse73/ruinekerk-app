/* Reisblik 7.6 – optional helper for fixed HTML pages
   Fixed HTML files can include visited.js + this file to get Bezocht when
   opened directly. The normal Reisblik app does not require changes to each
   content file.
*/
(function(){
 function escLocal(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
 function add(){
  if(typeof reisblikVisitedHtml!=='function')return;
  const dataEl=document.querySelector('#location-data');
  if(!dataEl)return;
  let data;
  try{data=JSON.parse(dataEl.textContent||'{}');}catch(e){return;}
  if(!data.id)return;
  if(document.querySelector('.reisblik-fixed-visited'))return;
  const box=document.createElement('div');
  box.className='reisblik-fixed-visited';
  box.style.cssText='margin:12px 0';
  box.innerHTML=reisblikVisitedHtml(data.id,data.name||'',data.category||data.type||'');
  const article=document.querySelector('article');
  (article||document.body).insertBefore(box,(article||document.body).firstChild);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);
 else add();
})();
