/* ============================================================
   DedSec // NetHack_OS  —  Linux-ish command interpreter
   ============================================================ */
(function(){
  const S = window.STATE;
  const FS = window.FS;

  function out(text,cls){ window.termLine(text,cls); }

  function shortCwd(){
    return S.cwd.replace("/home/dedsec","~");
  }

  function curFS(){ return S.net.currentHost==="home" ? FS : window.NET.hostFS(S.net.currentHost); }

  function expandPath(p){
    if(p && S.net.currentHost==="home" && (p==="~"||p.startsWith("~/"))) return "/home/dedsec"+p.slice(1);
    return p;
  }

  function updateHostIndicator(){
    const el=document.getElementById("sb-user");
    if(el) el.textContent = S.handle+"@"+(S.net.currentHost==="home"?"dedsec":S.net.currentHost);
  }

  const CMDS = {
    help(){
      out(
`AVAILABLE COMMANDS ───────────────────────────────
 help              this list
 ls [path]         list a directory
 cd <path>         change directory (.. and ~ work)
 pwd               print working directory
 cat <file>        read a file
 tree              show the filesystem tree
 whoami            who you are
 decrypt <file>    crack an encrypted file
 ssh <node>        jack into a credentialed node (local flavor creds)
 hosts             list known network hosts and their status
 scan [host]       sweep for nearby hosts, or inspect one by id
 connect <host>    pivot onto a breached/reachable host (connect home to return)
 disconnect        step back one hop toward your own terminal
 tools             list tools you've unlocked on the network
 ops               list active operations
 rep               show your reputation
 evidence          show collected evidence
 clear             clear the screen
 manifesto         print the DedSec manifesto
 neofetch          system readout
 sudo <...>        ...you really think that works here?
──────────────────────────────────────────────────
 tip: the GUI apps up top ([ ctOS_scanner ], [ network ], [ profiler ],
 [ ops ], [ exposé_studio ]) are part of the mission too.`,"c-dim");
      window.GAME.fire("help");
    },

    ls(args){
      const cfs=curFS();
      const target = args[0] ? FS.normalize(S.cwd,expandPath(args[0])) : S.cwd;
      const items = cfs.list(target);
      if(!items){ out("ls: cannot access '"+(args[0]||target)+"': not a directory","c-red"); return; }
      if(!items.length){ out("(empty)","c-muted"); return; }
      const line = items.map(i=> i.dir ? `<span class="c-cyan">${i.name}/</span>` : `<span class="c-green">${i.name}</span>`).join("   ");
      out(line,null,true);
      if(target===S.cwd || (args[0]==="." )) window.GAME.fire("ls");
    },

    cd(args){
      const cfs=curFS();
      const home = S.net.currentHost==="home" ? "/home/dedsec" : "/";
      if(!args[0]||args[0]==="~"){ S.cwd=home; return refreshPrompt(); }
      const target=FS.normalize(S.cwd,expandPath(args[0]));
      const n=cfs.nodeAt(target);
      if(cfs.isDir(n)){ S.cwd=target; refreshPrompt();
        if(S.net.currentHost==="home" && target==="/mnt/ctos_share") window.GAME.fire("mount");
      }
      else out("cd: no such directory: "+args[0],"c-red");
    },

    pwd(){ out(S.cwd,"c-green"); },

    cat(args){
      if(!args[0]){ out("cat: missing file operand","c-red"); return; }
      const cfs=curFS();
      const target=FS.normalize(S.cwd,expandPath(args[0]));
      const data=cfs.read(target);
      if(data===null){
        if(cfs.isDir(cfs.nodeAt(target))) out("cat: "+args[0]+": is a directory","c-red");
        else out("cat: "+args[0]+": no such file","c-red");
        return;
      }
      out(data);
      if(S.net.currentHost==="home"){
        const base=target.split("/").pop();
        if(base==="manifesto.txt") window.GAME.fire("cat");
        if(target==="/home/dedsec/.secrets/keys.txt") window.GAME.fire("creds");
        if(target==="/mnt/ctos_share/PROJECT_NUDGE/overview.txt") window.GAME.fire("read_nudge");
        if(target==="/home/dedsec/incoming/tipoff.txt") window.GAME.fire("tipoff");
      }
    },

    manifesto(){ CMDS.cat(["/home/dedsec/manifesto.txt"]); },

    tree(){
      const cfs=curFS();
      const lines=[];
      (function walk(path,prefix){
        const items=cfs.list(path); if(!items) return;
        items.forEach((it,idx)=>{
          const last=idx===items.length-1;
          lines.push(prefix+(last?"└─ ":"├─ ")+(it.dir?it.name+"/":it.name));
          if(it.dir) walk(path==="/"?"/"+it.name:path+"/"+it.name, prefix+(last?"   ":"│  "));
        });
      })(S.cwd,"");
      out(shortCwd()+"/\n"+(lines.join("\n")||"(empty)"),"c-cyan");
    },

    hosts(){
      out("KNOWN HOSTS ─────────────────────────────","c-mag");
      Object.values(window.NET.HOSTS).forEach(h=>{
        const breached=S.net.breached.has(h.id);
        const reach=window.NET.reachable(h.id);
        const here=S.net.currentHost===h.id;
        const status = here?"◉ HERE":breached?"✔ BREACHED":reach?"◌ REACHABLE":"✕ LOCKED";
        const cls = here?"c-cyan":breached?"c-green":reach?"c-amber":"c-muted";
        out(`  <span class="${cls}">${status.padEnd(11)}</span> ${h.id.padEnd(14)} ${h.ip.padEnd(14)} ${h.name}`,null,true);
      });
    },

    scan(args){
      if(!args[0]){
        out("ctOS GRID SUMMARY ─────────────────","c-mag");
        out("6 nodes in range · "+S.hackedNodes.size+" intercepted","c-muted");
        out("open the [ ctOS_scanner ] app to intercept live datastreams.","c-dim");
        const id=S.net.currentHost;
        const neighbors = id==="home" ? (S.act>=2 ? [window.NET.HOSTS.entry_gw] : []) : window.NET.neighborsOf(id);
        if(neighbors.length){
          out("");
          out("scanning local network segment...","c-dim");
          neighbors.forEach(n=>{
            S.net.scanned.add(n.id);
            out("  "+n.ip.padEnd(14)+" "+n.id.padEnd(14)+(n.honeypot?"⚠ unusual traffic pattern":n.hint||""),"c-cyan");
          });
          window.GAME.fire("scan_net");
        }
        return;
      }
      const h=window.NET.HOSTS[args[0]];
      if(!h){ out("scan: unknown host '"+args[0]+"'.","c-red"); return; }
      if(!window.NET.reachable(h.id) && !S.net.breached.has(h.id)){ out("scan: host not yet in range.","c-red"); return; }
      S.net.scanned.add(h.id);
      out(h.name+"  ("+h.ip+")","c-mag");
      out(h.desc,"c-muted");
      out("ports: "+h.ports.join(", "),"c-cyan");
      if(h.honeypot) out("⚠ zero historical traffic. uptime suspiciously exact. this smells like a trap.","c-red");
      window.GAME.fire("scan_"+h.id);
    },

    connect(args){
      if(!args[0]){ out("connect: usage: connect <host>   (try: hosts)","c-red"); return; }
      if(args[0]==="home"){
        S.net.chain=["home"]; S.net.currentHost="home"; S.cwd="/home/dedsec";
        out("back on your own terminal.","c-green"); refreshPrompt(); updateHostIndicator(); return;
      }
      const host=window.NET.HOSTS[args[0]];
      if(!host){ out("connect: unknown host '"+args[0]+"'. try `hosts`.","c-red"); return; }
      if(S.net.currentHost===host.id){ out("already connected to "+host.id+".","c-amber"); return; }
      const chk=window.NET.canConnect(host.id);
      if(!chk.ok){ out("connect: refused — "+chk.reason,"c-red"); return; }
      crackAnim(()=>{
        const wasBreached=S.net.breached.has(host.id);
        S.net.chain.push(host.id);
        S.net.currentHost=host.id;
        S.cwd="/";
        S.net.breached.add(host.id);
        out("connected to "+host.name+"  ("+host.ip+")","c-green");
        out(host.desc,"c-muted");
        refreshPrompt(); updateHostIndicator();
        window.Apps.renderNetwork && window.Apps.renderNetwork();
        if(!wasBreached) window.GAME.fire("breach_"+host.id);
        if(host.honeypot) window.NET.triggerHoneypot();
      });
    },

    disconnect(){
      if(S.net.chain.length<=1){ out("already at your own terminal.","c-amber"); return; }
      S.net.chain.pop();
      S.net.currentHost=S.net.chain[S.net.chain.length-1];
      S.cwd = S.net.currentHost==="home" ? "/home/dedsec" : "/";
      out("disconnected. now on "+S.net.currentHost+".","c-cyan");
      refreshPrompt(); updateHostIndicator();
      window.Apps.renderNetwork && window.Apps.renderNetwork();
    },

    tools(){
      if(!S.net.tools.size){ out("no tools unlocked yet.","c-amber"); return; }
      out("UNLOCKED TOOLS ──────────","c-mag");
      [...S.net.tools].forEach(t=>out(" ◆ "+t,"c-green"));
    },

    whoami(){
      out(S.handle+"  ::  DedSec operative  ::  rep "+S.rep,"c-green");
      out("current session: "+S.net.currentHost+(S.net.currentHost!=="home"?" (pivoted)":""),"c-muted");
      window.GAME.fire("whoami");
    },

    decrypt(args){
      if(!args[0]){ out("decrypt: usage: decrypt <file>","c-red"); return; }
      const host=S.net.currentHost;
      const cfs=curFS();
      const target=FS.normalize(S.cwd,expandPath(args[0]));
      const n=cfs.nodeAt(target);
      if(!cfs.isFile(n)){ out("decrypt: no such file: "+args[0],"c-red"); return; }
      if(!cfs.decrypted[target] && !n.content.includes("<<ENCRYPTED")){
        out("decrypt: "+args[0]+" is already plaintext.","c-amber"); return;
      }
      crackAnim(()=>{
        if(cfs.applyDecrypt(target)){
          out(cfs.read(target),"c-green");
          window.NET.runDecryptTrigger(host,target);
        } else out("decrypt: nothing to decrypt here.","c-amber");
      });
    },

    ssh(args){
      if(!args[0]){ out("ssh: usage: ssh <node>   (try: ssh node_master)","c-red"); return; }
      if(args[0]==="node_master"||args[0].includes("node_master")){
        out("auth node_master ... key c1tyruns0nus accepted.","c-green");
        out("escalated. encrypted ctOS payloads can now be cracked.","c-cyan");
      } else if(args[0]==="blend_guest"){
        out("auth blend_guest ... limited shell. not enough for the good files.","c-amber");
      } else out("ssh: "+args[0]+": connection refused (need recovered creds — check .secrets)","c-red");
    },

    ops(){ window.Apps.show("missions"); out("opening operations board...","c-muted"); },

    rep(){ out("REPUTATION: "+S.rep,"c-mag");
      out(S.rep<100?"a ghost. keep moving.":S.rep<400?"the cell knows your handle.":"the city knows your work.","c-muted"); },

    evidence(){
      if(!S.evidence.size){ out("evidence locker empty. go pull some truth.","c-amber"); return; }
      out("EVIDENCE LOCKER ("+S.evidence.size+") ────────","c-mag");
      [...S.evidence].forEach(e=>out(" ◉ "+e,"c-green"));
      const need = S.act===1 ? ["blend_memo","nudge_dataset","camera"] : ["exec_roster","backbone_logs","hive_plan"];
      if(need.every(t=>S.evidence.has(t))) out("full set for this act. open [ exposé_studio ] and go loud.","c-cyan");
    },

    neofetch(){
      out(
`      ▟█▙      ${S.handle}@dedsec
     ▟███▙     ───────────────
    ▟█▛ ▜█▙    OS      NetHack_OS 3.0
   ▟█▛   ▜█▙   host    liberated node
   ▜█▙   ▟█▛   kernel  glitch-6.6.6
    ▜█▙ ▟█▛    shell   dsh
     ▜███▛     rep     ${S.rep}
      ▜█▛      status  WE ARE LEGION`,"c-green");
    },

    clear(){ document.getElementById("term-output").innerHTML=""; },

    sudo(){ out("nice try. there is no root here — only the collective.","c-mag"); },

    exit(){ out("there is no logging out of the truth.","c-muted"); }
  };

  function crackAnim(done){
    const chars="▁▂▃▄▅▆▇█▓▒░#@%$&*01";
    let n=0; const id=setInterval(()=>{
      let s=""; for(let i=0;i<34;i++) s+=chars[Math.floor(Math.random()*chars.length)];
      out("cracking "+Math.min(100,n*10)+"% "+s,"c-dim");
      if(++n>5){ clearInterval(id); out("key recovered.","c-green"); done(); }
    },90);
  }

  function refreshPrompt(){ window.updatePrompt(); }

  window.runCommand=function(raw){
    const line=raw.trim();
    if(!line) return;
    const parts=line.split(/\s+/);
    const cmd=parts[0].toLowerCase();
    const args=parts.slice(1);
    if(CMDS[cmd]) CMDS[cmd](args);
    else out(cmd+": command not found. type `help`.","c-red");
  };
  window.shortCwd=shortCwd;
})();
