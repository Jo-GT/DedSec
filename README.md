# DedSec // NetHack_OS

A fan-made hacker-collective terminal **game/simulation** inspired by the DedSec aesthetic.
You play a new recruit on DedSec's custom member OS: a simulated Linux terminal, a fake
filesystem full of leads, a ctOS surveillance scanner, a citizen profiler, and a campaign
of operations that build toward broadcasting an **exposé** that wakes the city up to ctOS.

> All art, text, and code here are original. This is an unofficial fan tribute — not
> affiliated with or endorsed by Ubisoft, and it does not use their actual logos/assets.

## Play

Just open `index.html` in any modern browser — no build step, no server needed.

```
# optional: serve it locally
python -m http.server 8080   # then visit http://localhost:8080
```

Boot → pick a handle → you're in.

## How it works

- **[ terminal ]** — type `help`. Working commands: `ls`, `cd`, `cat`, `tree`, `pwd`,
  `decrypt`, `ssh`, `whoami`, `scan`, `ops`, `evidence`, `rep`, `neofetch`, `clear`, …
  (↑/↓ for command history)
- **[ ctOS_scanner ]** — click surveillance nodes to intercept their datastreams.
- **[ profiler ]** — live-mined citizen feed; flag one as evidence.
- **[ ops ]** — your mission board. 5 operations, from onboarding to *GO LOUD*.
- **[ exposé_studio ]** — drag your 3 evidence clips onto the timeline, then RENDER
  to broadcast the leak citywide and finish the campaign.

## The campaign (no spoilers, mostly)

1. **WAKE UP** – learn the deck.
2. **GHOST THE GRID** – recon, recover creds (`cat .secrets/keys.txt`), hack a node.
3. **PAPER TRAIL** – `decrypt` Blend's internal memo.
4. **THE NUDGE** – uncover PROJECT NUDGE and pull the dataset.
5. **GO LOUD** – assemble everything and broadcast the exposé.

## Project layout

```
index.html      markup + app shell
styles.css      DedSec glitch/neon theme (scanlines, CRT vignette)
js/fs.js        simulated filesystem
js/missions.js  operation definitions
js/apps.js      GUI apps + shared game state + win screen
js/commands.js  Linux-ish command interpreter
js/terminal.js  terminal I/O engine
js/boot.js      boot sequence, login, wiring
```

*expose, don't exploit. the people are not targets. when in doubt, make it public.*
