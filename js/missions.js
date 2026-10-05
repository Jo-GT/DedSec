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
    }
  ];

  window.OPS = OPS;
})();
