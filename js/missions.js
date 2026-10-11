/* ============================================================
   DedSec // NetHack_OS  —  operations (mission campaign)
   Each op has steps; steps complete when the engine fires a flag.
   ============================================================ */
(function(){
  const OPS = [
    {
      id:"onboard",
      title:"OP: WAKE UP",
      desc:"Learn the deck. Prove you can move without tripping ctOS.",
      reward:50,
      steps:[
        {id:"help",  text:"Run `help` to see your tools"},
        {id:"ls",    text:"`ls` your home directory"},
        {id:"cat",   text:"Read the manifesto: `cat manifesto.txt`"},
        {id:"whoami",text:"Confirm your identity: `whoami`"}
      ]
    },
    {
      id:"recon",
      title:"OP: GHOST THE GRID",
      desc:"Map the ctOS surveillance ring and pull recovered credentials.",
      reward:120,
      steps:[
        {id:"creds", text:"Find stored creds: `cat .secrets/keys.txt`"},
        {id:"scan",  text:"Open [ ctOS_scanner ] and hack a LIVE camera node"},
        {id:"mount", text:"Reach the shared drive: `cd /mnt/ctos_share` then `ls`"}
      ]
    },
    {
      id:"memo",
      title:"OP: PAPER TRAIL",
      desc:"Blend's board wrote down the quiet part. Decrypt it.",
      reward:160,
      steps:[
        {id:"dec_memo", text:"`decrypt /mnt/ctos_share/MEMO_internal_blend.enc`"},
        {id:"read_nudge",text:"Read PROJECT_NUDGE/overview.txt"}
      ]
    },
    {
      id:"nudge",
      title:"OP: THE NUDGE",
      desc:"14 million people profiled without consent. Get the dataset.",
      reward:240,
      steps:[
        {id:"profiler", text:"Open [ profiler ] and flag a profiled citizen"},
        {id:"dec_subj",  text:"`decrypt /mnt/ctos_share/PROJECT_NUDGE/subjects.enc`"}
      ]
    },
    {
      id:"expose",
      title:"OP: GO LOUD",
      desc:"Assemble every piece of evidence and broadcast the exposé citywide.",
      reward:500,
      steps:[
        {id:"collect", text:"Collect all 3 evidence tags (memo, dataset, camera)"},
        {id:"render",  text:"In [ exposé_studio ], build the timeline and RENDER"}
      ]
    },

    /* ---------------- ACT TWO ---------------- */
    {
      id:"aftershock",
      title:"OP: AFTERSHOCK",
      desc:"The exposé landed, but Blend didn't blink — PROJECT HIVE is already rolling out nationwide. Find their real network.",
      reward:120,
      steps:[
        {id:"tipoff",        text:"Read the tip-off: `cat ~/incoming/tipoff.txt`"},
        {id:"scan_net",      text:"Sweep for a way in: `scan`"},
        {id:"breach_entry_gw",text:"Breach the gateway: `connect entry_gw`"}
      ]
    },
    {
      id:"twopaths",
      title:"OP: TWO ROADS",
      desc:"Pick your way into Blend's inner network — or walk both.",
      reward:150,
      steps:[
        {id:"breach_mail_relay", text:"Breach the mail relay: `connect mail_relay`"},
        {id:"breach_vpn_proxy",  text:"Breach the contractor VPN proxy: `connect vpn_proxy`"}
      ]
    },
    {
      id:"hrshake",
      title:"OP: HR SHAKEDOWN",
      desc:"Pull personnel records tying executives to the cover-up.",
      reward:150,
      steps:[
        {id:"breach_hr_db",  text:"Pivot from the mail relay: `connect hr_db`"},
        {id:"exec_roster",   text:"Decrypt the roster: `decrypt /vault/exec_roster.enc`"}
      ]
    },
    {
      id:"backbone",
      title:"OP: EYES IN THE WALLS",
      desc:"The camera backbone is Blend's nervous system. Cut in and steal the key.",
      reward:150,
      steps:[
        {id:"breach_cam_backbone", text:"Pivot from the VPN proxy: `connect cam_backbone`"},
        {id:"backbone_key",        text:"Decrypt the bypass key: `decrypt /keys/firewall_bypass.enc`"}
      ]
    },
    {
      id:"honeypot_op",
      title:"OP: SALTED GROUND",
      desc:"Blend seeds its network with traps. Recon before you leap.",
      reward:60,
      steps:[
        {id:"scan_honeypot", text:"Scan the unknown relay before touching it: `scan honeypot`"}
      ]
    },
    {
      id:"corebreach",
      title:"OP: THE CORE",
      desc:"You've got the password and the bypass key. Finish it.",
      reward:300,
      steps:[
        {id:"breach_blume_core", text:"Connect to the core: `connect blume_core`"},
        {id:"hive_plan",         text:"Decrypt the launch order: `decrypt /vault/hive_launch.enc`"}
      ]
    },
    {
      id:"hivefinale",
      title:"OP: KILL THE HIVE",
      desc:"National rollout in hours. Build the second exposé and broadcast before PROJECT HIVE goes live.",
      reward:800,
      steps:[
        {id:"collect2", text:"Collect all 3 Act Two evidence clips"},
        {id:"render2",  text:"In [ exposé_studio ], build the timeline and RENDER again"}
      ]
    }
  ];

  window.OPS = OPS;
})();
