/* Reisblik 7.0.2 – Bezocht */
const REISBLIK70_VISITED_KEY='reisblik_visited_v7';

function reisblik70LoadVisited(){
  try{
    const d=JSON.parse(localStorage.getItem(REISBLIK70_VISITED_KEY)||'{}');
    return d&&typeof d==='object'?d:{};
  }catch(e){console.warn('Bezocht laden mislukt',e);return {}}
}
function reisblik70SaveVisited(data){
  try{localStorage.setItem(REISBLIK70_VISITED_KEY,JSON.stringify(data));return true}
  catch(e){console.error('Bezocht opslaan mislukt',e);return false}
}
function reisblik70DateTime(iso){
  const d=new Date(iso);
  if(Number.isNaN(d.getTime()))return '';
  return new Intl.DateTimeFormat('nl-NL',{
    day:'2-digit',month:'2-digit',year:'numeric',
    hour:'2-digit',minute:'2-digit',hour12:false
  }).format(d);
}
function reisblik70ToggleVisited(id,name,category,cb,dateEl){
  const data=reisblik70LoadVisited(),key=String(id);
  if(cb.checked){
    const visitedAt=new Date().toISOString();
    data[key]={id:key,name:String(name||''),category:String(category||''),visitedAt};
    if(!reisblik70SaveVisited(data)){
      cb.checked=false;
      if(dateEl)dateEl.textContent='';
      return;
    }
    if(dateEl)dateEl.textContent='— '+reisblik70DateTime(visitedAt);
  }else{
    delete data[key];
    reisblik70SaveVisited(data);
    if(dateEl)dateEl.textContent='';
  }
}
function reisblik70Html(id,name,category){
  const key=String(id),v=reisblik70LoadVisited()[key];
  const checked=v&&v.visitedAt?' checked':'';
  const date=v&&v.visitedAt?'— '+reisblik70DateTime(v.visitedAt):'';
  return '<div class="reisblik-visited">'+
    '<input type="checkbox" id="reisblik70-cb-'+esc(key)+'"'+checked+
    ' onchange="reisblik70HandleVisited(this,'+JSON.stringify(key)+','+
    JSON.stringify(String(name||''))+','+JSON.stringify(String(category||''))+')">'+
    '<label for="reisblik70-cb-'+esc(key)+'">Bezocht</label>'+
    '<span class="reisblik-visited-date" id="reisblik70-date-'+esc(key)+'">'+
    esc(date)+'</span></div>';
}
function reisblik70HandleVisited(cb,id,name,category){
  const el=document.getElementById('reisblik70-date-'+id);
  reisblik70ToggleVisited(id,name,category,cb,el);
}
