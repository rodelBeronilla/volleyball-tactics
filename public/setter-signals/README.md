# Setter Signals & Set Map

A single-file, offline reference for a 5-1 team: setter hand signals, set trajectories, and a
hitter card for every set — where you start, when you go, where the ball will be, what pass it
needs, and what the fallback is. Front-row sets (1, Push 1, Back 1, 3/Shoot, 2, Back 2, 32/Rip, 4,
Hut, Go, 5, Red, Slide) and back-row attacks (A, B, Pipe, C, D, plus the BIC tempo modifier).

## Pick your role

The control at the top ("I am the Setter / Outside / Middle / Opposite") filters every view to the
sets that role hits. The setter sees everything. A hitter sees their balls only, their quiz covers
only those, and the detail card speaks to them ("Start", "Timing", "When"); for the setter the same
rows read "Hitter starts", "Hitter timing", "Call it when". The choice is remembered on the device.

## Open it

- **Phone:** send `index.html` to a player (AirDrop, text, email attachment). Opening it launches the browser; no internet needed.
- **Desktop:** double-click `index.html`, or drag it into a browser window.
- **Hosted:** this folder lives in `public/`, so the main site deploy also serves it at `/volleyball-tactics/setter-signals/`.

No build step, no frameworks, no CDNs. Everything (CSS, JS, SVG) is inline.

## Views

| Tab | What it shows |
| --- | --- |
| 3D Court | A real 9 × 9 m half court in perspective. Every ball is a gravity parabola from the setter's hands to the hitter's contact point, with a dotted ground shadow and a drop line so depth is unambiguous. Drag to orbit; Coach / Corner / Blockers / Top presets; BIC toggle; men's or women's net height. ▶ plays the ball in real hang time (or ½ speed). |
| Diagrams | The two flat views. **Net** is the side view: height and landing spot tell sets apart. **Court** is top-down: front-row landing spots along the net, back-row attacks with start point, dotted approach, takeoff behind the 3 m line and set target; tap a zone number to highlight sets landing there. |
| Signals | Card per set: glyph, name, signal description, tempo/hitter chips. Tap to select, then "Show in 3D" / "Show on net" / "Show on court". |
| Quiz | Signal → Set and Trajectory → Set, four choices, instant feedback, running score (saved in `localStorage`), optional group filter. |
| Checks | Every set is graded against explicit rules: where it lands, how high, who hits it, how it relates to neighbouring sets, takeoff placement, unique signals and calls, tempo versus physics, pass requirement versus tempo, fallback chains, and — importantly — whether the words in each note match the drawn data (outside the sideline, centre, zone, metres off the net, halfway to the antenna, behind the setter, second step, above the tape…). A spec sheet lists each set's landing spot, contact height, apex and hang time. |

Selection is shared across tabs. Keyboard: Tab to a path, card or spec row, Enter/Space to select, Esc to clear.

## On a phone

- The diagram sits near the top of every view; filter chips scroll sideways in one row.
- Under each diagram a scrolling strip of set names selects a set precisely, which is easier than tapping a thin arc.
- In the 3D view, swipe sideways to orbit, swipe up or down to scroll the page, pinch to zoom, and use the floating camera buttons for the preset angles. The blue ▶ button on the scene plays the selected set.
- The detail sheet slides up from the bottom. Tap the grey handle to collapse it to a peek (name + actions), swipe down to collapse and then close, swipe up to expand.
- Add it to the home screen (Share → Add to Home Screen on iOS, Install on Android) and it opens full-screen like an app.

## The hitter card

Select any set and the card shows, in order: the coaching line; the signal and whether the setter
signals it or the hitter calls it (and what they say); where the hitter starts; timing at setter
contact with a bar showing the approach, the takeoff and the ball's flight on one clock; where the
ball is contacted in metres; the pass it needs; when to use it and when not to; the fallback set
(tap it to jump); and a 5-1 note where the rotation matters. ▶ plays the whole sequence in real
time: the hitter's route, the pass arriving, the set, and the jump meeting the ball.

## The flight model

