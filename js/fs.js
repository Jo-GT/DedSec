/* ============================================================
   DedSec // NetHack_OS  —  simulated filesystem
   A plain in-memory tree. Dirs are objects, files are strings.
   ============================================================ */
(function(){
  const F = (content)=>({__file:true, content});

  const tree = {
    "/": {
      "home": {
        "dedsec": {
          "readme.txt": F(
`// WELCOME TO THE COLLECTIVE //

You just jacked into NetHack_OS, DedSec's member terminal.
This machine is yours now. Blend Software gave the city ctOS.
We give it back to the people.

First time? Run:  help
See your jobs:     ops   (or open the [ ops ] app up top)
Look around:       ls   then   cat manifesto.txt

They watch everyone. We watch them.
- 0rphan (your cell contact)`),
          "manifesto.txt": F(
`DEDSEC MANIFESTO  ///  draft 7

They sold the city a brain and called it convenience.
ctOS sees your face, your phone, your spending, your fears,
then sells the prediction back to whoever pays.

We are not thieves. We are the leak in the dam.
Every file we pull is a person who gets to see the cage.

Rule 1: expose, don't exploit.
Rule 2: the people are not targets. ctOS is.
Rule 3: when in doubt, make it public.`),
          "contacts.db": F(
`0rphan      :: cell handler         :: trust 100
Wrench_ish  :: hardware / drones     :: trust 88   [handle anonymized]
Sitara_ish  :: art & signal          :: trust 92   [handle anonymized]
Josh_ish    :: deep code             :: trust 95   [handle anonymized]
--- all identities compartmentalized. do not deanonymize cell members. ---`),
          "notes": {
            "todo.md": F(
`- [ ] decrypt the Blend internal memo (need creds from a node)
- [ ] map the ctOS surveillance ring downtown
- [ ] find out what "PROJECT NUDGE" is
- [ ] assemble the exposé. make it undeniable.`),
            "scratch.txt": F("password ideas are in .secrets ... obviously don't store these here lol")
          },
          ".secrets": {
            "keys.txt": F(
`# recovered during recon — use with  decrypt  /  ssh
blend_guest : hunter2control
node_master : c1tyruns0nus
# the good stuff is behind node_master`)
          }
        }
      },
      "mnt": {
        "ctos_share": {
          "MEMO_internal_blend.enc": F("<<ENCRYPTED>> run: decrypt /mnt/ctos_share/MEMO_internal_blend.enc"),
          "camera_index.csv": F(
`node_id,location,status
CAM-0012,Marina Transit Hub,LIVE
CAM-0031,Civic Plaza,LIVE
CAM-0044,Blend HQ Lobby,RESTRICTED
CAM-0088,Pier 27,LIVE`),
          "PROJECT_NUDGE": {
            "overview.txt": F(
`PROJECT NUDGE — CONFIDENTIAL — BLEND SOFTWARE
Objective: use ctOS predictive profiles to "nudge" civic behavior
via targeted feed manipulation, pricing, and routing.
Consent: not sought. Oversight: none.
Full dataset: ./subjects.enc  (encrypted — node_master)`),
            "subjects.enc": F("<<ENCRYPTED node_master>> run: decrypt /mnt/ctos_share/PROJECT_NUDGE/subjects.enc")
          }
        }
      },
      "var": { "log": { "access.log": F("[ctOS] 14,882,301 profiles active\n[ctOS] facial match confidence avg 0.981\n[ctOS] feed-nudge module: ONLINE") } }
    }
  };

  // decrypted replacements, revealed by `decrypt`
  const decrypted = {
    "/mnt/ctos_share/MEMO_internal_blend.enc":
`// DECRYPTED //  FROM: VP Strategy  TO: Board
"ctOS adoption is past the point of civic reversal. Even if the
public understood the profiling, the city cannot function without
us now. Recommend we stop answering FOIA requests. — M."
[EVIDENCE TAGGED: blend_memo]`,
    "/mnt/ctos_share/PROJECT_NUDGE/subjects.enc":
`// DECRYPTED //  14,882,301 citizen profiles.
Each row: face hash, home cluster, predicted vote, debt score,
"nudgeability" index. This was never anonymized.
[EVIDENCE TAGGED: nudge_dataset]`
  };

  // ---- path helpers ----
  function normalize(cwd, path){
    if(!path) return cwd;
    let abs = path.startsWith("/") ? path : (cwd === "/" ? "/"+path : cwd+"/"+path);
    const parts = abs.split("/").filter(Boolean);
    const stack = [];
    for(const p of parts){
      if(p===".") continue;
      if(p===".."){ stack.pop(); continue; }
      stack.push(p);
    }
    return "/"+stack.join("/");
  }
  function nodeAt(path){
    if(path==="/") return tree["/"];
    const parts = path.split("/").filter(Boolean);
    let cur = tree["/"];
    for(const p of parts){
      if(cur && typeof cur==="object" && !cur.__file && p in cur) cur = cur[p];
      else return null;
    }
    return cur;
  }
  function isFile(n){ return n && n.__file===true; }
  function isDir(n){ return n && typeof n==="object" && !n.__file; }

  window.FS = {
    tree, decrypted, normalize, nodeAt, isFile, isDir,
    read(path){ const n=nodeAt(path); if(isFile(n)) return n.content; return null; },
    list(path){ const n=nodeAt(path); if(!isDir(n)) return null;
      return Object.keys(n).map(k=>({name:k, dir:isDir(n[k])})); },
    applyDecrypt(path){
      const n = nodeAt(path);
      if(isFile(n) && decrypted[path]){ n.content = decrypted[path]; return true; }
      return false;
    }
  };
})();
