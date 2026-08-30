/* Reisblik 7.0.5 DIAG – Bezocht interne keten */
const REISBLIK70_VISITED_KEY='reisblik_visited_v7';

function reisblik70Diag(msg){
  let box=document.getElementById('reisblikVisitedDiag');
  if(!box){
    box=document.createElement('div');
    box.id='reisblikVisitedDiag';
    box.style.cssText='position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483647;background:#fff;border:2px solid #555;border-radius:8px;padding:10px;font:12px Arial;max-height:45vh;overflow:auto;box-shadow:0 2px 8px rgba(0,0,0,.25)';
    document.body.appendChild(box);
  }
  const line=document.createElement('div');
  line.textContent=new Date().toLocaleTimeString('nl-NL')+' — '+msg;
  box.appendChild(line);
  box.scrollTop=box.scrollHeight;
}

function reisblik70LoadVisited(){
  reisblik70Diag('LOAD: functie bereikt');
  try{
    const raw=localStorage.getItem(REISBLIK70_VISITED_KEY);
    reisblik70Diag('LOAD: localStorage='+(raw?'DATA':'GEEN DATA'));
    const data=JSON.parse(raw||'{}');
    return data&&typeof data==='object'?data:{};
  }catch(e){
    reisblik70Diag('LOAD FOUT: '+e.message);
    return {};
  }
}

function reisblik70SaveVisited(data){
  reisblik70Diag('SAVE: functie bereikt');
  try{
    const raw=JSON.stringify(data);
    localStorage.setItem(REISBLIK70_VISITED_KEY,raw);
    const check=localStorage.getItem(REISBLIK70_VISITED_KEY);
    const ok=(check===raw);
    reisblik70Diag('SAVE: '+(ok?'GESLAAGD':'MISLUKT')+
                   ' ('+raw.length+' tekens)');
    return ok;
  }catch(e){
    reisblik70Diag('SAVE FOUT: '+e.message);
    return false;
  }
}

function reisblik70DateTime(iso){
  reisblik70Diag('DATUM: formatter bereikt');
  const d=new Date(iso);
  if(Number.isNaN(d.getTime())){
    reisblik70Diag('DATUM FOUT: ongeldige tijd');
    return '';
  }
  return new Intl.DateTimeFormat('nl-NL',{
    day:'2-digit',month:'2-digit',year:'numeric',
    hour:'2-digit',minute:'2-digit',hour12:false
  }).format(d);
}

function reisblik70ToggleVisited(id,name,category,checkbox){
  reisblik70Diag('TOGGLE: bereikt');
  reisblik70Diag('TOGGLE: id='+String(id)+' checked='+checkbox.checked);

  const data=reisblik70LoadVisited();
  const key=String(id);

  if(checkbox.checked){
    const visitedAt=new Date().toISOString();
    data[key]={
      id:key,
      name:String(name||''),
      category:String(category||''),
      visitedAt:visitedAt
    };
    reisblik70Diag('TOGGLE: record gemaakt, visitedAt='+visitedAt);

    if(!reisblik70SaveVisited(data)){
      reisblik70Diag('TOGGLE: opslag mislukt');
      checkbox.checked=false;
      return;
    }

    const container=checkbox.closest('.reisblik-visited');
    reisblik70Diag('DOM: container='+(container?'GEVONDEN':'NIET GEVONDEN'));
    if(container){
      const dateEl=container.querySelector('.reisblik-visited-date');
      reisblik70Diag('DOM: datumveld='+(dateEl?'GEVONDEN':'NIET GEVONDEN'));
      if(dateEl){
        dateEl.textContent='— '+reisblik70DateTime(visitedAt);
        reisblik70Diag('DOM: DATUM/TIJD INGEVULD');
      }
    }
  }else{
    delete data[key];
    reisblik70SaveVisited(data);
    const container=checkbox.closest('.reisblik-visited');
    if(container){
      const dateEl=container.querySelector('.reisblik-visited-date');
      if(dateEl)dateEl.textContent='';
    }
    reisblik70Diag('TOGGLE: record verwijderd');
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
  reisblik70Diag('HANDLE: bereikt');
  reisblik70Diag('HANDLE: id='+String(id)+' checked='+cb.checked);
  reisblik70Diag('HANDLE: naam='+String(name||''));
  reisblik70ToggleVisited(id,name,category,cb);
}
