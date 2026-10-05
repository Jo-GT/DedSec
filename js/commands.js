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
 ssh <node>        jack into a credentialed node
 scan              summary of the ctOS grid
 ops               list active operations
 rep               show your reputation
 evidence          show collected evidence
 clear             clear the screen
 manifesto         print the DedSec manifesto
 neofetch          system readout
 sudo <...>        ...you really think that works here?
──────────────────────────────────────────────────
 tip: the GUI apps up top ([ ctOS_scanner ], [ profiler ],
 [ ops ], [ exposé_studio ]) are part of the mission too.`,"c-dim");
      window.GAME.fire("help");
    },

    ls(args){
      const target = args[0] ? FS.normalize(S.cwd,args[0]) : S.cwd;
      const items = FS.list(target);
      if(!items){ out("ls: cannot access '"+(args[0]||target)+"': not a directory","c-red"); return; }
      if(!items.length){ out("(empty)","c-muted"); return; }
      const line = items.map(i=> i.dir ? `<span class="c-cyan">${i.name}/</span>` : `<span class="c-green">${i.name}</span>`).join("   ");
      out(line,null,true);
      if(target===S.cwd || (args[0]==="." )) window.GAME.fire("ls");
    },

    cd(args){
      if(!args[0]||args[0]==="~"){ S.cwd="/home/dedsec"; return refreshPrompt(); }
      const target=FS.normalize(S.cwd,args[0]);
      const n=FS.nodeAt(target);
      if(FS.isDir(n)){ S.cwd=target; refreshPrompt();
        if(target==="/mnt/ctos_share") window.GAME.fire("mount");
      }
      else out("cd: no such directory: "+args[0],"c-red");
    },

    pwd(){ out(S.cwd,"c-green"); },

    cat(args){
      if(!args[0]){ out("cat: missing file operand","c-red"); return; }
      const target=FS.normalize(S.cwd,args[0]);
      const data=FS.read(target);
      if(data===null){
        if(FS.isDir(FS.nodeAt(target))) out("cat: "+args[0]+": is a directory","c-red");
        else out("cat: "+args[0]+": no such file","c-red");
        return;
      }
      out(data);
      const base=target.split("/").pop();
      if(base==="manifesto.txt") window.GAME.fire("cat");
      if(target==="/home/dedsec/.secrets/keys.txt") window.GAME.fire("creds");
      if(target==="/mnt/ctos_share/PROJECT_NUDGE/overview.txt") window.GAME.fire("read_nudge");
    },

    manifesto(){ CMDS.cat(["/home/dedsec/manifesto.txt"]); },

    tree(){
      const lines=[];
      (function walk(path,prefix){
        const items=FS.list(path); if(!items) return;
        items.forEach((it,idx)=>{
          const last=idx===items.length-1;
          lines.push(prefix+(last?"└─ ":"├─ ")+(it.dir?it.name+"/":it.name));
          if(it.dir) walk(path==="/"?"/"+it.name:path+"/"+it.name, prefix+(last?"   ":"│  "));
        });
      })(S.cwd,"");
      out(shortCwd()+"/\n"+(lines.join("\n")||"(empty)"),"c-cyan");
    },

    whoami(){
      out(S.handle+"  ::  DedSec operative  ::  rep "+S.rep,"c-green");
      out("you are one node in a leaderless network. act like it.","c-muted");
      window.GAME.fire("whoami");
    },

    decrypt(args){
      if(!args[0]){ out("decrypt: usage: decrypt <file>","c-red"); return; }
      const target=FS.normalize(S.cwd,args[0]);
      const n=FS.nodeAt(target);
      if(!FS.isFile(n)){ out("decrypt: no such file: "+args[0],"c-red"); return; }
      if(!FS.decrypted[target] && !n.content.includes("<<ENCRYPTED")){
        out("decrypt: "+args[0]+" is already plaintext.","c-amber"); return;
      }
      crackAnim(()=>{
        if(FS.applyDecrypt(target)){
          out(FS.read(target),"c-green");
          if(target==="/mnt/ctos_share/MEMO_internal_blend.enc"){
            window.GAME.fire("dec_memo"); window.GAME.addRep(40); window.GAME.addEvidence("blend_memo");
          }
          if(target==="/mnt/ctos_share/PROJECT_NUDGE/subjects.enc"){
            window.GAME.fire("dec_subj"); window.GAME.addRep(60); window.GAME.addEvidence("nudge_dataset");
          }
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

    scan(){
      out("ctOS GRID SUMMARY ─────────────────","c-mag");
      out("6 nodes in range · "+S.hackedNodes.size+" intercepted","c-muted");
      out("open the [ ctOS_scanner ] app to intercept live datastreams.","c-dim");
    },

    ops(){ window.Apps.show("missions"); out("opening operations board...","c-muted"); },

    rep(){ out("REPUTATION: "+S.rep,"c-mag");
      out(S.rep<100?"a ghost. keep moving.":S.rep<400?"the cell knows your handle.":"the city knows your work.","c-muted"); },

    evidence(){
      if(!S.evidence.size){ out("evidence locker empty. go pull some truth.","c-amber"); return; }
      out("EVIDENCE LOCKER ("+S.evidence.size+"/3) ────────","c-mag");
      [...S.evidence].forEach(e=>out(" ◉ "+e,"c-green"));
      if(S.evidence.size>=3) out("full set. open [ exposé_studio ] and go loud.","c-cyan");
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
