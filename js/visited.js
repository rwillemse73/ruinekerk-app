/* Reisblik 6.8 – Bezocht */
const REISBLIK_VISITED_KEY='reisblik_visited_v1';

function reisblikVisitedLoad(){
  try{return JSON.parse(localStorage.getItem(REISBLIK_VISITED_KEY)||'{}')}
  catch(e){return {}}
}
function reisblikVisitedSave(data){
  localStorage.setItem(REISBLIK_VISITED_KEY,JSON.stringify(data));
}
function reisblikVisitedDate(iso){
  return new Intl.DateTimeFormat('nl-NL',{
    day:'2-digit',month:'2-digit',year:'numeric',
    hour:'2-digit',minute:'2-digit'
  }).format(new Date(iso));
}
function reisblikVisitedToggle(id,name,category,checkbox,dateEl,labelEl){
  const data=reisblikVisitedLoad();
  const key=String(id);

  if(checkbox.checked){
    data[key]={
      id:key,
      name:String(name||''),
      category:String(category||''),
      visitedAt:new Date().toISOString()
    };
  }else{
    delete data[key];
  }

  reisblikVisitedSave(data);
  const visit=data[key];

  /* Het checkbox-vakje zelf toont het vinkje.
     Daarom geen extra ☑/☐ in het label: zo voorkomen we dubbele vinkjes. */
  if(labelEl) labelEl.textContent='Bezocht';
  if(dateEl) dateEl.textContent=visit?'— '+reisblikVisitedDate(visit.visitedAt):'';
}
function reisblikVisitedHtml(id,name,category){
  const key=String(id);
  const visit=reisblikVisitedLoad()[key];
  const checked=visit?' checked':'';
  const date=visit?'— '+reisblikVisitedDate(visit.visitedAt):'';

  return '<div class="reisblik-visited">'+
    '<input type="checkbox" id="reisblik-visited-cb-'+esc(key)+'"'+checked+
    ' onchange="reisblikVisitedHandle(this,'+
      JSON.stringify(key)+','+
      JSON.stringify(String(name||''))+','+
      JSON.stringify(String(category||''))+')">'+
    '<label id="reisblik-visited-label-'+esc(key)+'" for="reisblik-visited-cb-'+esc(key)+'">Bezocht</label>'+
    '<span class="reisblik-visited-date" id="reisblik-visited-date-'+esc(key)+'">'+esc(date)+'</span>'+
    '</div>';
}
function reisblikVisitedHandle(cb,id,name,category){
  const dateEl=document.getElementById('reisblik-visited-date-'+id);
  const labelEl=document.getElementById('reisblik-visited-label-'+id);
  reisblikVisitedToggle(id,name,category,cb,dateEl,labelEl);
}
