/* ============================================================
   DedSec // NetHack_OS  —  terminal I/O engine
   ============================================================ */
(function(){
  const output=()=>document.getElementById("term-output");
  const input =()=>document.getElementById("term-input");
  const history=[]; let hIdx=-1;

  // synthesized key-click — a short filtered noise burst, no audio file needed
  let actx=null;
  function audioCtx(){
    if(!actx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC) return null;
      actx=new AC();
    }
    if(actx.state==="suspended") actx.resume();
    return actx;
  }
  function playKeyClick(hard){
    const ctx=audioCtx();
    if(!ctx) return;
    try{
      const dur=0.03+Math.random()*0.015;
      const buf=ctx.createBuffer(1, Math.max(1,Math.floor(ctx.sampleRate*dur)), ctx.sampleRate);
      const data=buf.getChannelData(0);
      for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
      const src=ctx.createBufferSource(); src.buffer=buf;
      const filter=ctx.createBiquadFilter();
      filter.type="bandpass";
      filter.frequency.value = hard ? 1100+Math.random()*250 : 2000+Math.random()*700;
      filter.Q.value=1.1;
      const gain=ctx.createGain();
      gain.gain.setValueAtTime(hard?0.2:0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur);
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start();
    }catch(e){}
  }

  window.termLine=function(text,cls,isHTML){
    const div=document.createElement("div");
    div.className="ln"+(cls?" "+cls:"");
    if(isHTML) div.innerHTML=text;
    else div.innerHTML=escapeAllowSpans(text);
    output().appendChild(div);
    output().scrollTop=output().scrollHeight;
  };

  // allow our own <span class="c-..."> tags but escape stray <>
  function escapeAllowSpans(t){
    const tokens=[];
    t=t.replace(/<span class="[a-z\- ]+">|<\/span>/g,m=>{tokens.push(m);return "\u0000"+(tokens.length-1)+"\u0000";});
    t=t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    t=t.replace(/\u0000(\d+)\u0000/g,(_,i)=>tokens[+i]);
    return t;
  }

  window.updatePrompt=function(){
    const host = window.STATE.net.currentHost==="home" ? "dedsec" : window.STATE.net.currentHost;
    const p=`<span class="c-mag">${window.STATE.handle}</span>@${host}:<span class="c-cyan">${window.shortCwd()}</span>$`;
    document.getElementById("term-prompt").innerHTML=p;
  };

  window.initTerminal=function(){
    updatePrompt();
    document.getElementById("sb-user").textContent=window.STATE.handle+"@dedsec";
    termLine("DedSec//NetHack_OS ready. type `help` to begin. type `ops` for your jobs.","c-dim");
    termLine("");
    const inp=input();
    inp.addEventListener("keydown",e=>{
      if(!["Shift","Control","Alt","Meta","CapsLock","Tab"].includes(e.key)){
        playKeyClick(e.key==="Enter");
      }
      if(e.key==="Enter"){
        const val=inp.value;
        termLine(document.getElementById("term-prompt").innerHTML+" "+escapeHtml(val),"cmd-echo",true);
        if(val.trim()){ history.push(val); hIdx=history.length; }
        inp.value="";
        window.runCommand(val);
        termLine("");
      } else if(e.key==="ArrowUp"){
        if(hIdx>0){ hIdx--; inp.value=history[hIdx]||""; }
        e.preventDefault();
      } else if(e.key==="ArrowDown"){
        if(hIdx<history.length-1){ hIdx++; inp.value=history[hIdx]||""; }
        else { hIdx=history.length; inp.value=""; }
        e.preventDefault();
      }
    });
    document.getElementById("app-terminal").addEventListener("click",()=>inp.focus());
  };

  function escapeHtml(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
})();
