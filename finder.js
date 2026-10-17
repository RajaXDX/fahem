/* فاهم — محرك البحث: يدوّر في الدروس، وبنك الأسئلة، والأرقام، وحلول الكتب.
   كل شي يصير في جهاز الطالب، ما فيه خادم. تستخدمه صفحة البحث وصفحة «اسأل فاهم». */
const Finder=(()=>{
  const SUBJ={t:"التجويد",s:"الاجتماعيات",i:"الدراسات الإسلامية",d:"المهارات الرقمية",en:"اللغة الإنجليزية"};
  const DIGITS="٠١٢٣٤٥٦٧٨٩";
  const norm=s=>String(s)
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g,"")
    .replace(/[إأآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/ؤ/g,"و").replace(/ئ/g,"ي")
    .replace(/[٠-٩]/g,d=>DIGITS.indexOf(d)).toLowerCase();
  const STOP=new Set(("ما من في على عن الى هو هي هم هن ماذا لماذا ليش كيف متى اين وين هل الذي التي الذين اللي او و ثم مع كل بين عند لا لم لن قد ان كان كانت يكون "+
    "مين منو هذا هذه ذلك تلك وش ايش شنو يعني معنى المقصود المراد عرف اعرف اذكر اكتب ابين بين وضح اوضح سؤال جواب حل ابي ابغى ممكن لو سمحت عطني قل لي").split(" ").map(norm));
  /* يشيل «ال» وأخواتها من أول الكلمة، فتصير «والكواكب» و«الكواكب» و«كواكب» كلمة وحدة */
  const stem=w=>{for(const p of ["وال","بال","فال","كال","لل","ال"])if(w.startsWith(p)&&w.length-p.length>=2)return w.slice(p.length);return w};
  const variants=w=>{const v=[stem(w)];if(w.length>=4&&"وفبلك".includes(w[0]))v.push(stem(w.slice(1)));return v};
  const words=s=>norm(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const terms=s=>{const out=[];for(const w of words(s)){if(STOP.has(w)||w.length<2)continue;for(const v of variants(w))if(v.length>=2&&!STOP.has(v))out.push(v)}return out};
  const strip=h=>String(h).replace(/<br\s*\/?>/gi," ").replace(/<\/(p|li|div|tr|h3|td|th)>/gi," · ").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/\s*·\s*(·\s*)+/g," · ").replace(/\s+/g," ").replace(/^\s*·\s*|\s*·\s*$/g,"").trim();

  let docs=[],df=new Map(),N=0,books={};

  function add(d){
    d.tt=new Set(terms(d.title));d.tw=Math.max(1,words(d.title).filter(w=>w.length>=2&&!STOP.has(w)).length);d.all=new Set([...d.tt,...terms(d.text)]);d.nt=norm(d.title+" "+d.text);
    for(const t of d.all)df.set(t,(df.get(t)||0)+1);
    docs.push(d);
  }
  function build(){
    docs=[];df=new Map();
    for(const k of Object.keys(typeof LESSONS!=="undefined"?LESSONS:{})){
      LESSONS[k].forEach((L,li)=>{
        const url=`study.html#learn-${k}-${li+1}`;
        const parts=String(L.html).split(/<section class="lsec">/).slice(1);
        if(!parts.length)add({type:"lesson",s:k,title:L.title,text:strip(L.html),url,lesson:L.title});
        parts.forEach(p=>{const m=p.match(/<h3>([\s\S]*?)<\/h3>/);const head=m?strip(m[1]):"";add({type:"lesson",s:k,title:head?`${L.title} · ${head}`:L.title,text:strip(m?p.replace(m[0],""):p),url,lesson:L.title,head})});
      });
    }
    for(const k of Object.keys(typeof BANK!=="undefined"?BANK:{}))
      BANK[k].forEach(r=>add({type:"q",s:k,title:r[0],text:r[1],answer:r[1],ref:r[5]||"",url:`study.html#quiz-${k}`}));
    if(typeof NUMS!=="undefined")NUMS.forEach(([n,m])=>add({type:"num",s:"s",title:m,text:n,answer:n,url:"study.html#cards-s"}));
    if(typeof SOL!=="undefined")for(const b of Object.keys(SOL))for(const p of Object.keys(SOL[b]))SOL[b][p].forEach(e=>{
      const ans=Array.isArray(e[1])?e[1].map(x=>x[0]).join("، "):e[1];
      if(!/\p{L}{2}/u.test(ans))return; /* حلول هي علامة ✓ أو رقم على الصفحة فقط: ما تفيد بدون الصورة */
      add({type:"sol",b,page:Number(p),title:e[0],text:ans,answer:ans,url:`books.html#${b}-${p}`});
    });
    N=docs.length;
  }
  const idf=t=>Math.log(1+N/(df.get(t)||N));

  function search(q,{type=null,limit=60}={}){
    /* «ما هي…» و«وش يعني…» سؤال عن تعريف */
    if(/^\s*(ما|وش|ايش|إيش)\s+(هي|هو|معنى|المقصود|المراد|يعني)|^\s*(عرّف|عرف|وش يعني)/.test(q))q+=" تعريف";
    const qt=[...new Set(terms(q))];if(!qt.length)return [];
    const when=/^\s*(متي|في اي سنه|كم سنه)/.test(norm(q)); /* «متى…؟» نقدّم اللي فيه سنة هجرية */
    const phrase=norm(q).replace(/[^\p{L}\p{N}]+/gu," ").trim();
    const wsum=qt.reduce((a,t)=>a+idf(t),0);
    const out=[];
    for(const d of docs){
      if(type&&d.type!==type)continue;
      let sc=0,hit=0;
      for(const t of qt){
        let m=d.all.has(t);
        if(!m&&t.length>=4){for(const x of d.all)if(x.startsWith(t)){m=true;break}} /* «الكوكب» تلقى «الكوكبين» */
        if(m){hit++;sc+=idf(t)*(d.tt.has(t)?2:1)}
      }
      if(!hit)continue;
      const cover=sc/wsum;
      if(qt.length>2&&hit/qt.length<.5)continue;
      /* دقة العنوان: كم من كلمات العنوان طلبها السائل؛ «تعريف خطوط الطول» أقرب لـ«ما تعريف خطوط الطول» من «عدد خطوط الطول» */
      let th=0;for(const t of qt)if(d.tt.has(t))th++;
      const prec=Math.min(1,th/d.tw);
      let score=cover*cover*(d.type==="lesson"?1.25:1)*(1+hit/qt.length)*(.6+.4*prec);
      if(phrase.length>3&&d.nt.includes(phrase))score*=1.6;
      if(when&&/\d+ ?ه(?![\p{L}])/u.test(d.nt))score*=1.6;
      out.push({d,score});
    }
    out.sort((a,b)=>b.score-a.score);
    return out.slice(0,limit);
  }

  /* تظليل كلمات البحث في النص الأصلي (مع التشكيل) */
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  function mark(text,q,max=0){
    const qt=new Set(terms(q));
    let t=String(text);
    if(max&&t.length>max){
      const nt=norm(t);let pos=-1;
      for(const x of qt){const i=nt.indexOf(x);if(i>=0&&(pos<0||i<pos))pos=i}
      /* التشكيل يغيّر الطول؛ نقرّب المكان بالنسبة */
      const at=pos<0?0:Math.round(pos*t.length/Math.max(1,nt.length));
      const from=Math.max(0,at-Math.round(max/3));
      t=(from>0?"… ":"")+t.slice(from,from+max).replace(/^\S*\s/,from>0?"":"$&")+(from+max<t.length?" …":"");
    }
    return t.split(/(\s+)/).map(w=>{if(/^\s+$/.test(w))return w;const n=norm(w).replace(/[^\p{L}\p{N}]/gu,"");const hit=variants(n).some(v=>qt.has(v)||[...qt].some(x=>x.length>=4&&v.startsWith(x)));return hit?`<mark>${esc(w)}</mark>`:esc(w)}).join("");
  }

  /* يحمّل حلول الكتب: يقرأ قائمة ملفاتها وأسماء الكتب من books.html نفسها، فأي كتاب ينضاف هناك ينضاف هنا */
  async function loadBooks(){
    try{
      const html=await (await fetch("books.html",{cache:"no-cache"})).text();
      const nm=html.match(/const NAME=\{([^}]*)\}/);
      if(nm)for(const [,k,v] of nm[1].matchAll(/(\w+):"([^"]+)"/g))books[k]=v;
      window.SOL=window.SOL||{};for(const k of Object.keys(books))SOL[k]=SOL[k]||{};
      const srcs=[...html.matchAll(/<script src="(sol\/[^"]+)"/g)].map(m=>m[1]);
      for(const k of srcs.map(s=>s.match(/sol\/([a-z]+\d?)/)?.[1]).filter(Boolean))SOL[k]=SOL[k]||{};
      await Promise.all(srcs.map(src=>new Promise(res=>{const s=document.createElement("script");s.src=src;s.onload=s.onerror=res;document.head.appendChild(s)})));
    }catch(e){}
  }
  async function ready(){await loadBooks();build();return N}

  const subjName=d=>d.type==="sol"?(books[d.b]||"الكتاب"):(SUBJ[d.s]||"");
  const typeName=d=>({lesson:"درس",q:"سؤال",num:"رقم مهم",sol:"حل الكتاب"})[d.type];
  return {ready,search,mark,esc,norm,terms,subjName,typeName,get count(){return N},books};
})();
