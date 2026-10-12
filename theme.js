/* فاهم — زر الوضع الليلي: يتبع جهازك افتراضيًا، ويحفظ اختيارك إذا غيّرته */
(function(){
  var root=document.documentElement, mq=matchMedia("(prefers-color-scheme: dark)");
  var saved=null;try{saved=localStorage.getItem("theme")}catch(e){}
  if(saved==="light"||saved==="dark")root.dataset.theme=saved;
  var MOON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
  var SUN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var dark=function(){return root.dataset.theme?root.dataset.theme==="dark":mq.matches};
  function paint(){
    var b=document.getElementById("themebtn"),d=dark();
    if(b){b.innerHTML=d?SUN:MOON;b.setAttribute("aria-label",d?"الوضع الفاتح":"الوضع الداكن");b.title=b.getAttribute("aria-label")}
    var m=document.querySelector('meta[name="theme-color"]');if(m)m.content=d?"#16120d":"#fbf6e8";
  }
  document.addEventListener("DOMContentLoaded",function(){
    var b=document.getElementById("themebtn");
    if(b)b.onclick=function(){var n=dark()?"light":"dark";root.dataset.theme=n;try{localStorage.setItem("theme",n)}catch(e){}paint()};
    paint();
  });
  if(mq.addEventListener)mq.addEventListener("change",paint);
})();
