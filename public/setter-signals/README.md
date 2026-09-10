# Setter Signals & Set Map

A single-file, offline reference for a 5-1 team: setter hand signals, set trajectories, and a
hitter card for every set — where you start, when you go, where the ball will be, what pass it
needs, and what the fallback is. Front-row sets (1, Push 1, Back 1, 3/Shoot, 2, Back 2, 32/Rip, 4,
Hut, Go, 5, Red, Slide) and back-row attacks (A, B, Pipe, C, D, plus the BIC tempo modifier).

## Pick your role and rotation

The control at the top ("I am the Setter / Outside / Middle / Opposite") filters every view to the
sets that role hits. The setter sees everything. A hitter sees their balls only, their quiz covers
only those, and the detail card speaks to them ("Start", "Timing", "When"); for the setter the same
rows read "Hitter starts", "Hitter timing", "Call it when". Both choices are remembered on the device.

Next to it, **Rotation 1–6** sets where the setter is. Nothing about the 5-1 is typed in per set: the
app derives it from the lineup in service order (`SYSTEM.lineup`, setter serving from zone 1 in
rotation 1). In rotations 1–3 the setter is back row, so the opposite is front row and the 5, Red
and Back 2 are the opposite's balls. In rotations 4–6 the setter is front row: the 5 and Red have no
hitter and are switched off, the Back 2 becomes a middle running behind the setter (drawn from the
middle's start at centre, with the middle's start note and the 2 as its fallback), and the opposite
attacks the C and D from the back row. Outside and middle front-row balls, and the back-row outside's
A, B and Pipe, exist in every rotation; the libero plays for the back-row middle. The mini court shows
who is where, sets that are off in the current rotation are dimmed in the name strip, and each card
lists exactly which rotations run it and who hits it. The Checks tab verifies the derivation.

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
| Quiz | Signal → Set and Trajectory → Set, four choices, instant feedback, running score (saved in `localStorage`), and the same filters. |
| Checks | Every set is graded against explicit rules: where it lands, how high, who hits it, how it relates to neighbouring sets, takeoff placement, unique signals and calls, tempo versus physics, pass requirement versus tempo, fallback chains, and — importantly — whether the words in each note match the drawn data (outside the sideline, centre, zone, metres off the net, halfway to the antenna, behind the setter, second step, above the tape…). A spec sheet lists each set's landing spot, contact height, apex and hang time. |

## Filters

Every tab carries the same two controls, and they stay in step as you move between tabs:

- **Front row / Back row / Both** — a row toggle. Back row is the A, B, Pipe, C, D family (plus
  BIC); everything else is front row. A row with no sets for your role is greyed out. The Net view
  only draws front-row balls, so with Back row selected it points you to the Court and 3D views.
- **Tempo chips** — Minus, First, Second, Third. Tap one to hide that tempo, tap again to bring it
  back. The swatches on each chip are the colours of the sets inside it.

Nothing is filtered by set type (quick, outside, right side and so on). Those words survive only
as an internal colour family and in the data checks. The row toggle is remembered between visits.

Selection is shared across tabs. Keyboard: Tab to a path, card or spec row, Enter/Space to select, Esc to clear.

## On a phone

- The diagram sits near the top of every view; the row toggle spans the width and the tempo chips scroll sideways in one row.
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
after takeoff, so the card can say where the hitter is when the setter touches the ball.

The targets themselves follow the usual 5-1 references. The setter's target (`SETTER_X`) is right of
centre, 5.6 m from the left antenna, on the seam of zones 3 and 2. The 1 is set half a metre in front
of it, the Back 1 half a metre behind, the Push 1 about 1.4 m in front, the 2 about 0.8 m in front
and the Back 2 about 1.2 m behind. Pin sets (Go, Hut, 4, Red, 5) land 0.6 m inside the antenna, the
Slide about a metre inside the right antenna, the 3/Shoot and 32 in zone 3 (2.3 to 2.5 m from the
left antenna). Quicks are contacted half a metre off the net, flat balls 0.4 m, high balls 0.9 m.
Back-row balls are contacted 2.7 m off the net (2.5 m for a BIC) with the takeoff behind the 3-m line.

**Tempo is derived, not typed.** It is how far through the approach the hitter is at setter contact
(`WORLD.tempoPhases`): leaving the floor or already up is **minus tempo** (1, Push 1, Back 1);
planting is **first tempo** (3/Shoot, Slide, any BIC ball); mid-approach is **second tempo** (2,
Back 2, 32, Go, Red, A, B, Pipe, C, D); starting on the set is **third tempo** (Hut, 4, 5). The
filters, the legend, the quiz and the cards all classify by tempo and by row, never by set type. Raise or lower a set's `peak` and its
tempo class moves with it; the Checks tab confirms the named sets land where the game puts them. 

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
  approach: [{ x: -0.05, y: 0.36 }],  // where the hitter starts (court fractions; may sit just outside the sideline)
                                      // the takeoff is derived one broad-jump before the ball along the line of approach;
                                      // add routeShape: 'j' and turn: {x,y} for a Slide-style J route, jump: metres to override
  startNote: 'Outside the left sideline, level with the 3-m line.',
  useWhen: 'Perfect pass and their left-side blocker is late.',
  avoidWhen: 'Any pass off the net.',
  fallback: 'hut',                    // the set the SAME hitter runs when the pass is off (or null = always on);
                                      // it may not need a better pass, and the chain must end at an always-on ball
  timingNote: '…',                    // optional: overrides the derived timing sentence
  netView: { landX: 0.03, peak: 0.40, flat: true },     // side view
  courtView: { x: 0.03, y: 0.08 } }                      // top-down
```

- **Rename a set / change its signal:** edit `name`, `aliases`, `signal.glyph`, `signal.description`, `coachingNote`. There is no tempo field: tempo comes from the physics. `glyph` can be an emoji (☝️ ✌️ 🖐️ ✊ 🤙) or short text ("3", "A"); text is drawn large in the set's colour.
- **Move a set on the net:** `netView.landX` is 0 (left antenna) → 1 (right antenna); `peak` is 0 → 1 where 1 is the height of a 4 or 5; `flat: true` draws a pushed, dashed, low ball. Optional `label: { at: 'apex' | 'band', dx, dy }` nudges the label (units are font sizes) if two labels collide after your edits. Optional `run: { from, to, takeoff }` draws a dotted ground path for a running hitter (used by the Slide).
- **Move a set on the court:** `courtView.x` is left sideline → right sideline, `y` is net → end line, both 0 → 1. Every set has an `approach: [start]` point; the takeoff and the jump onto the ball are derived, so the route always ends at the ball, and the Checks tab verifies it lands just off the net (front row) or behind the 3-m line (back row). Back-row sets also declare `zones`; front-row zones are derived from `x`.
- **Who hits it:** `hitter` is `OH`, `MB` or `OPP`. Everything rotation-specific is derived from it and from where the ball lands: an OPP front-row ball that lands short of the antenna (the Back 2) is automatically a middle's ball when the opposite is back row; an OPP pin ball is off then. Change `SYSTEM.lineup` only if your service order differs.
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
