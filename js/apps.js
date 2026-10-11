/* ============================================================
   DedSec // NetHack_OS  —  GUI apps + shared game STATE
   ============================================================ */
(function(){
  const STATE = {
    handle:"recruit",
    cwd:"/home/dedsec",
    rep:0,
    act:1,                        // 1 = NUDGE exposé, 2 = HIVE network/finale
    evidence:new Set(),          // "blend_memo","nudge_dataset","camera","exec_roster","backbone_logs","hive_plan"
    opProgress:{},               // opId -> Set of completed stepIds
    hackedNodes:new Set(),
    flaggedCitizen:false,
    timeline:[],
    finished:false,
    net:{
      currentHost:"home",
      chain:["home"],            // pivot stack, for disconnect
      breached:new Set(),
      scanned:new Set(),
      tools:new Set(),
      creds:new Set()
    }
  };
  window.STATE = STATE;

  const EVIDENCE_ITEMS = [
    {tag:"blend_memo",   label:"CLIP: Blend board memo — 'stop answering FOIA'", act:1},
    {tag:"nudge_dataset",label:"CLIP: 14.8M profiles — PROJECT NUDGE dataset",   act:1},
    {tag:"camera",       label:"CLIP: ctOS camera intercept — faces sold to brokers", act:1},
    {tag:"exec_roster",  label:"CLIP: Blume exec roster — signing authority on HIVE", act:2},
    {tag:"backbone_logs",label:"CLIP: camera backbone logs — feeds exported to HIVE nodes", act:2},
    {tag:"hive_plan",    label:"CLIP: PROJECT HIVE launch order — national rollout", act:2}
  ];

  // ---------- event bus ----------
  const bus = {};
  window.GAME = {
    fire(step){                  // mark a mission step id complete
      for(const op of window.OPS){
        if(op.steps.some(s=>s.id===step)){
          STATE.opProgress[op.id] = STATE.opProgress[op.id] || new Set();
          if(!STATE.opProgress[op.id].has(step)){
            STATE.opProgress[op.id].add(step);
            checkOpComplete(op);
            Apps.renderMissions();
          }
        }
      }
    },
    addRep(n){ STATE.rep=Math.max(0,STATE.rep+n); document.getElementById("tb-rep").textContent="REP: "+STATE.rep; },
    addEvidence(tag){
      if(!STATE.evidence.has(tag)){
        STATE.evidence.add(tag);
        window.setStatus("// evidence secured: "+tag,"mag");
        if(["blend_memo","nudge_dataset","camera"].every(t=>STATE.evidence.has(t))) window.GAME.fire("collect");
        if(["exec_roster","backbone_logs","hive_plan"].every(t=>STATE.evidence.has(t))) window.GAME.fire("collect2");
        Apps.renderEvidence();
      }
    },
    say(msg,cls){ window.setStatus(msg,cls); }
  };

  const awarded = new Set();
  function checkOpComplete(op){
    const done = STATE.opProgress[op.id];
    if(done && done.size>=op.steps.length && !awarded.has(op.id)){
      awarded.add(op.id);
      window.GAME.addRep(op.reward);
      window.setStatus("// OP COMPLETE: "+op.title+"  (+"+op.reward+" rep)","green");
      window.termLine && window.termLine("\n[ "+op.title+" COMPLETE ] +"+op.reward+" rep — stay loud.","c-magenta");
    }
  }

  // ---------- ctOS scanner data ----------
  const NODES = [
    {id:"CAM-0012",name:"Marina Transit Hub",type:"CCTV",status:"LIVE",
     data:"3,112 faces/hr matched. Commuter routes logged and sold to 4 ad brokers."},
    {id:"CAM-0031",name:"Civic Plaza",type:"CCTV",status:"LIVE",
     data:"Protest-attendance predictor active. Flags repeat demonstrators to BLEND."},
    {id:"TRAFFIC-07",name:"5th & Mission Signals",type:"TRAFFIC",status:"LIVE",
     data:"ctOS reroutes 'low-value' neighborhoods to clear exec commute lanes."},
    {id:"ATM-229",name:"Downtown ATM Cluster",type:"FINANCE",status:"LIVE",
     data:"Skims spend patterns to compute debt-stress scores for PROJECT NUDGE."},
    {id:"CAM-0044",name:"Blend HQ Lobby",type:"CCTV",status:"RESTRICTED",
     data:"Interior feed. Captures badge creds for node_master escalation."},
    {id:"BILLBOARD-3",name:"Pier 27 Smart Sign",type:"DISPLAY",status:"LIVE",
     data:"Hijackable broadcast surface — perfect for the exposé drop."}
  ];

  const Apps = {
    current:"terminal",
    show(name){
      document.querySelectorAll(".app").forEach(a=>a.classList.remove("active"));
      const el=document.getElementById("app-"+name);
      if(el) el.classList.add("active");
      document.querySelectorAll(".tb-item").forEach(t=>t.classList.toggle("on",t.dataset.app===name));
      this.current=name;
      if(name==="ctos")this.renderCtos();
      if(name==="network")this.renderNetwork();
      if(name==="profiler")this.renderProfiler();
      if(name==="missions")this.renderMissions();
      if(name==="editor"){this.renderEvidence();this.renderTimeline();}
      if(name==="terminal")setTimeout(()=>document.getElementById("term-input").focus(),30);
    },

    renderCtos(){
      const g=document.getElementById("ctos-grid"); g.innerHTML="";
      NODES.forEach(n=>{
        const d=document.createElement("div");
        d.className="node"+(STATE.hackedNodes.has(n.id)?" hacked":"");
        d.innerHTML=`<div class="nt">${n.type}</div><div class="nn">${n.id}</div>
          <div class="nn">${n.name}</div>
          <div class="ns">${STATE.hackedNodes.has(n.id)?"◉ INTERCEPTED":n.status}</div>`;
        d.onclick=()=>this.hackNode(n);
        g.appendChild(d);
      });
    },
    hackNode(n){
      const det=document.getElementById("ctos-detail");
      if(!STATE.hackedNodes.has(n.id)){
        STATE.hackedNodes.add(n.id);
        if(n.status==="LIVE"||n.status==="RESTRICTED"){
          window.GAME.fire("scan");
          window.GAME.addRep(15);
          window.GAME.addEvidence("camera");
        }
      }
      det.innerHTML=`<span class="c-mag">◉ ${n.id} // ${n.name}</span>\n`+
        `<span class="c-muted">type ${n.type} · status ${n.status}</span>\n\n`+
        `> intercepting datastream...\n> ${n.data}\n\n`+
        `<span class="c-green">[+15 rep · stream mirrored to evidence locker]</span>`;
      this.renderCtos();
    },

    renderNetwork(){
      const graph=document.getElementById("net-graph");
      if(!graph) return;
      graph.innerHTML="";
      const svgNS="http://www.w3.org/2000/svg";
      const svg=document.createElementNS(svgNS,"svg");
      svg.setAttribute("class","net-edges");
      svg.setAttribute("preserveAspectRatio","none");
      window.NET.EDGES.forEach(([a,b])=>{
        const pa=window.NET.POS[a], pb=window.NET.POS[b];
        const line=document.createElementNS(svgNS,"line");
        line.setAttribute("x1",pa.x+"%"); line.setAttribute("y1",pa.y+"%");
        line.setAttribute("x2",pb.x+"%"); line.setAttribute("y2",pb.y+"%");
        const active=STATE.net.breached.has(a)&&STATE.net.breached.has(b);
        line.setAttribute("class","net-edge"+(active?" active":""));
        svg.appendChild(line);
      });
      graph.appendChild(svg);

      Object.values(window.NET.HOSTS).forEach(h=>{
        const pos=window.NET.POS[h.id];
        const breached=STATE.net.breached.has(h.id);
        const reach=window.NET.reachable(h.id);
        const here=STATE.net.currentHost===h.id;
        const known=breached||reach;
        const node=document.createElement("div");
        node.className="net-node"+(breached?" breached":reach?" reachable":" locked")+(here?" here":"")+(h.honeypot&&known?" honeypot-known":"");
        node.style.left=pos.x+"%"; node.style.top=pos.y+"%";
        node.innerHTML=`<div class="nn-id">${known?h.id:"???"}</div><div class="nn-ip">${known?h.ip:"?.?.?.?"}</div>`;
        node.onclick=()=>this.showNetDetail(h.id);
        graph.appendChild(node);
      });
    },
    showNetDetail(id){
      const h=window.NET.HOSTS[id];
      const det=document.getElementById("net-detail");
      const breached=STATE.net.breached.has(id);
      const reach=window.NET.reachable(id);
      if(!breached && !reach){
        det.innerHTML=`<span class="c-red">◉ ${id} // LOCKED</span>\n<span class="c-muted">no route yet — breach a neighboring host first.</span>`;
        return;
      }
      const chk=window.NET.canConnect(id);
      const actionLine = breached
        ? `<span class="c-green">[ already breached — \`connect ${id}\` to jump back ]</span>`
        : chk.ok
          ? `<span class="c-cyan">[ run: connect ${id} ]</span>`
          : `<span class="c-red">[ blocked — ${chk.reason} ]</span>`;
      det.innerHTML=`<span class="c-mag">◉ ${h.name}</span>  <span class="c-muted">${h.ip}</span>\n`+
        `<span class="c-muted">ports: ${h.ports.join(", ")}</span>\n\n${h.desc}\n\n${actionLine}`;
    },

    renderProfiler(){
      const feed=document.getElementById("profiler-feed");
      if(feed.dataset.init) return;
      feed.dataset.init="1";
      const first=["Dana","Marcus","Priya","Eli","Noor","Sam","Theo","Ava","Luis","Mira"];
      const tags=["barista","nurse","rideshare","teacher","student","clerk","welder","dev"];
      let i=0;
      const push=()=>{
        if(Apps.current!=="profiler"){return;}
        const nm=first[Math.floor(Math.random()*first.length)];
        const tg=tags[Math.floor(Math.random()*tags.length)];
        const debt=(Math.random()*90+5).toFixed(0);
        const nudge=(Math.random()).toFixed(2);
        const card=document.createElement("div");
        card.className="pf-card";
        card.innerHTML=`<div><div class="pf-name">${nm} · <span class="pf-tag">${tg}</span></div>
          <div class="pf-tag">face-hash #${Math.random().toString(16).slice(2,10)}</div></div>
          <div class="pf-val">debt-stress ${debt}%<br>nudgeability ${nudge}</div>
          <div class="pf-flag" style="cursor:pointer">[FLAG]</div>`;
        card.querySelector(".pf-flag").onclick=()=>{
          if(!STATE.flaggedCitizen){
            STATE.flaggedCitizen=true;
            window.GAME.fire("profiler");
            window.GAME.addRep(20);
          }
          card.querySelector(".pf-flag").textContent="[LOGGED AS EVIDENCE]";
          window.setStatus("// citizen profile saved — ctOS was mining them in real time","mag");
        };
        feed.prepend(card);
        while(feed.children.length>14) feed.removeChild(feed.lastChild);
      };
      for(let k=0;k<5;k++)push();
      setInterval(push,1800);
    },

    renderMissions(){
      const list=document.getElementById("missions-list"); list.innerHTML="";
      window.OPS.forEach(op=>{
        const done=STATE.opProgress[op.id]||new Set();
        const complete=done.size>=op.steps.length;
        const el=document.createElement("div");
        el.className="mission"+(complete?" done":"");
        el.innerHTML=`<div class="m-title">${op.title}${complete?'<span class="badge">✔ COMPLETE</span>':''}</div>
          <div class="m-desc">${op.desc}</div>
          <ul class="m-steps">${op.steps.map(s=>`<li class="${done.has(s.id)?"ok":""}">${s.text}</li>`).join("")}</ul>
          <div class="m-reward">reward: +${op.reward} rep</div>`;
        list.appendChild(el);
      });
      this.renderObjective();
    },

    renderObjective(){
      const body=document.getElementById("ow-body");
      if(!body) return;
      const active=window.OPS.find(op=>{
        const done=STATE.opProgress[op.id]||new Set();
        return done.size<op.steps.length;
      });
      if(!active){
        body.innerHTML=`<div class="ow-op-title">ALL OPS COMPLETE</div>
          <div class="ow-done">// no active objectives — broadcast when ready</div>`;
        return;
      }
      const done=STATE.opProgress[active.id]||new Set();
      const next=active.steps.find(s=>!done.has(s.id));
      body.innerHTML=`<div class="ow-op-title">${active.title}</div>
        <div class="ow-progress">${done.size}/${active.steps.length} steps · +${active.reward} rep</div>
        <div class="ow-step">&gt; ${next?next.text:"—"}</div>`;
    },

    renderEvidence(){
      const pool=document.getElementById("evidence-pool"); pool.innerHTML="";
      const items=EVIDENCE_ITEMS.filter(it=>it.act===STATE.act);
      items.forEach(it=>{
        const have=STATE.evidence.has(it.tag);
        const c=document.createElement("div");
        c.className="clip"+(have?"":" locked");
        c.textContent=have?it.label:"??? (locked — find this evidence)";
        if(have){
          c.draggable=true;
          c.ondragstart=e=>e.dataTransfer.setData("tag",it.tag);
          c.onclick=()=>this.addToTimeline(it.tag,it.label);
        }
        pool.appendChild(c);
      });
    },
    renderTimeline(){
      const tl=document.getElementById("timeline"); tl.innerHTML="";
      tl.ondragover=e=>e.preventDefault();
      tl.ondrop=e=>{e.preventDefault();const tag=e.dataTransfer.getData("tag");
        const item=EVIDENCE_ITEMS.find(it=>it.tag===tag);
        if(item) this.addToTimeline(tag,item.label);};
      STATE.timeline.forEach((t,i)=>{
        const c=document.createElement("div");
        c.className="clip"; c.textContent=(i+1)+". "+t.label;
        c.onclick=()=>{STATE.timeline.splice(i,1);this.renderTimeline();};
        tl.appendChild(c);
      });
    },
    addToTimeline(tag,label){
      if(!STATE.evidence.has(tag)) return;
      if(STATE.timeline.some(t=>t.tag===tag)) return;
      STATE.timeline.push({tag,label});
      this.renderTimeline();
    }
  };
  window.Apps=Apps;

  window.setStatus=function(msg,cls){
    const sb=document.getElementById("sb-msg");
    sb.textContent=msg;
    sb.style.color = cls==="mag"?"var(--magenta)":cls==="green"?"var(--green)":cls==="red"?"var(--red)":"var(--muted)";
  };

  // ---------- RENDER & BROADCAST ----------
  window.renderExpose=function(){
    const tl=STATE.timeline;
    const need = STATE.act===1
      ? ["blend_memo","nudge_dataset","camera"]
      : ["exec_roster","backbone_logs","hive_plan"];
    if(!need.every(t=>STATE.evidence.has(t))){
      window.setStatus("// you need all 3 current evidence clips before broadcasting","red"); return;
    }
    if(tl.length<need.length || !need.every(t=>tl.some(x=>x.tag===t))){
      window.setStatus("// drag all 3 current clips onto the timeline first","red"); return;
    }
    window.GAME.fire(STATE.act===1?"render":"render2");
    const ov=document.getElementById("overlay");
    const oc=document.getElementById("overlay-content");

    if(STATE.act===1){
      oc.innerHTML=
`<div class="c-mag glitch" style="font-size:20px;letter-spacing:3px">▶ BROADCAST LIVE — ctOS COMPROMISED</div>

<span class="c-green">Every smart sign, feed, and phone in the city just lit up with
your exposé. 14,882,301 people are seeing PROJECT NUDGE for the
first time. Blend's stock is a rumor now. The FOIA memo is a
headline. ctOS is still running —</span> <span class="c-mag">but nobody trusts it anymore.</span>

<span class="c-amber">   REP EARNED: ${STATE.rep}
   EVIDENCE BROADCAST: ${tl.length}/3
   STATUS: THE CITY IS AWAKE</span>

<span class="c-muted">"We didn't break the system. We just turned the lights on.
Welcome to DedSec, ${STATE.handle}. This was only op one."
  — 0rphan</span>

<span class="c-cyan">[ click anywhere to close · keep playing / explore the filesystem ]</span>`;
      ov.classList.remove("hidden");
      window.GAME.addRep(500);
      const audio=document.getElementById("expose-audio");
      audio.currentTime=0;
      audio.play().catch(()=>{});
      ov.onclick=()=>{
        ov.classList.add("hidden");
        audio.pause();
        audio.currentTime=0;
        STATE.act=2;
        STATE.timeline=[];
        window.FS.tree["/"].home.dedsec.incoming = { "tipoff.txt": window.FS.F(
`FROM: 0rphan
the broadcast worked — but Blend's already moving PROJECT HIVE to prod.
found a loose thread: edge gateway at 10.66.0.1 (entry_gw).
standard disclaimer: scan before you connect. not everything out there is what it looks like.`) };
        Apps.renderEvidence(); Apps.renderTimeline(); Apps.renderMissions();
        window.setStatus("// act one complete — PROJECT HIVE is already rolling. find Blend's real network.","mag");
      };
    } else {
      oc.innerHTML=
`<div class="c-mag glitch" style="font-size:20px;letter-spacing:3px">▶ PROJECT HIVE — ROLLOUT HALTED</div>

<span class="c-green">Forty cities just watched the launch order hit every feed Blume
owns. The exec roster is public. The backbone logs are public.
PROJECT HIVE doesn't have a kill switch —</span> <span class="c-mag">but nobody's switching it on now.</span>

<span class="c-amber">   REP EARNED: ${STATE.rep}
   NETWORK BREACHED: ${STATE.net.breached.size} hosts
   STATUS: ACT TWO COMPLETE</span>

<span class="c-muted">"You didn't just leak a memo this time. You walked into their
house and turned every light on at once. That's not hacking,
${STATE.handle}. That's a statement."
  — 0rphan</span>

<span class="c-cyan">[ click anywhere to close · the network stays open — keep exploring ]</span>`;
      ov.classList.remove("hidden");
      window.GAME.addRep(800);
      STATE.finished=true;
      const audio2=document.getElementById("expose-audio-2");
      audio2.currentTime=0;
      audio2.play().catch(()=>{});
      ov.onclick=()=>{
        ov.classList.add("hidden");
        audio2.pause();
        audio2.currentTime=0;
      };
    }
  };
})();
