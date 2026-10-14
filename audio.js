/* فاهم — أمثلة صوتية لدروس التجويد.
   التلاوة: الشيخ محمود خليل الحصري (مرتّل)، من everyayah.com. نشغّل النطق الصحيح فقط،
   وما نركّب «وصل» من مقاطع منفصلة لأن الوصل الحقيقي يتغيّر فيه آخر الكلمة. */
const EA="https://everyayah.com/data/Husary_128kbps/";
const AYAH=(s,a)=>`${EA}${String(s).padStart(3,"0")}${String(a).padStart(3,"0")}.mp3`;
const AUDHU=EA+"audhubillah.mp3", BISM=EA+"bismillah.mp3";

/* لكل درس تجويد (بالترتيب): [العنوان، الملاحظة، المقاطع، فاصل بين المقاطع بالملّي ثانية] */
const TAJWEED_AUDIO=[
  [ /* علم التجويد */
    ["سورة الفاتحة مجوّدة","اسمع كيف يأخذ كل حرف حقه: المخرج، والغنّة، والمدّ.",[1,2,3,4,5,6,7].map(a=>AYAH(1,a)),500]
  ],
  [ /* اللحن في قراءة القرآن */
    ["﴿صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ ... وَلَا الضَّالِّينَ﴾","التاء مفتوحة في «أنعمتَ»، والمدّ كامل في «الضالّين» مع تشديد اللام.",[AYAH(1,7)]],
    ["﴿الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ﴾","الهمزة محقّقة في «الحمد»، وهاء لفظ الجلالة مكسورة.",[AYAH(1,2)]],
    ["﴿إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ﴾","الياء مشدّدة في «إيّاك»، والدال مضمومة في «نعبدُ» بلا مدّ.",[AYAH(1,5)]],
    ["﴿اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ﴾","الهمزة واضحة في أول «اهدنا».",[AYAH(1,6)]],
    ["﴿كُنْتُمْ خَيْرَ أُمَّةٍ أُخْرِجَتْ لِلنَّاسِ﴾","الغنّة كاملة في «كُنتم».",[AYAH(3,110)]],
    ["﴿فَيَوْمَئِذٍ لَا يُسْأَلُ عَنْ ذَنْبِهِ إِنْسٌ وَلَا جَانٌّ﴾","الغنّة والمدّ كاملان عند الوقف على «جانّ».",[AYAH(55,39)]]
  ],
  [ /* الاستعاذة والبسملة */
    ["الاستعاذة","«أعوذ بالله من الشيطان الرجيم».",[AUDHU]],
    ["البسملة","«بسم الله الرحمن الرحيم».",[BISM]],
    ["الوجه الأول: قطع الجميع","آخر النحل، وقفة، البسملة، وقفة، أول الإسراء.",[AYAH(16,128),BISM,AYAH(17,1)],1300],
    ["بين الأنفال والتوبة: الوقف","آخر الأنفال، وقفة، أول التوبة، بلا بسملة.",[AYAH(8,75),AYAH(9,1)],1300]
  ]
];

const PLAY_I='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
const STOP_I='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2"/></svg>';

(function(){
  const st=document.createElement("style");
  st.textContent=`.audios{display:grid;gap:8px}
.aud{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:10px 12px}
.aud.playing{border-color:var(--acc);background:var(--acc-soft)}
.play{appearance:none;width:44px;height:44px;border-radius:50%;border:0;background:var(--acc);color:var(--surface);display:grid;place-items:center;cursor:pointer}
.play svg{width:20px;height:20px}
.play:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.aud b{display:block;font-family:var(--quran);font-size:1.15rem;line-height:1.8}
.aud small{display:block;color:var(--muted);font-size:.85rem;line-height:1.6}
.aud small.err{color:var(--bad)}`;
  document.head.appendChild(st);
})();

/* قسم «اسمع الأمثلة» في آخر شرح الدرس */
function tajweedAudio(i){
  const list=TAJWEED_AUDIO[i];if(!list)return "";
  return `<section class="lsec"><h3>🎧 اسمع الأمثلة</h3><div class="audios">${list.map(([t,n],j)=>`<div class="aud" data-a="${i}-${j}"><button type="button" class="play" aria-label="تشغيل: ${t.replace(/"/g,"")}">${PLAY_I}</button><div><b>${t}</b><small>${n}</small></div></div>`).join("")}</div>
  <p class="ref" style="margin:0">التلاوة: الشيخ محمود خليل الحصري · تحتاج إنترنت.</p></section>`;
}

/* مشغّل واحد للصفحة: يشغّل مقاطع المثال ورا بعض */
const player={audio:new Audio(),row:null,timer:null,token:0};
function stopAudio(){
  player.token++;clearTimeout(player.timer);player.audio.pause();
  if(player.row){player.row.classList.remove("playing");const b=player.row.querySelector(".play");b.innerHTML=PLAY_I;b.setAttribute("aria-label",b.getAttribute("aria-label").replace("إيقاف","تشغيل"))}
  player.row=null;
}
function playRow(row){
  const was=player.row===row;stopAudio();if(was)return;
  const [i,j]=row.dataset.a.split("-").map(Number),[ ,n,clips,gap=0]=TAJWEED_AUDIO[i][j];
  const b=row.querySelector(".play"),note=row.querySelector("small");
  note.textContent=n;note.classList.remove("err");
  player.row=row;row.classList.add("playing");b.innerHTML=STOP_I;b.setAttribute("aria-label",b.getAttribute("aria-label").replace("تشغيل","إيقاف"));
  const token=player.token;let k=0;
  const next=()=>{
    if(token!==player.token)return;
    if(k>=clips.length){stopAudio();return}
    player.audio.src=clips[k++];
    player.audio.onended=()=>{player.timer=setTimeout(next,gap)};
    player.audio.onerror=()=>{if(token!==player.token)return;stopAudio();note.textContent="ما قدرنا نشغّل الصوت. تأكد من الإنترنت وجرّب مرة ثانية.";note.classList.add("err")};
    player.audio.play().catch(()=>{});
  };
  next();
  if(window.Fahem)Fahem.activity();
}
function bindAudio(root){root.querySelectorAll(".aud .play").forEach(b=>b.onclick=()=>playRow(b.closest(".aud")))}
