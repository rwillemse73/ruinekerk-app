/* Reisblik 9.9.22 — Reisquiz v1
   Bron: uitsluitend de geladen locaties.json-bestanden. */
(function(){
  'use strict';

  const CONFIG = {
    questionCount: 10,
    answersPerQuestion: 4,
    maxQuestionsPerLocation: 2
  };

  const FIELD_LABELS = {
    geschiedenis:'geschiedenis', historie:'geschiedenis', historisch:'geschiedenis',
    bijzonderheid:'bijzonderheid', bijzonderheden:'bijzonderheid', wetenswaardigheid:'wetenswaardigheid',
    beschrijving:'beschrijving', omschrijving:'beschrijving', verhaal:'verhaal',
    architect:'architect', architectuur:'architectuur', persoon:'persoon', personen:'personen',
    functie:'functie', ontstaan:'ontstaan', bouwjaar:'bouwjaar', opgericht:'oprichtingsjaar',
    gebouwd:'bouwjaar', type:'type', betekenis:'betekenis'
  };

  let locations = [];
  let questions = [];
  let current = 0;
  let score = 0;
  let answered = false;

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }
  function clean(value){
    return String(value ?? '').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  }
  function isUseful(value){
    const s=clean(value);
    return s.length>=8 && s.length<=260 && !/^https?:\/\//i.test(s);
  }
  function roots(){
    const ctx=window.reisblikVakantie;
    if(!ctx)return [];
    const base=ctx.getActieveVakantieBasePath ? String(ctx.getActieveVakantieBasePath()||'').replace(/^\/+|\/+$/g,'') : '';
    const parts=ctx.getActieveVakantieOnderdelen ? (ctx.getActieveVakantieOnderdelen()||[]) : [];
    const selected=ctx.getGeselecteerdeOnderdeelIds ? (ctx.getGeselecteerdeOnderdeelIds()||[]) : [];
    if(!parts.length) return [base].filter(Boolean);
    const wanted=new Set(selected.map(String));
    return parts.filter(p=>wanted.has(String(p.id))).map(p=>{
      const pp=String(p.path||p.id||'').replace(/^\/+|\/+$/g,'');
      return [base,pp].filter(Boolean).join('/');
    });
  }
  function activeName(){
    const v=window.reisblikVakantie?.getActieveVakantie?.();
    return v?.naam || document.getElementById('vakantieSelect')?.selectedOptions?.[0]?.textContent || 'actieve vakantie';
  }
  async function loadLocations(){
    const rs=roots();
    if(!rs.length) return [];
    const all=[];
    for(const root of rs){
      const url=root+'/locaties/locaties.json';
      try{
        const r=await fetch(url+'?quiz='+Date.now(),{cache:'no-store'});
        if(!r.ok) continue;
        const data=await r.json();
        const arr=Array.isArray(data)?data:(Array.isArray(data.locaties)?data.locaties:(Array.isArray(data.locations)?data.locations:[]));
        arr.forEach((x,i)=>all.push({...x,__quizRoot:root,__quizIndex:i}));
      }catch(e){ console.warn('[Reisblik Quiz] locaties.json niet geladen:',url,e); }
    }
    return all;
  }
  function scalarFacts(loc){
    const facts=[];
    Object.entries(loc||{}).forEach(([key,value])=>{
      if(key.startsWith('__') || ['lat','lon','latitude','longitude','gps','foto','afbeelding','images','id','naam','name'].includes(key.toLowerCase())) return;
      if(typeof value==='string' || typeof value==='number'){
        const text=clean(value);
        if(!isUseful(text)) return;
        const lower=key.toLowerCase();
        const label=FIELD_LABELS[lower] || key.replace(/[_-]+/g,' ');
        facts.push({key,label,text,location:loc});
      }
    });
    return facts;
  }
  function locationName(loc){ return clean(loc.naam||loc.name||loc.titel||loc.title||'Deze locatie') || 'Deze locatie'; }
  function makeQuestions(locs){
    const facts=locs.flatMap(scalarFacts);
    const usable=facts.filter(f=>f.text.length<=180);
    const result=[];
    const perLoc=new Map();
    const used=new Set();
    const candidates=usable.slice().sort(()=>Math.random()-0.5);

    for(const f of candidates){
      if(result.length>=CONFIG.questionCount) break;
      const locKey=String(f.location.id||f.location.__quizIndex||locationName(f.location));
      const count=perLoc.get(locKey)||0;
      if(count>=CONFIG.maxQuestionsPerLocation) continue;
      const distractors=usable.filter(x=>x!==f && x.label===f.label && x.text!==f.text)
        .map(x=>x.text).filter((v,i,a)=>a.indexOf(v)===i);
      let pool=distractors;
      if(pool.length<CONFIG.answersPerQuestion-1){
        pool=usable.filter(x=>x!==f && x.location!==f.location && x.text!==f.text).map(x=>x.text).filter((v,i,a)=>a.indexOf(v)===i);
      }
      if(pool.length<CONFIG.answersPerQuestion-1) continue;
      const answers=[f.text,...pool.sort(()=>Math.random()-0.5).slice(0,CONFIG.answersPerQuestion-1)].sort(()=>Math.random()-0.5);
      const correct=answers.indexOf(f.text);
      const signature=locationName(f.location)+'|'+f.label+'|'+f.text;
      if(used.has(signature)) continue;
      used.add(signature);
      let question;
      const year=f.text.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
      if(year && /jaar|bouw|opgericht|ontstaan|geopend|gesticht/i.test(f.label)){
        question=`In welk jaar gaat de informatie over ${locationName(f.location)} in op ${f.label}?`;
      }else{
        question=`Wat vermeldt de locatie-informatie over ${f.label} van ${locationName(f.location)}?`;
      }
      result.push({question,answers,correct,explanation:f.text,location:locationName(f.location)});
      perLoc.set(locKey,count+1);
    }
    return result;
  }
  function render(){
    const q=questions[current];
    const box=document.getElementById('quizContent');
    if(!box)return;
    if(!q){ renderResult(); return; }
    answered=false;
    box.innerHTML=`
      <div class="quiz-progress">Vraag ${current+1} van ${questions.length}</div>
      <h3 class="quiz-question">${esc(q.question)}</h3>
      <div class="quiz-location">📍 ${esc(q.location)}</div>
      <div class="quiz-answers">${q.answers.map((a,i)=>`<button type="button" class="quiz-answer" data-answer="${i}">${esc(a)}</button>`).join('')}</div>
      <div id="quizFeedback" class="quiz-feedback" aria-live="polite"></div>
      <button id="quizNextBtn" type="button" class="quiz-next" style="display:none">Volgende vraag →</button>`;
    box.querySelectorAll('.quiz-answer').forEach(btn=>btn.addEventListener('click',()=>answer(Number(btn.dataset.answer))));
  }
  function answer(index){
    if(answered)return;
    answered=true;
    const q=questions[current];
    const buttons=[...document.querySelectorAll('.quiz-answer')];
    buttons.forEach((b,i)=>{b.disabled=true;if(i===q.correct)b.classList.add('quiz-correct');if(i===index && i!==q.correct)b.classList.add('quiz-wrong');});
    if(index===q.correct)score++;
    const feedback=document.getElementById('quizFeedback');
    feedback.innerHTML=index===q.correct
      ? `<strong>✅ Goed!</strong><p>${esc(q.explanation)}</p>`
      : `<strong>❌ Helaas.</strong><p>Het juiste antwoord is: <strong>${esc(q.answers[q.correct])}</strong></p><p>${esc(q.explanation)}</p>`;
    const next=document.getElementById('quizNextBtn');
    if(next){next.style.display='inline-block';next.textContent=current+1<questions.length?'Volgende vraag →':'Bekijk resultaat →';next.onclick=()=>{current++;render();};}
  }
  function renderResult(){
    const pct=questions.length?Math.round(score/questions.length*100):0;
    const v=activeName();
    try{localStorage.setItem('reisblik_quiz_laatste_v1__'+v,JSON.stringify({datum:new Date().toISOString(),score,totaal:questions.length,pct}));}catch(e){}
    document.getElementById('quizContent').innerHTML=`
      <div class="quiz-result"><div class="quiz-result-icon">🎉</div><h3>Quiz klaar!</h3><div class="quiz-score">${score} / ${questions.length}</div><div class="quiz-percent">${pct}% goed</div>
      <p>Je hebt de locatiekennis van <strong>${esc(v)}</strong> getest.</p>
      <div class="quiz-actions"><button id="quizAgainBtn" type="button">🔄 Nieuwe quiz</button><button id="quizCloseResultBtn" type="button" class="quiz-secondary">Sluiten</button></div></div>`;
    document.getElementById('quizAgainBtn')?.addEventListener('click',startQuiz);
    document.getElementById('quizCloseResultBtn')?.addEventListener('click',closeQuiz);
  }
  async function startQuiz(){
    const box=document.getElementById('quizContent');
    if(!box)return;
    box.innerHTML='<div class="quiz-loading">🧠 De locaties worden gelezen en de quiz wordt samengesteld…</div>';
    score=0;current=0;questions=[];
    locations=await loadLocations();
    questions=makeQuestions(locations);
    if(!questions.length){
      box.innerHTML='<div class="quiz-empty"><h3>Geen quiz beschikbaar</h3><p>Voor de actieve vakantie/deelreis zijn nog niet genoeg geschikte feiten in <code>locaties.json</code> gevonden om een multiple-choicequiz te maken.</p><p>De Reisquiz gebruikt bewust <strong>alleen</strong> de locatiegegevens.</p><button id="quizEmptyClose" type="button">Sluiten</button></div>';
      document.getElementById('quizEmptyClose')?.addEventListener('click',closeQuiz);
      return;
    }
    render();
  }
  function openQuiz(){
    const o=document.getElementById('quizOverlay');if(!o)return;
    o.style.display='flex';
    document.getElementById('quizTitleContext').textContent=activeName();
    startQuiz();
  }
  function closeQuiz(){const o=document.getElementById('quizOverlay');if(o)o.style.display='none';}
  function init(){
    document.getElementById('quizOpenBtn')?.addEventListener('click',openQuiz);
    document.getElementById('quizCloseBtn')?.addEventListener('click',closeQuiz);
  }
  window.reisblikQuiz={open:openQuiz,start:startQuiz};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
