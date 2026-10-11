/* ============================================================
   DedSec // NetHack_OS  —  Act Two: the Blume corporate network
   A small Hacknet-style pivot graph: branching paths that
   converge on a heavily gated final target.
   ============================================================ */
(function(){
  const F = window.FS.F;

  const HOSTS = {
    entry_gw: {
      id:"entry_gw", name:"Blend Edge Gateway", ip:"10.66.0.1",
      requires:[], ports:["22/ssh","443/https"], honeypot:false,
      hint:"public-facing edge — the front door.",
      desc:"The gateway every Blend contractor touches first. Noisy, logged, but wide open."
    },
    honeypot: {
      id:"honeypot", name:"??? unknown relay", ip:"10.66.0.66",
      requires:["entry_gw"], ports:["443/https"], honeypot:true,
      hint:"unlisted relay, no DNS record.",
      desc:"Not on any org chart. Could be a forgotten box. Could be bait. Scan before you leap."
    },
    mail_relay: {
      id:"mail_relay", name:"Blume Mail Relay", ip:"10.66.1.14",
      requires:["entry_gw"], ports:["25/smtp","993/imap"], honeypot:false,
      hint:"corporate mail — gossip and routing info.",
      desc:"Every all-hands email and IT memo passes through here. Good for mapping the rest of the network."
    },
    vpn_proxy: {
      id:"vpn_proxy", name:"Contractor VPN Proxy", ip:"10.66.1.27",
      requires:["entry_gw"], ports:["1194/vpn"], honeypot:false,
      hint:"third-party contractor tunnel.",
      desc:"Rotating contractor sessions. Soft security — nobody expects contractors to be the threat."
    },
    hr_db: {
      id:"hr_db", name:"HR / People Ops DB", ip:"10.66.2.8",
      requires:["mail_relay"], ports:["5432/db"], honeypot:false,
      hint:"personnel + signing authority records.",
      desc:"Every exec who signed off on PROJECT HIVE is in here, with a timestamp."
    },
    cam_backbone: {
      id:"cam_backbone", name:"Camera Backbone", ip:"10.66.3.41",
      requires:["vpn_proxy"], ports:["8443/stream"], honeypot:false,
      hint:"aggregates the whole ctOS camera mesh.",
      desc:"Every camera feed DedSec has ever tapped routes back here before Blend resells it."
    },
    blume_core: {
      id:"blume_core", name:"Blume Central Ops", ip:"10.66.9.1",
      requires:["hr_db","cam_backbone"], needs:{tools:["bypass"],creds:["core_pass"]},
      ports:["22/ssh","443/https","5432/db"], honeypot:false,
      hint:"the real target. heavily gated.",
      desc:"Where PROJECT HIVE actually lives. Needs a firewall bypass key and a vault password to get in."
    }
  };

  const EDGES = [
    ["entry_gw","mail_relay"],["entry_gw","vpn_proxy"],["entry_gw","honeypot"],
    ["mail_relay","hr_db"],["vpn_proxy","cam_backbone"],
    ["hr_db","blume_core"],["cam_backbone","blume_core"]
  ];

  const POS = {
    entry_gw:{x:6,y:50}, honeypot:{x:24,y:12}, mail_relay:{x:30,y:36}, vpn_proxy:{x:30,y:66},
    hr_db:{x:58,y:20}, cam_backbone:{x:58,y:80}, blume_core:{x:86,y:50}
  };

  // ---- per-host filesystems ----
  const TREES = {
    entry_gw: { "/": {
      "readme.txt": F("BLEND EDGE GATEWAY\nAuthorized traffic only. All sessions logged.\n(you are definitely not supposed to be here)"),
      "etc": { "motd": F("Gateway uptime: 412d\nRoute table nominal.\nKnown pivots from here: mail_relay, vpn_proxy") }
    }},
    honeypot: { "/": {
      "welcome.txt": F("Nothing to see here. Totally real server. :)"),
      "data.db": F("<<ENCRYPTED>> run: decrypt /data.db")
    }},
    mail_relay: { "/": {
      "inbox": {
        "0001_allstaff.eml": F("FROM: comms@blume.corp\nSUBJECT: Town Hall Reminder\nMandatory all-hands Thursday. Catering sponsored by... themselves."),
        "0002_itops.eml": F("FROM: itops@blume.corp\nSUBJECT: VPN rotation\nContractor VPN creds rotate monthly. Proxy: vpn_proxy\nHR keeps its own access — ask them, not us.")
      },
      "relay.log": F("[relay] 40,112 msgs routed today\n[relay] PROJECT HIVE press kit held for review")
    }},
    vpn_proxy: { "/": {
      "sessions.txt": F("3 active contractor sessions.\nbackbone node: cam_backbone — bypass key stored there.")
    }},
    hr_db: { "/": {
      "readme.txt": F("HR / PEOPLE OPS DATABASE\nyou're in — might as well look around."),
      "vault": { "exec_roster.enc": F("<<ENCRYPTED>> run: decrypt /vault/exec_roster.enc") }
    }},
    cam_backbone: { "/": {
      "status.txt": F("CAMERA BACKBONE — 2,884 feeds aggregated\nfirewall bridge: ENABLED"),
      "keys": { "firewall_bypass.enc": F("<<ENCRYPTED>> run: decrypt /keys/firewall_bypass.enc") }
    }},
    blume_core: { "/": {
      "welcome.txt": F("BLUME CENTRAL OPS\nif you're reading this on an unrecognized session, you already know what this means."),
      "vault": { "hive_launch.enc": F("<<ENCRYPTED>> run: decrypt /vault/hive_launch.enc") }
    }}
  };

  const DECRYPTED = {
    honeypot: { "/data.db": "// DECRYPTED //\nIt's empty. It was always empty.\n[TRACE ALREADY IN PROGRESS — you're still here?]" },
    hr_db: { "/vault/exec_roster.enc":
`// DECRYPTED //
Exec roster + signing authority for PROJECT HIVE.
Core vault password recovered: hunter2-the-sequel
[CRED UNLOCKED: core_pass]
[EVIDENCE TAGGED: exec_roster]` },
    cam_backbone: { "/keys/firewall_bypass.enc":
`// DECRYPTED //
firewall_bypass.key loaded into toolkit.
[TOOL UNLOCKED: bypass]
[EVIDENCE TAGGED: backbone_logs]` },
    blume_core: { "/vault/hive_launch.enc":
`// DECRYPTED //
PROJECT HIVE — national rollout, T-minus 6 hours.
Same profiling engine as NUDGE, scaled to 40 cities.
Kill switch: none. Oversight: none. Again.
[EVIDENCE TAGGED: hive_plan]` }
  };

  const fsByHost = {};
  Object.keys(TREES).forEach(id=>{ fsByHost[id] = window.FS.makeFS(TREES[id], DECRYPTED[id]||{}); });

  const DECRYPT_TRIGGERS = {
    "home:/mnt/ctos_share/MEMO_internal_blend.enc": ()=>{
      window.GAME.fire("dec_memo"); window.GAME.addRep(40); window.GAME.addEvidence("blend_memo");
    },
    "home:/mnt/ctos_share/PROJECT_NUDGE/subjects.enc": ()=>{
      window.GAME.fire("dec_subj"); window.GAME.addRep(60); window.GAME.addEvidence("nudge_dataset");
    },
    "hr_db:/vault/exec_roster.enc": ()=>{
      window.GAME.fire("exec_roster"); window.GAME.addRep(50);
      unlockCred("core_pass"); window.GAME.addEvidence("exec_roster");
    },
    "cam_backbone:/keys/firewall_bypass.enc": ()=>{
      window.GAME.fire("backbone_key"); window.GAME.addRep(50);
      unlockTool("bypass"); window.GAME.addEvidence("backbone_logs");
    },
    "blume_core:/vault/hive_launch.enc": ()=>{
      window.GAME.fire("hive_plan"); window.GAME.addRep(80); window.GAME.addEvidence("hive_plan");
    }
  };

  function reachable(id){
    if(window.STATE.act<2) return false;
    const h=HOSTS[id];
    if(!h) return false;
    if(!h.requires.length) return true;
    return h.requires.some(r=>window.STATE.net.breached.has(r));
  }

  function canConnect(id){
    if(window.STATE.act<2) return {ok:false, reason:"no known route from your current position"};
    const h=HOSTS[id];
    if(!h) return {ok:false, reason:"unknown host"};
    if(!reachable(id)) return {ok:false, reason:"no route — breach a neighboring host first"};
    if(h.needs){
      const missing=[];
      (h.needs.tools||[]).forEach(t=>{ if(!window.STATE.net.tools.has(t)) missing.push("tool:"+t); });
      (h.needs.creds||[]).forEach(c=>{ if(!window.STATE.net.creds.has(c)) missing.push("cred:"+c); });
      if(missing.length) return {ok:false, reason:"missing "+missing.join(", ")};
    }
    return {ok:true};
  }

  function neighborsOf(id){
    const ids=new Set();
    EDGES.forEach(([a,b])=>{ if(a===id) ids.add(b); if(b===id) ids.add(a); });
    return [...ids].map(x=>HOSTS[x]).filter(Boolean);
  }

  function unlockTool(t){ window.STATE.net.tools.add(t); window.setStatus("// tool unlocked: "+t,"mag"); }
  function unlockCred(c){ window.STATE.net.creds.add(c); window.setStatus("// credential recovered: "+c,"mag"); }

  function runDecryptTrigger(host,path){
    const fn = DECRYPT_TRIGGERS[host+":"+path];
    if(fn) fn();
  }

  function hostFS(id){ return fsByHost[id]; }

  function triggerHoneypot(){
    window.termLine("");
    window.termLine("⚠ session fingerprinted. tracing...","c-red");
    window.GAME.addRep(-25);
    window.setStatus("// you tripped a honeypot — ctOS is tracing this session","red");
    setTimeout(()=>{
      const S=window.STATE;
      if(S.net.currentHost==="honeypot"){
        window.termLine("⚠ connection forcibly reset by remote host.","c-red");
        S.net.chain=S.net.chain.filter(h=>h!=="honeypot");
        if(!S.net.chain.length) S.net.chain=["home"];
        S.net.currentHost=S.net.chain[S.net.chain.length-1];
        S.cwd = S.net.currentHost==="home" ? "/home/dedsec" : "/";
        window.updatePrompt();
        window.Apps.renderNetwork && window.Apps.renderNetwork();
      }
    },3500);
  }

  window.NET = {
    HOSTS, EDGES, POS,
    reachable, canConnect, neighborsOf,
    unlockTool, unlockCred, runDecryptTrigger, hostFS, triggerHoneypot
  };
})();
