/* Reisblik 7.0 – Extra informatie */
let extraLocationId=null;
function getExtraInfo(){
 try{return JSON.parse(localStorage.getItem('ruinekerk_extra_info_v1')||'{}')}catch(e){return {}}
}
function openExtraInfo(id){
 extraLocationId=id;
 const x=locations.find(a=>a.id===id);
 document.getElementById('extraTitle').textContent='➕ Extra informatie – '+(x?x.name:'Locatie');
 document.getElementById('extraDate').value=new Date().toISOString().slice(0,10);
 document.getElementById('extraText').value='';
 renderExtraExisting();
 document.getElementById('extraModal').style.display='block';
}
function closeExtraInfo(){document.getElementById('extraModal').style.display='none'}
function saveExtraInfo(){
 const value=document.getElementById('extraText').value.trim();
 if(!value){alert('Vul eerst de extra informatie in.');return}
 const all=getExtraInfo();
 all[extraLocationId]=all[extraLocationId]||[];
 all[extraLocationId].push({
  date:document.getElementById('extraDate').value,
  text:value
 });
 localStorage.setItem('ruinekerk_extra_info_v1',JSON.stringify(all));
 document.getElementById('extraText').value='';
 renderExtraExisting();
 renderExtraOnCard(extraLocationId);
}
function renderExtraExisting(){
 const items=getExtraInfo()[extraLocationId]||[];
 document.getElementById('extraExisting').innerHTML=items.length?
  '<h3>Extra informatie</h3>'+items.map(n=>'<div class="extra-item"><div class="extra-date">'+esc(n.date)+'</div>'+esc(n.text)+'</div>').join(''):
  '<p class="meta">Nog geen extra informatie toegevoegd.</p>';
}
function renderExtraOnCard(id){
 const el=document.getElementById('extra-'+id);if(!el)return;
 const items=getExtraInfo()[id]||[];
 el.innerHTML=items.map(n=>'<div class="extra-item"><div class="extra-date">'+esc(n.date)+'</div>'+esc(n.text)+'</div>').join('');
}
function renderAllExtraInfo(){locations.forEach(x=>renderExtraOnCard(x.id));}

let noteLocationId=null;
function getNotes(){try{return JSON.parse(localStorage.getItem('ruinekerk_notes_v1')||'{}')}catch(e){return {}}}
function openNote(id){
 noteLocationId=id;const x=locations.find(a=>a.id===id);
 document.getElementById('noteTitle').textContent='📝 '+(x?x.name:'Locatie');
 document.getElementById('noteType').value='opmerking';
 document.getElementById('noteDate').value=new Date().toISOString().slice(0,10);
 document.getElementById('noteText').value='';
 renderExistingNotes();document.getElementById('noteModal').style.display='block';
}
function closeNote(){document.getElementById('noteModal').style.display='none'}
function saveNote(){
 const value=document.getElementById('noteText').value.trim();if(!value){alert('Vul eerst een tekst in.');return}
 const all=getNotes();all[noteLocationId]=all[noteLocationId]||[];
 all[noteLocationId].push({type:document.getElementById('noteType').value,date:document.getElementById('noteDate').value,text:value});
 localStorage.setItem('ruinekerk_notes_v1',JSON.stringify(all));
 document.getElementById('noteText').value='';renderExistingNotes();renderNotesOnCard(noteLocationId);
}
function renderExistingNotes(){
 const notes=getNotes()[noteLocationId]||[];
 document.getElementById('noteExisting').innerHTML=notes.length?'<h3>Mijn notities</h3>'+notes.map(n=>'<div class="note"><div class="notehead">'+esc(n.type)+' · '+esc(n.date)+'</div>'+esc(n.text)+'</div>').join(''):'<p class="meta">Nog geen notities.</p>';
}
function renderNotesOnCard(id){
 const el=document.getElementById('notes-'+id);if(!el)return;
 const notes=getNotes()[id]||[];
 el.innerHTML=notes.map(n=>'<div class="note"><div class="notehead">'+esc(n.type)+' · '+esc(n.date)+'</div>'+esc(n.text)+'</div>').join('');
}
function renderAllNotes(){locations.forEach(x=>renderNotesOnCard(x.id));}

let simpleExtraId=null;
function simpleExtraData(){
 try{return JSON.parse(localStorage.getItem('ruinekerk_extra_simple_v1')||'{}')}catch(e){return {}}
}
function openSimpleExtra(id){
 simpleExtraId=id;
 const x=locations.find(a=>a.id===id);
 document.getElementById('simpleExtraTitle').textContent='➕ Extra informatie – '+(x?x.name:'Locatie');
 document.getElementById('simpleExtraDate').value=new Date().toISOString().slice(0,10);
 document.getElementById('simpleExtraText').value='';
 document.getElementById('simpleExtraModal').style.display='block';
}
function closeSimpleExtra(){document.getElementById('simpleExtraModal').style.display='none'}
function saveSimpleExtra(){
 const value=document.getElementById('simpleExtraText').value.trim();
 if(!value){alert('Vul eerst de extra informatie in.');return}
 const all=simpleExtraData();
 all[simpleExtraId]={
  date:document.getElementById('simpleExtraDate').value,
  text:value
 };
 localStorage.setItem('ruinekerk_extra_simple_v1',JSON.stringify(all));
 closeSimpleExtra();
 renderSimpleExtra(simpleExtraId);
}
function renderSimpleExtra(id){
 const el=document.getElementById('simple-extra-'+id);if(!el)return;
 const item=simpleExtraData()[id];
 el.innerHTML=item?
  '<div class="meta" style="margin-top:6px"><b>'+esc(item.date)+'</b></div><div style="margin-top:3px">'+esc(item.text)+'</div>':'';
}
function renderAllSimpleExtra(){locations.forEach(x=>renderSimpleExtra(x.id));}
