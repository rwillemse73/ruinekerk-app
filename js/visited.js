/* Reisblik 7.0.4 DIAG – Bezocht */
const REISBLIK70_VISITED_KEY='reisblik_visited_v7';

function reisblik70Diag(msg){
  let box=document.getElementById('reisblikVisitedDiag');
  if(!box){
    box=document.createElement('div');
    box.id='reisblikVisitedDiag';
    box.style.cssText='position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483646;background:#fff;border:2px solid #555;border-radius:8px;padding:10px;font:12px Arial;box-shadow:0 2px 8px rgba(0,0,0,.25)';
    document.body.appendChild(box);
  }
  const line=document.createElement('div');
  line.textContent=new Date().toLocaleTimeString('nl-NL')+' — '+msg;
  box.appendChild(line);
}

function reisblik70LoadVisited(){
  reisblik70Diag('1. loadVisited() aangeroepen');
  try{
    const raw=localStorage.getItem(REISBLIK70_VISITED_KEY);
    reisblik70Diag('2. localStorage lezen: '+(raw?'DATA GEVONDEN':'GEEN DATA'));
    const data=JSON.parse(raw||'{}');
    return data&&typeof data==='object'?data:{};
  }catch(e){
    reisblik70Diag('FOUT bij localStorage lezen: '+e.message);
    return {};
  }
}

function reisblik70SaveVisited(data){
  try{
    const raw=JSON.stringify(data);
    localStorage.setItem(REISBLIK70_VISITED_KEY,raw);
    const check=localStorage.getItem(REISBLIK70_VISITED_KEY);
    reisblik70Diag('4. localStorage opslaan: '+(check===raw?'GESLAAGD':'MISMATCH'));
    return check===raw;
  }catch(e){
    reisblik70Diag('FOUT bij localStorage opslaan: '+e.message);
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
  reisblik70Diag('3. TOGGLE aangeroepen — ID='+id);
  const data=reisblik70LoadVisited();
  const key=String(id);

  if(checkbox.checked){
    const visitedAt=new Date().toISOString();
    data[key]={id:key,name:String(name||''),category:String(category||''),visitedAt};
    reisblik70Diag('3a. record gemaakt: '+visitedAt);

    if(!reisblik70SaveVisited(data)){
      reisblik70Diag('5. OPSLAG MISLUKT');
      checkbox.checked=false;
      return;
    }

    const container=checkbox.closest('.reisblik-visited');
    reisblik70Diag('5. container gevonden: '+(!!container));
    if(container){
      const dateEl=container.querySelector('.reisblik-visited-date');
      reisblik70Diag('6. datumveld gevonden: '+(!!dateEl));
      if(dateEl){
        dateEl.textContent='— '+reisblik70DateTime(visitedAt);
        reisblik70Diag('7. DATUM/TIJD OP SCHERM GEZET');
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
    reisblik70Diag('UITGEVINKT — record verwijderd');
  }
}

function reisblik70Html(id,name,category){
  const key=String(id);
  const visit=reisblik70LoadVisited()[key];
  const checked=visit&&visit.visitedAt?' checked':'';
  const date=visit&&visit.visitedAt?'— '+reisblik70DateTime(visit.visitedAt):'';
  reisblik70Diag('Render Bezocht — ID='+key+' — opgeslagen='+(!!visit));
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
  reisblik70Diag('CHECKBOX onchange bereikt — ID='+id+' checked='+cb.checked);
  reisblik70ToggleVisited(id,name,category,cb);
}