Heights in the side view are relative (`peak` 0 → 1). The 3D view and the Checks tab turn them into
metres with the constants in `WORLD` (just below `SETS`): net height, where the setter releases the
ball, how far above the tape a hitter contacts it, and how high a `peak = 1` ball goes. Hang time comes
from gravity alone, so a 1 hangs about 0.5 s and a 4 about 1.5 s. Hitter timing follows from it:
a full approach takes `WORLD.approachSec` (1.1 s) and the ball is met `WORLD.riseSec` (0.35 s)
after takeoff, so the card can say where the hitter is when the setter touches the ball. Tempo bands (1st < 0.85 s, 2nd
0.85–1.45 s, 3rd above) are in `WORLD.tempoBands`; the Checks tab warns when a set's declared `tempo`
disagrees with its physics.

## Editing the `SETS` array

Open `index.html` in any text editor and find `const SETS = [` near the top of the `<script>`.
Every view (net, court, cards, quiz) renders from this one array. Each set is one object:

```js
{ id: 'go',                       // unique key, letters/numbers only
  name: 'Go',                     // label shown everywhere
  aliases: ['Quick outside'],     // other names your team uses (shown on the card)
  group: 'outside',               // quick | medium | outside | rightside | backrow
  color: '#a3e635',               // path / dot / card colour
  tempo: '1st',                   // 1st | 2nd | 3rd  (also sets the animation speed)
  hitter: 'OH',                   // MB | OH | OPP | Back row
  signal: { glyph: 'Go', description: '"Gun" with index + middle finger and thumb' },
  coachingNote: 'Flat and fast to the antenna — …',
  call: 'Go', how: 'both',            // how: signal (setter's hand) | call (hitter shouts it) | both
  pass: 'perfect',                    // perfect | good | any — the pass it needs
  approach: [{ x: 0.03, y: 0.42 }, { x: 0.07, y: 0.12 }],   // hitter's start → takeoff, court fractions
  startNote: 'Outside the left sideline, level with the 3-m line.',
  useWhen: 'Perfect pass and their left-side blocker is late.',
  avoidWhen: 'Any pass off the net.',
  fallback: 'hut',                    // the set the SAME hitter runs when the pass is off (or null = always on);
                                      // it may not need a better pass, and the chain must end at an always-on ball
  note51: '…',                        // optional: what changes with the setter front / back row
  timingNote: '…',                    // optional: overrides the derived timing sentence
  netView: { landX: 0.03, peak: 0.40, flat: true },     // side view
  courtView: { x: 0.03, y: 0.08 } }                      // top-down
```

- **Rename a set / change its signal:** edit `name`, `aliases`, `signal.glyph`, `signal.description`, `coachingNote`. `glyph` can be an emoji (☝️ ✌️ 🖐️ ✊ 🤙) or short text ("3", "A"); text is drawn large in the set's colour.
- **Move a set on the net:** `netView.landX` is 0 (left antenna) → 1 (right antenna); `peak` is 0 → 1 where 1 is the height of a 4 or 5; `flat: true` draws a pushed, dashed, low ball. Optional `label: { at: 'apex' | 'band', dx, dy }` nudges the label (units are font sizes) if two labels collide after your edits. Optional `run: { from, to, takeoff }` draws a dotted ground path for a running hitter (used by the Slide).
- **Move a set on the court:** `courtView.x` is left sideline → right sideline, `y` is net → end line, both 0 → 1. Every set has an `approach: [start, takeoff]` route; the takeoff must sit next to the ball (front row) or behind the 3-m line (back row), and the Checks tab enforces both. Back-row sets also declare `zones`; front-row zones are derived from `x`.
- **Who hits it:** `hitter` is `OH`, `MB` or `OPP` and drives the role filter. In a 5-1, A, B and Pipe belong to the back-row outside and C and D to the back-row opposite.
- **Add a set:** copy any object, give it a new `id`, and it appears in every view and in the quiz automatically.
- **Remove a set:** delete its object.
- **Modifiers** (like BIC) have `modifier: true` and no `netView`/`courtView`; they appear on the Signals tab and in the Signal → Set quiz only.
- Group labels and hints live in the small `GROUPS` array just below `SETS`.

Save the file and reload the page, then open the **Checks** tab: it re-grades the data and names
exactly which set broke which rule. If you reword a note, the "Notes agree with the geometry" rule
re-reads it: write "outside the left sideline" and the route had better start there. Rules about specific named sets (4 above Hut, Back 1 mirrors the 1,
Slide has a run, and so on) look sets up by `id` and simply pass when that id is gone, so renaming or
removing a set never breaks the page. To add a rule, append an object to the `RULES` array.
If the browser console shows an error after editing, it is almost always a missing comma or quote in
the object you changed.
