/* فاهم — تقدّم الطالب المحفوظ في جهازه: سلسلة الأيام 🔥، ودفتر الأخطاء، والدروس اللي خلصها اليوم.
   ويضيف لكل صفحة زر البحث وشارة السلسلة في الشريط العلوي. */
(function(){
  var S={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  var json=function(k,d){try{var v=JSON.parse(S.get(k)||"null");return v==null?d:v}catch(e){return d}};
  var dayKey=function(d){d=d||new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
  var shift=function(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x};
  var ar=function(n){return Number(n).toLocaleString("ar-SA")};

  /* ===== سلسلة الأيام: كل يوم يذاكر فيه الطالب ينحفظ تاريخه ===== */
  function days(){return json("days",[])}
  function streak(){
    var set={};days().forEach(function(k){set[k]=1});
    var d=new Date(), today=!!set[dayKey(d)], n=0;
    if(!today)d=shift(d,-1); /* ما ذاكر اليوم للحين: السلسلة باقية لين ينتهي اليوم */
    while(set[dayKey(d)]){n++;d=shift(d,-1)}
    return {count:n,today:today,best:Math.max(n,Number(S.get("bestStreak"))||0),total:Object.keys(set).length,set:set};
  }
  function activity(){
    var a=days(),t=dayKey();
    if(a.indexOf(t)>=0)return;
    a.push(t);S.set("days",JSON.stringify(a.slice(-400)));
    var s=streak();
    if(s.count>(Number(S.get("bestStreak"))||0))S.set("bestStreak",s.count);
    paint();
    toast(s.count>1?"🔥 سلسلتك صارت "+ar(s.count)+" أيام ورا بعض!":"🔥 بدأت سلسلتك! ذاكر بكرة عشان تكبر");
  }

  /* ===== دفتر الأخطاء: كل سؤال يغلط فيه الطالب ===== */
  function mistakes(){return json("mistakes",[])}
  function saveMistakes(a){S.set("mistakes",JSON.stringify(a))}
  /* row: [السؤال، الصحيح، خطأ، خطأ، خطأ، المرجع] */
  function addMistake(s,sn,row){
    var a=mistakes(),id=s+"|"+row[0],old=null;
    a=a.filter(function(m){if(m.id===id){old=m;return false}return true});
    a.unshift({id:id,s:s,sn:sn,q:row[0],a:row[1],o:row.slice(1,5),ref:row[5]||"",n:(old?old.n:0)+1,t:Date.now()});
    saveMistakes(a.slice(0,300));
  }
  function removeMistake(id){saveMistakes(mistakes().filter(function(m){return m.id!==id}))}

  /* ===== الدروس المكتملة (نفس مفتاح صفحة المذاكرة) + تاريخ إكمالها للخطة ===== */
  function done(){var d=json("done",{});return d&&typeof d==="object"?d:{}}
  function setDone(s,i,on){
    var d=done(),a=d[s]||(d[s]=[]),p=a.indexOf(i),at=json("doneAt",{});
    if(on&&p<0){a.push(i);at[s+":"+i]=dayKey()}
    if(!on&&p>=0){a.splice(p,1);delete at[s+":"+i]}
    S.set("done",JSON.stringify(d));S.set("doneAt",JSON.stringify(at));
    if(on)activity();
  }
  function doneAt(s,i){return json("doneAt",{})[s+":"+i]||null}

  /* ===== رسالة قصيرة أسفل الشاشة ===== */
  function toast(msg){
    var t=document.createElement("div");t.className="fahem-toast";t.setAttribute("role","status");t.textContent=msg;
    document.body.appendChild(t);
    setTimeout(function(){t.classList.add("out")},2600);setTimeout(function(){t.remove()},3100);
  }

  /* ===== الشريط العلوي: البحث + شارة السلسلة ===== */
  var SEARCH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
  function paint(){
    var c=document.getElementById("streakchip");if(!c)return;
    var s=streak();
    c.classList.toggle("off",!s.today);
    c.innerHTML='<span aria-hidden="true">🔥</span><b>'+ar(s.count)+'</b>';
    var tip=s.count?(s.today?"سلسلتك "+ar(s.count)+" أيام. كمّل بكرة!":"سلسلتك "+ar(s.count)+" أيام. ذاكر اليوم عشان ما تنقطع"):"ذاكر اليوم وابدأ سلسلتك";
    c.title=tip;c.setAttribute("aria-label",tip);
  }
  var CSS='.top-end{display:flex;align-items:center;gap:8px}'+
    '.iconbtn,.streakchip{height:40px;border-radius:999px;border:1.5px solid var(--line);background:var(--surface);color:var(--fg);display:inline-flex;align-items:center;justify-content:center;gap:4px;text-decoration:none;flex:none}'+
    '.iconbtn{width:40px}.iconbtn svg{width:19px;height:19px}.iconbtn:hover,.streakchip:hover{border-color:var(--gold)}'+
    '.streakchip{padding-inline:11px;font-weight:700;font-variant-numeric:tabular-nums}.streakchip.off{opacity:.55}.streakchip.off span{filter:grayscale(1)}'+
    '.iconbtn:focus-visible,.streakchip:focus-visible{outline:3px solid var(--gold);outline-offset:2px}'+
    '@media (max-width:560px){.top .homelink{font-size:0;width:40px;padding:0;justify-content:center;gap:0}.top .logo-word small{display:none}}'+
    '.fahem-toast{position:fixed;inset-inline:16px;bottom:calc(18px + env(safe-area-inset-bottom,0px));margin-inline:auto;max-width:420px;z-index:50;background:var(--fg);color:var(--bg);border-radius:14px;padding:12px 16px;font-weight:600;text-align:center;box-shadow:0 10px 30px -10px rgb(0 0 0 / .4);animation:fahem-in .25s ease-out}'+
    '.fahem-toast.out{opacity:0;transform:translateY(8px);transition:.4s}'+
    '@keyframes fahem-in{from{opacity:0;transform:translateY(10px)}}'+
    '@media (prefers-reduced-motion:reduce){.fahem-toast{animation:none}}';
  document.addEventListener("DOMContentLoaded",function(){
    var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
    var top=document.querySelector("header.top");if(!top)return;
    var end=top.querySelector(".top-end"),theme=document.getElementById("themebtn");
    if(!end){end=document.createElement("div");end.className="top-end";top.appendChild(end);if(theme)end.appendChild(theme)}
    var here=location.pathname.split("/").pop();
    if(here!=="search.html"){
      var sb=document.createElement("a");sb.className="iconbtn";sb.href="search.html";sb.innerHTML=SEARCH;sb.title="ابحث في فاهم";sb.setAttribute("aria-label","ابحث في فاهم");
      end.insertBefore(sb,end.firstChild);
    }
    var c=document.createElement("a");c.id="streakchip";c.className="streakchip";c.href="plan.html";
    end.insertBefore(c,end.firstChild);
    paint();
  });

  window.Fahem={activity:activity,streak:streak,mistakes:mistakes,addMistake:addMistake,removeMistake:removeMistake,
    done:done,setDone:setDone,doneAt:doneAt,dayKey:dayKey,shift:shift,ar:ar,toast:toast,store:S};
})();
