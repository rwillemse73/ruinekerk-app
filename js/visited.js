/* Reisblik 7.0.4 – Bezocht
   Basis: Reisblik 7.0.
   De datum/tijd wordt in hetzelfde DOM-element bijgewerkt als de checkbox.
*/
const REISBLIK70_VISITED_KEY='reisblik_visited_v7';

function reisblik70LoadVisited(){
  try{
    const raw=localStorage.getItem(REISBLIK70_VISITED_KEY);
    if(!raw)return {};
    const data=JSON.parse(raw);
    return data&&typeof data==='object'?data:{};
  }catch(e){
    console.warn('Reisblik: bezochtgegevens konden niet worden gelezen.',e);
    return {};
  }
}

function reisblik70SaveVisited(data){
  try{
    localStorage.setItem(REISBLIK70_VISITED_KEY,JSON.stringify(data));
    return true;
  }catch(e){
    console.error('Reisblik: bezochtgegevens konden niet worden opgeslagen.',e);
    return false;
  }
}

function reisblik70DateTime(iso){
  const d=new Date(iso);
  if(Number.isNaN(d.getTime()))return '';
  return new Intl.DateTimeFormat('nl-NL',{
    day:'2-digit',month:'2-digit',year:'numeric',
    hour:'2-digit',minute:'2-digit',hour12:false
  }).format(d);
}

function reisblik70ToggleVisited(id,name,category,checkbox){
  const data=reisblik70LoadVisited();
  const key=String(id);

  if(checkbox.checked){
    const visitedAt=new Date().toISOString();
    const record={
      id:key,
      name:String(name||''),
      category:String(category||''),
      visitedAt:visitedAt
    };

    data[key]=record;

    if(!reisblik70SaveVisited(data)){
      checkbox.checked=false;
      return;
    }

    /* Het datumveld zit direct naast de checkbox in hetzelfde element. */
    const container=checkbox.closest('.reisblik-visited');
    if(container){
      const dateEl=container.querySelector('.reisblik-visited-date');
      if(dateEl)dateEl.textContent='— '+reisblik70DateTime(visitedAt);
    }
  }else{
    delete data[key];
    reisblik70SaveVisited(data);

    const container=checkbox.closest('.reisblik-visited');
    if(container){
      const dateEl=container.querySelector('.reisblik-visited-date');
      if(dateEl)dateEl.textContent='';
    }
  }
}

function reisblik70Html(id,name,category){
  const key=String(id);
  const visit=reisblik70LoadVisited()[key];
  const checked=visit&&visit.visitedAt?' checked':'';
  const date=visit&&visit.visitedAt?'— '+reisblik70DateTime(visit.visitedAt):'';

  return '<div class="reisblik-visited">'+
    '<input type="checkbox" id="reisblik70-cb-'+esc(key)+'"'+checked+
    ' onchange="reisblik70HandleVisited(this,'+
      JSON.stringify(key)+','+
      JSON.stringify(String(name||''))+','+
      JSON.stringify(String(category||''))+')">'+
    '<label for="reisblik70-cb-'+esc(key)+'">Bezocht</label>'+
    '<span class="reisblik-visited-date">'+esc(date)+'</span>'+
    '</div>';
}

function reisblik70HandleVisited(cb,id,name,category){
  reisblik70ToggleVisited(id,name,category,cb);
}
