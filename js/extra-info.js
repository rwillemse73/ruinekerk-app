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

// Reisblik 8.5 — Spraakfunctie stap 3, 4, 5, 6 en 8
// Stap 3: microfoon activeren en toestemming vragen.
// Stap 4: expliciete STOP-knop.
// Stap 5: spraak -> tekst.
// Stap 6: opnieuw inspreken voegt tekst toe.
// Stap 8: tekst wordt via de bestaande Opslaan-functie lokaal opgeslagen.
let simpleExtraMicStream = null;
let simpleExtraRecognition = null;
let simpleExtraSpeechBaseText = '';
let simpleExtraSpeechRunning = false;

function getSpeechRecognitionConstructor(){
 return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function setSimpleExtraSpeechStatus(text){
 const status=document.getElementById('simpleExtraSpeechStatus');
 if(status)status.textContent=text;
}

function stopSimpleExtraMicStream(){
 if(simpleExtraMicStream){
  simpleExtraMicStream.getTracks().forEach(track=>track.stop());
  simpleExtraMicStream=null;
 }
}

function appendRecognizedText(text){
 const textarea=document.getElementById('simpleExtraText');
 if(!textarea)return;
 const spoken=(text||'').trim();
 if(!spoken)return;
 const current=textarea.value.trimEnd();
 textarea.value=current ? current+' '+spoken : spoken;
 textarea.dispatchEvent(new Event('input',{bubbles:true}));
 textarea.focus();
}

function createSimpleExtraRecognition(){
 const Recognition=getSpeechRecognitionConstructor();
 if(!Recognition)return null;
 const recognition=new Recognition();
 recognition.lang='nl-NL';
 recognition.continuous=true;
 recognition.interimResults=true;
 recognition.maxAlternatives=1;

 recognition.onstart=()=>{
  simpleExtraSpeechRunning=true;
  const startBtn=document.getElementById('simpleExtraSpeechBtn');
  const stopBtn=document.getElementById('simpleExtraSpeechStopBtn');
  if(startBtn)startBtn.style.display='none';
  if(stopBtn)stopBtn.style.display='inline-block';
  setSimpleExtraSpeechStatus('🎤 Luisteren… Spreek rustig. Druk op ⏹ Stop microfoon als je klaar bent.');
 };

 recognition.onresult=(event)=>{
  let finalText='';
  for(let i=event.resultIndex;i<event.results.length;i++){
   const result=event.results[i];
   if(result.isFinal)finalText += result[0].transcript+' ';
  }
  if(finalText)appendRecognizedText(finalText);
 };

 recognition.onerror=(event)=>{
  simpleExtraSpeechRunning=false;
  if(event.error==='not-allowed' || event.error==='service-not-allowed'){
   setSimpleExtraSpeechStatus('Microfoontoestemming is geweigerd. Geef Reisblik toestemming voor de microfoon en probeer opnieuw.');
  }else if(event.error==='no-speech'){
   setSimpleExtraSpeechStatus('Geen spraak gehoord. Druk opnieuw op 🎤 Microfoon starten.');
  }else{
   setSimpleExtraSpeechStatus('Spraakherkenning kon niet worden gestart ('+event.error+').');
  }
  stopSimpleExtraMicStream();
  const startBtn=document.getElementById('simpleExtraSpeechBtn');
  const stopBtn=document.getElementById('simpleExtraSpeechStopBtn');
  if(startBtn)startBtn.style.display='inline-block';
  if(stopBtn)stopBtn.style.display='none';
 };

 recognition.onend=()=>{
  simpleExtraSpeechRunning=false;
  stopSimpleExtraMicStream();
  const startBtn=document.getElementById('simpleExtraSpeechBtn');
  const stopBtn=document.getElementById('simpleExtraSpeechStopBtn');
  if(startBtn)startBtn.style.display='inline-block';
  if(stopBtn)stopBtn.style.display='none';
  if(!document.getElementById('simpleExtraModal') || document.getElementById('simpleExtraModal').style.display!=='none'){
   setSimpleExtraSpeechStatus('Spraak gestopt. Je kunt opnieuw inspreken of de tekst bewerken en opslaan.');
  }
 };
 return recognition;
}

async function startSimpleExtraMicrophone(){
 const startBtn=document.getElementById('simpleExtraSpeechBtn');
 const stopBtn=document.getElementById('simpleExtraSpeechStopBtn');
 const status=document.getElementById('simpleExtraSpeechStatus');
 const textarea=document.getElementById('simpleExtraText');
 if(!startBtn || !stopBtn || !status || !textarea)return;

 const Recognition=getSpeechRecognitionConstructor();
 if(!Recognition){
  status.textContent='Spraakherkenning wordt niet ondersteund door deze browser. Je kunt de tekst hieronder gewoon typen.';
  return;
 }
 if(simpleExtraSpeechRunning)return;

 try{
  // Eerst expliciet microfoontoestemming vragen. Daarna sluiten we deze tijdelijke
  // audiostream weer, zodat SpeechRecognition de microfoon kan gebruiken.
  if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
   simpleExtraMicStream=await navigator.mediaDevices.getUserMedia({audio:true});
   stopSimpleExtraMicStream();
  }

  simpleExtraSpeechBaseText=textarea.value;
  simpleExtraRecognition=createSimpleExtraRecognition();
  if(!simpleExtraRecognition)return;
  simpleExtraRecognition.start();
 }catch(err){
  stopSimpleExtraMicStream();
  simpleExtraRecognition=null;
  if(err && (err.name==='NotAllowedError' || err.name==='PermissionDeniedError')){
   status.textContent='Microfoontoestemming is geweigerd. Geef Reisblik toestemming voor de microfoon en probeer opnieuw.';
  }else if(err && err.name==='InvalidStateError'){
   status.textContent='De spraakherkenning is al actief.';
  }else{
   status.textContent='De microfoon of spraakherkenning kon niet worden geactiveerd.';
  }
 }
}

function stopSimpleExtraMicrophone(){
 const recognition=simpleExtraRecognition;
 simpleExtraRecognition=null;
 simpleExtraSpeechRunning=false;
 if(recognition){
  try{recognition.stop();}catch(e){}
 }
 stopSimpleExtraMicStream();
 const startBtn=document.getElementById('simpleExtraSpeechBtn');
 const stopBtn=document.getElementById('simpleExtraSpeechStopBtn');
 if(startBtn)startBtn.style.display='inline-block';
 if(stopBtn)stopBtn.style.display='none';
 if(document.getElementById('simpleExtraSpeechStatus')){
  setSimpleExtraSpeechStatus('Spraak gestopt. Je kunt de tekst nog bewerken en daarna lokaal opslaan.');
 }
}

function initSimpleExtraSpeechControls(){
 const startBtn=document.getElementById('simpleExtraSpeechBtn');
 const stopBtn=document.getElementById('simpleExtraSpeechStopBtn');
 if(!startBtn || !stopBtn)return;
 startBtn.removeEventListener('click',startSimpleExtraMicrophone);
 stopBtn.removeEventListener('click',stopSimpleExtraMicrophone);
 startBtn.addEventListener('click',startSimpleExtraMicrophone);
 stopBtn.addEventListener('click',stopSimpleExtraMicrophone);
}

if(document.readyState==='loading'){
 document.addEventListener('DOMContentLoaded',initSimpleExtraSpeechControls,{once:true});
}else{
 initSimpleExtraSpeechControls();
}
