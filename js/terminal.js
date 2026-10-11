/* ============================================================
   DedSec // NetHack_OS  —  terminal I/O engine
   ============================================================ */
(function(){
  const output=()=>document.getElementById("term-output");
  const input =()=>document.getElementById("term-input");
  const history=[]; let hIdx=-1;

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
