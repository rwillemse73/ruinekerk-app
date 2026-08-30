/* Reisblik 7.0 – Bezocht */
const REISBLIK70_VISITED_KEY='reisblik_visited_v7';

function reisblik70LoadVisited(){
  try{return JSON.parse(localStorage.getItem(REISBLIK70_VISITED_KEY)||'{}')}
  catch(e){return {}}
}
function reisblik70SaveVisited(data){
  localStorage.setItem(REISBLIK70_VISITED_KEY,JSON.stringify(data));
}
function reisblik70DateTime(iso){
  return new Intl.DateTimeFormat('nl-NL',{dateStyle:'short',timeStyle:'short'}).format(new Date(iso));
}
function reisblik70ToggleVisited(id,name,category,cb,dateEl){
  const data=reisblik70LoadVisited();
  const key=String(id);
  if(cb.checked){
    data[key]={id:key,name:String(name||''),category:String(category||''),visitedAt:new Date().toISOString()};
  }else{
    delete data[key];
  }
  reisblik70SaveVisited(data);
  const v=data[key];
  if(dateEl) dateEl.textContent=v?'— '+reisblik70DateTime(v.visitedAt):'';
}
function reisblik70Html(id,name,category){
  const key=String(id);
  const v=reisblik70LoadVisited()[key];
  const checked=v?' checked':'';
  const date=v?'— '+reisblik70DateTime(v.visitedAt):'';
  return '<div class="reisblik-visited">'+
    '<input type="checkbox" id="reisblik70-cb-'+esc(key)+'"'+checked+
    ' onchange="reisblik70Handle(this,'+
      JSON.stringify(key)+','+JSON.stringify(String(name||''))+','+JSON.stringify(String(category||''))+')">'+
    '<label for="reisblik70-cb-'+esc(key)+'">Bezocht</label>'+
    '<span class="reisblik-visited-date" id="reisblik70-date-'+esc(key)+'">'+esc(date)+'</span>'+
    '</div>';
}
function reisblik70Handle(cb,id,name,category){
  const dateEl=document.getElementById('reisblik70-date-'+id);
  reisblik70ToggleVisited(id,name,category,cb,dateEl);
}
