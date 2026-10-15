/* ============================================================
   DedSec // NetHack_OS  —  boot + login + app wiring
   ============================================================ */
(function(){
  const BOOT=[
    "NetHack_OS bootloader v3.0  [LIBERATED BUILD]",
    "> mounting /glitch ................ ok",
    "> spoofing hardware id ............ ok",
    "> routing through 7 proxies ....... ok",
    "> scrubbing ctOS telemetry ........ ok",
    "> loading DedSec cell keys ........ ok",
    "> checking for tails .............. clear",
    "> decrypting local cache .......... ok",
    "> verifying cell handshake ........ ok",
    "> syncing ctOS blind spots ........ ok",
    "> arming dead-man's switch ........ ok",
    "",
    "   this machine does not exist.",
    "   neither do you.",
    "",
    "booting member terminal..."
  ];

  function typeBoot(done){
    const el=document.getElementById("boot-log");
    let i=0;
    (function next(){
      if(i>=BOOT.length){ setTimeout(done,1200); return; }
      el.textContent += BOOT[i] + "\n";
      i++;
      setTimeout(next, 130+Math.random()*120);
    })();
  }

  // reusable chrome for the floating mini-windows: drag-to-move + minimize + optional click action
  function wireMiniWindow(winId,titleId,toggleId,onClick){
    const win=document.getElementById(winId);
    const title=document.getElementById(titleId);
    const toggle=document.getElementById(toggleId);
    toggle.addEventListener("click",e=>{
      e.stopPropagation();
      win.classList.toggle("collapsed");
    });
    let dragging=false, dragged=false, startX=0, startY=0, startLeft=0, startTop=0;
    title.addEventListener("pointerdown",e=>{
      if(e.target.closest("button")) return;
      dragging=true; dragged=false;
      const rect=win.getBoundingClientRect();
      startX=e.clientX; startY=e.clientY;
      startLeft=rect.left; startTop=rect.top;
      win.style.left=startLeft+"px";
      win.style.top=startTop+"px";
      win.style.right="auto";
      win.style.bottom="auto";
      title.setPointerCapture(e.pointerId);
      win.classList.add("dragging");
    });
    title.addEventListener("pointermove",e=>{
      if(!dragging) return;
      const dx=e.clientX-startX, dy=e.clientY-startY;
      if(Math.abs(dx)>3||Math.abs(dy)>3) dragged=true;
      const maxLeft=window.innerWidth-win.offsetWidth;
      const maxTop=window.innerHeight-win.offsetHeight;
      win.style.left=Math.min(Math.max(0,startLeft+dx),maxLeft)+"px";
      win.style.top=Math.min(Math.max(0,startTop+dy),maxTop)+"px";
    });
    title.addEventListener("pointerup",e=>{
      dragging=false;
      title.releasePointerCapture(e.pointerId);
      win.classList.remove("dragging");
    });
    if(onClick){
      title.addEventListener("click",e=>{
        if(e.target.closest("button")) return;
        if(dragged){ dragged=false; return; }
        onClick();
      });
    }
  }

  function showLogoReveal(done){
    document.getElementById("boot").classList.add("hidden");
    const lr=document.getElementById("logoreveal");
    lr.classList.remove("hidden");
    setTimeout(()=>{
      lr.classList.add("hidden");
      done();
    },3400);
  }

  function showLogin(){
    document.getElementById("boot").classList.add("hidden");
    const lg=document.getElementById("login");
    lg.classList.remove("hidden");
    const h=document.getElementById("login-handle");
    h.focus();
    h.addEventListener("keydown",e=>{
      if(e.key==="Enter"){
        const v=(h.value.trim()||"recruit").replace(/[^a-zA-Z0-9_]/g,"").slice(0,16)||"recruit";
        window.STATE.handle=v;
        startOS();
      }
    });
  }

  function stopIntroSound(){
    const a=document.getElementById("intro-sound");
    a.pause();
    a.currentTime=0;
  }

  function startOS(){
    stopIntroSound();
    document.getElementById("music-widget").classList.remove("hidden");
    document.getElementById("login").classList.add("hidden");
    document.getElementById("os").classList.remove("hidden");
    // topbar nav
    document.querySelectorAll(".tb-item").forEach(t=>{
      t.onclick=()=>window.Apps.show(t.dataset.app);
    });
    document.getElementById("render-btn").onclick=()=>window.renderExpose();
    wireMiniWindow("objective-widget","ow-title","ow-toggle",()=>window.Apps.show("missions"));
    document.getElementById("tb-rep").textContent="REP: 0";
    window.initTerminal();
    window.Apps.renderMissions();
    startClock();
    window.Apps.show("terminal");
    window.setStatus("// jacked in as "+window.STATE.handle+" — welcome to DedSec","green");
  }

  function startClock(){
    const el=document.getElementById("tb-clock");
    setInterval(()=>{
      const d=new Date();
      el.textContent=[d.getHours(),d.getMinutes(),d.getSeconds()]
        .map(n=>String(n).padStart(2,"0")).join(":");
    },1000);
  }

  function playIntroSound(){
    const a=document.getElementById("intro-sound");
    const attempt=()=>a.play().catch(()=>{
      const retry=()=>{ a.play().catch(()=>{}); };
      document.addEventListener("pointerdown",retry,{once:true});
      document.addEventListener("keydown",retry,{once:true});
    });
    attempt();
  }

  window.addEventListener("DOMContentLoaded",()=>{
    wireMiniWindow("music-widget","music-title","music-toggle",null);
    playIntroSound();
    typeBoot(()=>showLogoReveal(showLogin));
  });
})();
