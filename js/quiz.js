/* Reisblik 9.9.25 — Reisquiz v4
   Bron: de inhoud van de locatie-HTML's die in de geladen locaties.json staan.
   De locaties.json wordt alleen gebruikt om de juiste HTML-bestanden te vinden. */
(function(){
  'use strict';

  const CONFIG = {
    questionCount: 10,
    answersPerQuestion: 4,
    maxQuestionsPerLocation: 2,
    maxFactsPerLocation: 10,
    maxAnswerLength: 150,
    minFactLength: 45,
    minDistractorLength: 35
  };

  // Technische velden/onderdelen die geen bron voor quizvragen mogen zijn.
  const BLOCKED_TEXT = [
    'gps','latitude','longitude','lat','lon','kaart','route','bron','bronnen',
    'copyright','privacy','cookie','menu','navigatie','zoek','afstand','versie',
    'type','categorie','id','html','bestand','url','link','adres','postcode'
  ];

  const TOPIC_WORDS = {
    landschap:['landschap','omgeving','terrein','hoogteverschil','stuwdam','gebied','dal','helling','vallei','duin','polder'],
    natuur:['natuur','bos','heide','park','tuin','rivier','berg','meer','water','flora','fauna','plant','dier','leefgebied'],
    archeologie:['archeologie','archeologisch','grafheuvel','grafheuvels','raatakker','raatakkers','opgraving','prehistorie','romeinen','bataven'],
    gebouw:['gebouw','kasteel','kerk','huis','buitenplaats','landgoed','toren','monument','ruïne','fort','boerderij','molen'],
    persoon:['persoon','personen','bewoner','bewoners','eigenaar','eigenaren','stichter','stichters','zoon','dochter','familie','graaf','baron','hertog','koning'],
    geschiedenis:['geschiedenis','historie','historisch','verleden','oorlog','bombardement','strijd','beleg','verwoesting','middeleeuwen','eeuw'],
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

  const UI_MARKERS = [
    'in één oogopslag','tappe','type','recreatie','persoon','wist je dat',
    'geen afzonderlijke persoon gekoppeld','terug','volgende','menu','zoek',
    'toon op kaart','lees meer','download','deel deze locatie'
  ];

  function looksLikeUiText(s){
    const lower=s.toLowerCase();
    const markerHits=UI_MARKERS.filter(x=>lower.includes(x)).length;
    const camelHits=(s.match(/[a-zà-ÿ][A-ZÀ-Ý]/g)||[]).length;
    const separators=(s.match(/[|•→←]/g)||[]).length;
    return markerHits>=2 || camelHits>=2 || separators>=2;
  }

  function allowedText(text){
    const s=clean(text);
    if(s.length<CONFIG.minFactLength || s.length>360)return false;
    if(/^https?:\/\//i.test(s))return false;
    if(looksLikeUiText(s))return false;
    if(/^(gps|latitude|longitude|adres|bron|bronnen|type|categorie|route|afstand)\s*[:]/i.test(s))return false;
    if(/^(in één oogopslag|wist je dat|type|recreatie|persoon)\b/i.test(s))return false;
    return true;
  }

  function splitSentences(text){
    return clean(text)
      .split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Ý0-9])/u)
      .map(clean)
      .filter(allowedText);
  }

  function topicFor(heading,text){
    const h=normalize(heading);
    const t=normalize(text);
    // Een kopje is sterker bewijs voor het onderwerp dan een toevallig woord in de zin.
    const headingScores=Object.entries(TOPIC_WORDS).map(([topic,words])=>[
      topic, words.reduce((n,w)=>n+(h.includes(w)?1:0),0)
    ]).sort((a,b)=>b[1]-a[1]);
    if(headingScores[0]?.[1]>0)return headingScores[0][0];
    const textScores=Object.entries(TOPIC_WORDS).map(([topic,words])=>[
      topic, words.reduce((n,w)=>n+(t.includes(w)?1:0),0)
    ]).sort((a,b)=>b[1]-a[1]);
    return textScores[0]?.[1]>0 ? textScores[0][0] : 'bijzonder';
  }

  function answerText(f){
    let s=clean(f.fullText);
    const h=clean(f.heading);
    if(h && h.length<100){
      const re=new RegExp('^'+h.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\s*:\s*','i');
      s=s.replace(re,'');
    }
    s=s.replace(/^(flora en fauna|landschap en geologie|archeologie|geschiedenis|cultuur|kunst|architectuur|bijzonderheden|bijzonderheid)\s*:\s*/i,'');
    return shorten(s);
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

  function uniqueDistractors(f, facts, count=3){
    const topic=f.topic;
    const candidates=facts
      .filter(x=>x!==f && x.location!==f.location)
      .filter(x=>x.topic===topic)
      .filter(x=>x.text.length>=CONFIG.minDistractorLength)
      .map(x=>({text:answerText(x), fact:x}))
      .filter(x=>x.text && normalize(x.text)!==normalize(answerText(f)));

    const seen=new Set();
    const result=[];
    for(const item of candidates.sort(()=>Math.random()-0.5)){
      const sig=normalize(item.text);
      if(seen.has(sig))continue;
      seen.add(sig);
      result.push(item);
      if(result.length>=count)break;
    }
    return result;
  }

  function questionFromFact(f){
    const name=locationName(f.location);
    switch(f.topic){
      case 'landschap': return `Wat kenmerkt het landschap van de omgeving van ${name}?`;
      case 'natuur': return `Wat wordt beschreven over de natuur rond ${name}?`;
      case 'archeologie': return `Wat is er archeologisch bijzonder aan de omgeving van ${name}?`;
      case 'gebouw': return `Welke bijzonderheid wordt genoemd over ${name}?`;
      case 'persoon': return `Welke persoon of familie wordt in verband gebracht met ${name}?`;
      case 'geschiedenis': return `Wat gebeurde er in de geschiedenis van ${name}?`;
      case 'cultuur': return `Welke culturele of historische bijzonderheid hoort bij ${name}?`;
      default: return `Welke bijzonderheid wordt genoemd over ${name}?`;
    }
  }

  function statementQuestion(f,allFacts){
    const distractors=uniqueDistractors(f,allFacts,3);
    if(distractors.length<3)return null;
    const correct=answerText(f);
    const answers=[correct,...distractors.map(x=>x.text)];
    if(new Set(answers.map(normalize)).size<4)return null;
    answers.sort(()=>Math.random()-0.5);
    return {
      question:questionFromFact(f),
      answers,
      correct:answers.indexOf(correct),
      explanation:answerText(f),
      location:locationName(f.location),
      sourceTopic:f.topic,
      signature:'content|'+f.signature
    };
  }

  function makeQuestions(facts){
    const candidates=facts.slice().sort(()=>Math.random()-0.5);
    const topicUsed=new Map();
    const result=[];
    const perLoc=new Map();
    const used=new Set();

    // Eerst echte jaartallen proberen; daarna inhoudelijke beweringen.
    for(const f of candidates){
      if(result.length>=CONFIG.questionCount)break;
      const key=String(f.location.id||f.location.__quizIndex||locationName(f.location));
      const count=perLoc.get(key)||0;
      if(count>=CONFIG.maxQuestionsPerLocation)continue;
      const topicCount=topicUsed.get(f.topic)||0;
      if(topicCount>=3)continue;

      let q=statementQuestion(f,facts);
      if(!q || used.has(q.signature))continue;

      used.add(q.signature);
      result.push(q);
      perLoc.set(key,count+1);
      topicUsed.set(f.topic,topicCount+1);
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
