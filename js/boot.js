/* ============================================================
   DedSec // NetHack_OS  —  boot + login + app wiring
   ============================================================ */
(function(){
  // original glitch-skull mark (not any real-world logo)
  const LOGO =
`   ╔═══════════════════════╗
   ║   ▄▄   ██████   ▄▄    ║
   ║  ▟██▙ ▜██████▛ ▟██▙   ║
   ║  ████  ▀▄▄▄▀  ████   ║
   ║  ▜██▛ ▐█ ▪▪ █▌ ▜██▛   ║
   ║   ▀▀  ▐█▌▐█▐█▌  ▀▀    ║
   ║      D E D S E C      ║
   ╚═══════════════════════╝`;

  const BOOT=[
    "NetHack_OS bootloader v3.0  [LIBERATED BUILD]",
    "> mounting /glitch ................ ok",
    "> spoofing hardware id ............ ok",
    "> routing through 7 proxies ....... ok",
    "> scrubbing ctOS telemetry ........ ok",
    "> loading DedSec cell keys ........ ok",
    "> checking for tails .............. clear",
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
      if(i>=BOOT.length){ setTimeout(done,500); return; }
      el.textContent += BOOT[i] + "\n";
      i++;
      setTimeout(next, 130+Math.random()*120);
    })();
  }

  function showLogin(){
    document.getElementById("boot").classList.add("hidden");
    const lg=document.getElementById("login");
    lg.classList.remove("hidden");
    document.getElementById("login-logo").textContent=LOGO;
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

  function startOS(){
    document.getElementById("login").classList.add("hidden");
    document.getElementById("os").classList.remove("hidden");
    // topbar nav
    document.querySelectorAll(".tb-item").forEach(t=>{
      t.onclick=()=>window.Apps.show(t.dataset.app);
    });
    document.getElementById("render-btn").onclick=()=>window.renderExpose();
    const ow=document.getElementById("objective-widget");
    const owTitle=document.getElementById("ow-title");
    document.getElementById("ow-toggle").addEventListener("click",e=>{
      e.stopPropagation();
      ow.classList.toggle("collapsed");
    });

    // draggable title bar — classic movable mini-window
    let dragging=false, dragged=false, startX=0, startY=0, startLeft=0, startTop=0;
    owTitle.addEventListener("pointerdown",e=>{
      if(e.target.closest(".ow-toggle")) return;
      dragging=true; dragged=false;
      const rect=ow.getBoundingClientRect();
      startX=e.clientX; startY=e.clientY;
      startLeft=rect.left; startTop=rect.top;
      ow.style.left=startLeft+"px";
      ow.style.top=startTop+"px";
      ow.style.right="auto";
      ow.style.bottom="auto";
      owTitle.setPointerCapture(e.pointerId);
      ow.classList.add("dragging");
    });
    owTitle.addEventListener("pointermove",e=>{
      if(!dragging) return;
      const dx=e.clientX-startX, dy=e.clientY-startY;
      if(Math.abs(dx)>3||Math.abs(dy)>3) dragged=true;
      const maxLeft=window.innerWidth-ow.offsetWidth;
      const maxTop=window.innerHeight-ow.offsetHeight;
      ow.style.left=Math.min(Math.max(0,startLeft+dx),maxLeft)+"px";
      ow.style.top=Math.min(Math.max(0,startTop+dy),maxTop)+"px";
    });
    owTitle.addEventListener("pointerup",e=>{
      dragging=false;
      owTitle.releasePointerCapture(e.pointerId);
      ow.classList.remove("dragging");
    });
    owTitle.addEventListener("click",e=>{
      if(e.target.closest(".ow-toggle")) return;
      if(dragged){ dragged=false; return; }
      window.Apps.show("missions");
    });
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

  window.addEventListener("DOMContentLoaded",()=>{
    typeBoot(showLogin);
  });
})();
