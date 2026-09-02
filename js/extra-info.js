/* Reisblik 8.4 – Extra informatie bewerken */
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
let simpleExtraEditingIndex=null;

function simpleExtraData(){
 try{
  const raw=localStorage.getItem('ruinekerk_extra_simple_v1');
  if(!raw)return {};
  const data=JSON.parse(raw);
  if(!data || typeof data!=='object')return {};

  // 8.4.1: migrate the old one-item-per-location format to an array.
  let changed=false;
  Object.keys(data).forEach(id=>{
   if(data[id] && !Array.isArray(data[id]) && typeof data[id]==='object'){
    data[id]=[{date:data[id].date||'',text:data[id].text||''}];
    changed=true;
   }
  });
  if(changed)localStorage.setItem('ruinekerk_extra_simple_v1',JSON.stringify(data));
  return data;
 }catch(e){return {}}
}
function openSimpleExtra(id){
 simpleExtraId=id;
 simpleExtraEditingIndex=null;
 const x=locations.find(a=>a.id===id);
 document.getElementById('simpleExtraTitle').textContent='➕ Extra informatie – '+(x?x.name:'Locatie');
 document.getElementById('simpleExtraDate').value=new Date().toISOString().slice(0,10);
 document.getElementById('simpleExtraText').value='';
 document.getElementById('simpleExtraSaveBtn').textContent='Opslaan';
 document.getElementById('simpleExtraModal').style.display='block';
}
function editSimpleExtra(id,index){
 simpleExtraId=id;
 simpleExtraEditingIndex=Number(index);
 const data=simpleExtraData();
 const items=Array.isArray(data[id])?data[id]:[];
 const item=items[simpleExtraEditingIndex];
 if(!item)return;
 const x=locations.find(a=>a.id===id);
 document.getElementById('simpleExtraTitle').textContent='✏️ Extra informatie bewerken – '+(x?x.name:'Locatie');
 document.getElementById('simpleExtraDate').value=item.date||'';
 document.getElementById('simpleExtraText').value=item.text||'';
 document.getElementById('simpleExtraSaveBtn').textContent='💾 Wijzigingen opslaan';
 document.getElementById('simpleExtraModal').style.display='block';
}
function closeSimpleExtra(){
 stopSimpleExtraMicrophone();
 document.getElementById('simpleExtraModal').style.display='none';
 simpleExtraEditingIndex=null;
}
function saveSimpleExtra(){
 const value=document.getElementById('simpleExtraText').value.trim();
 if(!value){alert('Vul eerst de extra informatie in.');return}
 const all=simpleExtraData();
 all[simpleExtraId]=Array.isArray(all[simpleExtraId])?all[simpleExtraId]:[];
 const item={date:document.getElementById('simpleExtraDate').value,text:value};
 if(simpleExtraEditingIndex===null){
  all[simpleExtraId].push(item);
 }else{
  if(!all[simpleExtraId][simpleExtraEditingIndex]){alert('Deze extra informatie bestaat niet meer.');return}
  all[simpleExtraId][simpleExtraEditingIndex]=item;
 }
 localStorage.setItem('ruinekerk_extra_simple_v1',JSON.stringify(all));
 closeSimpleExtra();
 renderSimpleExtra(simpleExtraId);
}
function renderSimpleExtra(id){
 const el=document.getElementById('simple-extra-'+id);if(!el)return;
 const data=simpleExtraData();
 const items=Array.isArray(data[id])?data[id]:[];
 el.innerHTML=items.map((item,index)=>
  `<div class="extra-item"><div class="extra-date"><b>${esc(item.date||'')}</b></div><div style="margin-top:3px">${esc(item.text||'')}</div><button type="button" style="margin-top:8px" onclick="editSimpleExtra('${esc(id)}',${index})">✏️ Bewerken</button></div>`
 ).join('');
}
function renderAllSimpleExtra(){locations.forEach(x=>renderSimpleExtra(x.id));}

// Reisblik 8.4.2 — Spraakfunctie stap 3 en 4
// Stap 3: microfoon activeren en toestemming vragen.
// Stap 4: expliciete STOP-knop om de microfoon weer uit te schakelen.
let simpleExtraMicStream = null;

async function startSimpleExtraMicrophone(){
 const startBtn=document.getElementById('simpleExtraSpeechBtn');
 const stopBtn=document.getElementById('simpleExtraSpeechStopBtn');
 const status=document.getElementById('simpleExtraSpeechStatus');
 if(!startBtn || !stopBtn || !status)return;

 if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
  status.textContent='De browser ondersteunt het activeren van de microfoon niet.';
  return;
 }

 try{
  if(simpleExtraMicStream) return;
  simpleExtraMicStream=await navigator.mediaDevices.getUserMedia({audio:true});
  startBtn.style.display='none';
  stopBtn.style.display='inline-block';
  status.textContent='🎤 Microfoon is actief. Druk op ⏹ Stop microfoon wanneer je klaar bent.';
 }catch(err){
  simpleExtraMicStream=null;
  if(err && (err.name==='NotAllowedError' || err.name==='PermissionDeniedError')){
   status.textContent='Microfoontoestemming is geweigerd. Geef Reisblik toestemming voor de microfoon en probeer opnieuw.';
  }else{
   status.textContent='De microfoon kon niet worden geactiveerd.';
  }
 }
}

function stopSimpleExtraMicrophone(){
 const startBtn=document.getElementById('simpleExtraSpeechBtn');
 const stopBtn=document.getElementById('simpleExtraSpeechStopBtn');
 const status=document.getElementById('simpleExtraSpeechStatus');
 if(simpleExtraMicStream){
  simpleExtraMicStream.getTracks().forEach(track=>track.stop());
  simpleExtraMicStream=null;
 }
 if(startBtn)startBtn.style.display='inline-block';
 if(stopBtn)stopBtn.style.display='none';
 if(status)status.textContent='Microfoon gestopt.';
}

function initSimpleExtraSpeechControls(){
 const startBtn=document.getElementById('simpleExtraSpeechBtn');
 const stopBtn=document.getElementById('simpleExtraSpeechStopBtn');
 if(!startBtn || !stopBtn)return;
 startBtn.addEventListener('click',startSimpleExtraMicrophone);
 stopBtn.addEventListener('click',stopSimpleExtraMicrophone);
}

if(document.readyState==='loading'){
 document.addEventListener('DOMContentLoaded',initSimpleExtraSpeechControls,{once:true});
}else{
 initSimpleExtraSpeechControls();
}

