/* Reisblik 9.9.23 — Reisquiz v2
   Bron: de inhoud van de locatie-HTML's die in de geladen locaties.json staan.
   De locaties.json wordt alleen gebruikt om de juiste HTML-bestanden te vinden. */
(function(){
  'use strict';

  const CONFIG = {
    questionCount: 10,
    answersPerQuestion: 4,
    maxQuestionsPerLocation: 2,
    maxFactsPerLocation: 8,
    maxAnswerLength: 135,
    minFactLength: 35
  };

  // Technische velden/onderdelen die geen bron voor quizvragen mogen zijn.
  const BLOCKED_TEXT = [
    'gps','latitude','longitude','lat','lon','kaart','route','bron','bronnen',
    'copyright','privacy','cookie','menu','navigatie','zoek','afstand','versie',
    'type','categorie','id','html','bestand','url','link','adres','postcode'
  ];

  const TOPIC_WORDS = {
    geschiedenis:['geschiedenis','historie','historisch','verleden'],
    natuur:['natuur','landschap','bos','heide','park','tuin','rivier','berg','meer','gebied'],
    gebouw:['gebouw','kasteel','kerk','huis','buitenplaats','landgoed','toren','monument','ruïne','fort'],
    persoon:['persoon','personen','bewoner','bewoners','eigenaar','eigenaren','stichter','stichters'],
    cultuur:['cultuur','kunst','traditie','legende','verhaal','religie'],
    bijzonder:['bijzonder','bijzonderheid','wetenswaardigheid','kenmerk','opvallend']
  };

  let locations=[];
  let questions=[];
  let current=0;
  let score=0;
  let answered=false;

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function clean(value){
    return String(value ?? '')
      .replace(/<script[\s\S]*?<\/script>/gi,' ')
      .replace(/<style[\s\S]*?<\/style>/gi,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function normalize(value){
    return clean(value).toLowerCase().replace(/[^a-z0-9à-ÿ]+/gi,' ').trim();
  }

  function isBlockedHeading(heading){
    const h=normalize(heading);
    return BLOCKED_TEXT.some(x=>h===x || h.includes(x));
  }

  function roots(){
    const ctx=window.reisblikVakantie;
    if(!ctx)return [];
    const base=ctx.getActieveVakantieBasePath ? String(ctx.getActieveVakantieBasePath()||'').replace(/^\/+|\/+$/g,'') : '';
    const parts=ctx.getActieveVakantieOnderdelen ? (ctx.getActieveVakantieOnderdelen()||[]) : [];
    const selected=ctx.getGeselecteerdeOnderdeelIds ? (ctx.getGeselecteerdeOnderdeelIds()||[]) : [];
    if(!parts.length)return [base].filter(Boolean);
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

  function locationName(loc){
    return clean(loc.naam||loc.name||loc.titel||loc.title||'Deze locatie') || 'Deze locatie';
  }

  function htmlPath(root,loc){
    const file=clean(loc.html||loc.htmlFile||loc.bestand||loc.file||'');
    if(!file)return '';
    if(/^https?:\/\//i.test(file))return file;
    if(file.includes('/'))return [root,file].filter(Boolean).join('/');
    return [root,'locaties',file].filter(Boolean).join('/');
  }

  async function loadLocations(){
    const rs=roots();
    const all=[];
    for(const root of rs){
      const url=[root,'locaties','locaties.json'].filter(Boolean).join('/')+'?quiz='+Date.now();
      try{
        const r=await fetch(url,{cache:'no-store'});
        if(!r.ok)continue;
        const data=await r.json();
        const arr=Array.isArray(data)?data:(Array.isArray(data.locaties)?data.locaties:(Array.isArray(data.locations)?data.locations:[]));
        arr.forEach((x,i)=>all.push({...x,__quizRoot:root,__quizIndex:i}));
      }catch(e){
        console.warn('[Reisblik Quiz] locaties.json niet geladen:',url,e);
      }
    }
    return all;
  }

  function allowedText(text){
    const s=clean(text);
    if(s.length<CONFIG.minFactLength || s.length>320)return false;
    if(/^https?:\/\//i.test(s))return false;
    if(/^(gps|latitude|longitude|adres|bron|bronnen|type|categorie)\s*[:]/i.test(s))return false;
    return true;
  }

  function splitSentences(text){
    return clean(text)
      .split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Ý0-9])/u)
      .map(clean)
      .filter(allowedText);
  }

  function topicFor(heading,text){
    const h=normalize(heading+' '+text);
    for(const [topic,words] of Object.entries(TOPIC_WORDS)){
      if(words.some(w=>h.includes(w)))return topic;
    }
    return 'bijzonder';
  }

  function shorten(text){
    let s=clean(text);
    if(s.length<=CONFIG.maxAnswerLength)return s;
    const cut=s.slice(0,CONFIG.maxAnswerLength+1);
    const pos=Math.max(cut.lastIndexOf('. '),cut.lastIndexOf(', '),cut.lastIndexOf('; '),cut.lastIndexOf(' '));
    return (pos>70?cut.slice(0,pos):cut.slice(0,CONFIG.maxAnswerLength)).trim()+ '…';
  }

  function parseHtml(html,loc){
    const parser=new DOMParser();
    const doc=parser.parseFromString(html,'text/html');
    doc.querySelectorAll('script,style,noscript,nav,header,footer,form,button,input,select,textarea,[aria-hidden="true"]').forEach(el=>el.remove());

    const facts=[];
    let heading=locationName(loc);
    const root=doc.querySelector('main, article, .locatie-inhoud, .content, .container') || doc.body;

    root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote').forEach(el=>{
      const tag=el.tagName.toLowerCase();
      const txt=clean(el.textContent);
      if(!txt || isBlockedHeading(txt))return;
      if(/^h[1-6]$/.test(tag)){
        if(txt.length<=120)heading=txt;
        return;
      }
      if(!allowedText(txt))return;
      const sentences=splitSentences(txt);
      sentences.forEach(sentence=>{
        const fact=shorten(sentence);
        if(!fact || fact.length<CONFIG.minFactLength)return;
        const signature=normalize(fact);
        if(facts.some(f=>f.signature===signature))return;
        facts.push({
          text:fact,
          fullText:sentence,
          heading,
          topic:topicFor(heading,sentence),
          location:loc,
          signature
        });
      });
    });

    // Als een pagina nauwelijks paragrafen gebruikt, probeer dan de tekst van de hoofdcontainer.
    if(facts.length===0){
      const fallback=clean(root.textContent);
      splitSentences(fallback).slice(0,CONFIG.maxFactsPerLocation).forEach(sentence=>{
        facts.push({text:shorten(sentence),fullText:sentence,heading,topic:topicFor(heading,sentence),location:loc,signature:normalize(sentence)});
      });
    }

    return facts.slice(0,CONFIG.maxFactsPerLocation);
  }

  async function loadHtmlFacts(locs){
    const all=[];
    for(const loc of locs){
      const url=htmlPath(loc.__quizRoot,loc);
      if(!url)continue;
      try{
        const r=await fetch(url+'?quiz='+Date.now(),{cache:'no-store'});
        if(!r.ok)continue;
        const html=await r.text();
        const facts=parseHtml(html,loc);
        all.push(...facts);
      }catch(e){
        console.warn('[Reisblik Quiz] locatie-HTML niet geladen:',url,e);
      }
    }
    return all;
  }

  function extractYears(text){
    return [...String(text).matchAll(/\b(1[0-9]{3}|20[0-2][0-9])\b/g)].map(m=>m[1]);
  }

  function yearQuestion(f,allFacts){
    const years=extractYears(f.fullText);
    if(!years.length)return null;
    const correct=years[0];
    const otherYears=[...new Set(allFacts.flatMap(x=>extractYears(x.fullText)).filter(y=>y!==correct))];
    if(otherYears.length<3)return null;
    const answers=[correct,...otherYears.sort(()=>Math.random()-0.5).slice(0,3)].sort(()=>Math.random()-0.5);
    return {
      question:`Welk jaartal wordt genoemd bij ${f.location.naam || locationName(f.location)}?`,
      answers,
      correct:answers.indexOf(correct),
      explanation:f.fullText,
      location:locationName(f.location),
      sourceTopic:f.topic,
      signature:'year|'+f.location.id+'|'+correct
    };
  }

  function statementQuestion(f,allFacts){
    const pool=allFacts
      .filter(x=>x!==f && x.location!==f.location && x.text!==f.text)
      .filter(x=>x.text.length<=CONFIG.maxAnswerLength)
      .sort(()=>Math.random()-0.5);
    if(pool.length<3)return null;
    const correct=shorten(f.fullText);
    const answers=[correct,...pool.slice(0,3).map(x=>shorten(x.fullText))];
    if(new Set(answers.map(normalize)).size<4)return null;
    answers.sort(()=>Math.random()-0.5);
    return {
      question:statementWording(f),
      answers,
      correct:answers.indexOf(correct),
      explanation:f.fullText,
      location:locationName(f.location),
      sourceTopic:f.topic,
      signature:'statement|'+f.signature
    };
  }

  function statementWording(f){
    const name=locationName(f.location);
    switch(f.topic){
      case 'geschiedenis': return `Welke uitspraak over de geschiedenis van ${name} komt overeen met de locatiepagina?`;
      case 'natuur': return `Welke bijzonderheid over de omgeving van ${name} wordt op de locatiepagina genoemd?`;
      case 'gebouw': return `Wat wordt op de locatiepagina over ${name} vermeld?`;
      case 'persoon': return `Welke informatie over personen bij ${name} staat op de locatiepagina?`;
      case 'cultuur': return `Welke culturele of historische bijzonderheid van ${name} wordt genoemd?`;
      default: return `Welke bewering over ${name} staat in de locatie-informatie?`;
    }
  }

  function makeQuestions(facts){
    const candidates=facts.slice().sort(()=>Math.random()-0.5);
    const result=[];
    const perLoc=new Map();
    const used=new Set();

    // Eerst echte jaartallen proberen; daarna inhoudelijke beweringen.
    for(const f of candidates){
      if(result.length>=CONFIG.questionCount)break;
      const key=String(f.location.id||f.location.__quizIndex||locationName(f.location));
      const count=perLoc.get(key)||0;
      if(count>=CONFIG.maxQuestionsPerLocation)continue;

      let q=yearQuestion(f,facts);
      if(!q)q=statementQuestion(f,facts);
      if(!q || used.has(q.signature))continue;

      used.add(q.signature);
      result.push(q);
      perLoc.set(key,count+1);
    }
    return result;
  }

  function render(){
    const q=questions[current];
    const box=document.getElementById('quizContent');
    if(!box)return;
    if(!q){renderResult();return;}
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
    buttons.forEach((b,i)=>{
      b.disabled=true;
      if(i===q.correct)b.classList.add('quiz-correct');
      if(i===index && i!==q.correct)b.classList.add('quiz-wrong');
    });
    if(index===q.correct)score++;
    const feedback=document.getElementById('quizFeedback');
    feedback.innerHTML=index===q.correct
      ? `<strong>✅ Goed!</strong><p>${esc(q.explanation)}</p>`
      : `<strong>❌ Helaas.</strong><p>Het juiste antwoord is: <strong>${esc(q.answers[q.correct])}</strong></p><p>${esc(q.explanation)}</p>`;
    const next=document.getElementById('quizNextBtn');
    if(next){
      next.style.display='inline-block';
      next.textContent=current+1<questions.length?'Volgende vraag →':'Bekijk resultaat →';
      next.onclick=()=>{current++;render();};
    }
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
    box.innerHTML='<div class="quiz-loading">🧠 De locatiepagina’s worden gelezen en de quiz wordt samengesteld…</div>';
    score=0;current=0;questions=[];
    locations=await loadLocations();
    const facts=await loadHtmlFacts(locations);
    questions=makeQuestions(facts);
    if(!questions.length){
      box.innerHTML='<div class="quiz-empty"><h3>Geen quiz beschikbaar</h3><p>Voor de actieve vakantie/deelreis zijn nog niet genoeg inhoudelijke locatiepagina’s beschikbaar om een multiple-choicequiz te maken.</p><p>De Reisquiz gebruikt alleen de <strong>inhoud van de locatie-HTML’s</strong>. Technische velden uit <code>locaties.json</code> worden niet als quizkennis gebruikt.</p><button id="quizEmptyClose" type="button">Sluiten</button></div>';
      document.getElementById('quizEmptyClose')?.addEventListener('click',closeQuiz);
      return;
    }
    render();
  }

  function openQuiz(){
    const o=document.getElementById('quizOverlay');
    if(!o)return;
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
