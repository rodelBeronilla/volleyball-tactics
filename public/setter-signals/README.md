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

## Pass quality

Next to the rotation, **Pass** grades the pass by how far it lands from the setter's target, and
**going** says which way it went. A perfect pass is the setter's optimal position, and every grade
after it is a radius of error around that point: the landing spot is the grade's radius along the
chosen bearing (off the net, off-left, off-right, left, right, tight), so a good pass can never be
further than 1.5 m from target whichever way it goes, and bearings that would leave the court or
cross into another grade's ring are not offered. Perfect is within half a metre of target: the
setter jump-sets and the whole menu is on. Good is within 1.5 m: the setter moves to it and sets standing,
so the quicks and the flat pin balls (1, Push 1, Back 1, Go, Red, BIC) are off and the 2, 3, 32,
Back 2, Slide, Hut, 4, 5 and the back-row balls stay on. Off is within 3 m: the setter runs it down
and lofts a high ball, only the out-of-system balls (2, 4, 5) are on, and the 4 is starred as the
best call. Shank is anything further: whoever gets there bump-sets a high ball to a pin (4 or 5),
no middle ball. Or tap exactly where the pass lands: on the Court view, **📍 Place the pass** then tap the
court, and the 1.5 m and 3 m tolerance rings around the target show which grade you are in. Every view
draws the setter where the pass takes them, with a dotted run from the target, and ▶ shows the
setter run to the ball before the set. Sets that are off on the current pass stay in the name
strip, dimmed, with the reason; select one and the card says which ball to run instead. Flight
paths are recomputed from the new release point (lower and lofted the further off it is) and land
in the same place. Tempo classes and the Checks tab are always graded off a perfect pass.

## Serve receive and the setter's route

Every player has a serve-receive start and a transition route in every rotation, and all of it
is derived rather than typed. The formation is solved from the lineup: the libero and both
outsides pass (wings about 6 m off the net a third of the court in, the centre passer a half-step
deeper, a front-row outside a little shallower); the front-row middle and opposite hide at the net
in their own zone column; a back-row opposite tucks short at the attack line; the setter waits as
close to the target as the rule allows (at the net when front row, at the attack line when back
row). Then the seven overlap constraints of FIVB rule 7.4 (each front-row player nearer the net
than the back-row player in their column, each row in left-centre-right order, no diagonals)
push players until legal, the least important job giving way first: passers hold their depth, the
setter yields a little, hiders yield first. A back-row setter or opposite who has to be deeper
than a passer tucks into the near corner, and nobody tucked short stands in a passer's lane.

That reproduces the textbook 5-1 without per-rotation data: in rotation 1 the setter hides in
the right-back corner behind the right passer and has the long 5.6 m release; in rotation 2 they
stack at the attack line behind the opposite and run 2 m; in rotation 3 they start left of centre
behind the middle and run 3 m; in rotation 4 they start at the net just left of the middle; in
rotations 5 and 6 they are already at the target, and the back-row opposite tucks at the attack
line.

After the serve every player transitions: the setter to the ball, each hitter to the start of
their own always-on ball (the middle to centre 3 m off, the outside to outside the left sideline,
the opposite to the right sideline, a back-row outside to the A or Pipe nearest the lane they
passed in, a back-row opposite to the D), the libero stays home. Hiders and the setter release on
the serve; passers move once the ball is past them, the passer after passing; runs are at a
realistic speed and a hitter who is still on the way when their approach should begin merges into
it. The 3D and Court views draw the formation, every player's dotted route, the serve and the pass,
and the role bar says who passes and why the setter starts where they do. The Checks tab verifies
that every rotation is legal under all seven constraints, that the passers are the libero and both
outsides in the 5–7.5 m band, and it flags every transition that is still on the way when the
approach should begin (the front-row outside passing on the right in rotations 1 and 4 has an 8 m
route to the left pin and starts the approach inside; the card says so). The hitter card carries a
"Serve receive" row with the start, the lane or hiding spot, and the route.

▶ plays the whole rally by default: the opponent's serve (about a second in the air), the pass
(about 1.2 s, apex around 3.5 m) into the setter's hands, everyone releasing and transitioning,
then the set and the approach. "Set only" on the card shortens the clip to the set; ½ speed
doubles it. The side view starts at the pass, since it has no depth to show the serve.

On a phone the sheet collapses to its title and buttons when a clip plays and the page scrolls
so the whole scene sits above it; the Play button becomes ■ Stop, a tap anywhere on the scene
stops the clip, and any change of tab, set, rotation or pass stops it too. Markers are larger on
small screens and the camera buttons fade during playback.

## BIC, side by side

Selecting a back-row ball in 3D draws the other tempo of the same ball as a faint dashed ghost with
its hang time, and the card lists both ("Normal 1.13 s · 1.83 m", "BIC 0.80 s · 1.04 m, 0.33 s
faster") with a Show BIC toggle. The BIC signal card itself has "Pipe at BIC tempo in 3D". The BIC
is the back-row quick: a third of a second faster and almost a metre lower than the Pipe.

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
from gravity alone, so a 1 hangs about 0.35 s and a 4 about 1.5 s. Hitter timing follows from it:
the approach time is derived from the route (`WORLD.approach`): a hitter who starts outside the
sideline takes a full four-step approach (1.0 s); one who starts inside the court (a middle, or the
opposite on a Back 2) is already close and takes two or three steps (0.75 s); a back-row run is
1.2 s and the slide 1.0 s. The ball is met `WORLD.riseSec` (0.35 s) after takeoff, so the card can
say where the hitter is when the setter touches the ball.

Height and hang time are the same thing under gravity, so the ladder is anchored on measured set
flight times rather than on the feet-above-the-net figures coaching sites quote (which run high:
"10–12 ft" for a 4 would be a 1.6 s ball, slower than anything measured in elite play). The data:
in the Olympic men's finals of 2000 and 2021, quick sets flew 0.40–0.49 s from setter release to
hitter contact, and sets to the outside averaged 1.12 s (2000) and 0.97 s (2021). A Go is the fast
end of that outside range, a Hut the 2000 average, a 4 the slow tail. The Checks tab grades every
set on this ("Hang times match measured set flight times"):

| Set | Hang | Peak above the net | Reference |
| --- | --- | --- | --- |
| 1, Back 1 | 0.45 s | 0.49 m (1.6 ft) | measured quick 0.40–0.49 s; "1–2 ft" |
| Push 1 | 0.51 s | 0.56 m (1.8 ft) | same tempo as the 1 |
| 3 / Shoot (31) | 0.55 s | 0.61 m (2 ft), a foot off the net | "1–2 ft, a foot off the net" |
| Slide | 0.67 s | 0.79 m (2.6 ft) | "1–3 ft", one-foot takeoff |
| 2, Back 2, 32 | 0.79 s | 1.0 m (3.3 ft) | "2–3 ft" / "one metre", hitter on the second step |
| Go, Red | 0.88 s | 1.18 m (3.9 ft), flat | fast end of the outside range (0.97 s in 2021); "3–4 ft" |
| BIC | 0.80 s | 1.04 m (3.4 ft) | the back-row quick: lower and faster than a Pipe |
| Pipe, A, B, C, D | 1.13 s | 1.83 m (6 ft) | "about a metre above the antenna" |
| Hut | 1.12 s | 1.76 m (5.8 ft) | the 2000 outside average; hitter on the first step |
| 4, 5 | 1.33 s | 2.4 m (7.9 ft), a metre off the net | slow tail of the outside range; the out-of-system ball |

Those heights are for club-level hitters contacting the ball 0.35 m above the tape. Hitters who
reach higher meet the same ball higher up, so the **Club / College / Pro** control in the 3D view
keeps every hang time fixed and re-derives the heights for hitters reaching 0.35, 0.6 or 1.0 m
above the net (elite men spike-reach about 3.5 m on a 2.43 m net). At pro reach a 1 peaks about a
metre above the net and a 4 about 2.75 m.

## Sources, and how each was validated

Nothing here is taken from a single source on faith. Each quantity is cross-checked against the
gravity model, against the measured flight times, and against the other sources; the Checks tab
re-runs these cross-checks ("Source claims cross-check against physics and each other") and
records the claims that failed.

| Quantity | Source | Cross-check | Verdict |
| --- | --- | --- | --- |
| Set flight times | Olympic men's finals 2000 and 2021, 327 sets, video-timed (Papers on Anthropology, 2022): quick 0.40–0.49 s, sets to zone 4 averaged 1.12 s then 0.97 s | Physics: 0.45 s is a ball that barely rises above the hitter's contact; 1.1 s is a ball peaking about 1.75 m above the net. Both match how coaches describe a quick and a medium ball. Single study, elite men only. | Used as the anchor. Its weakest use is the 4, which is extrapolated as the slow tail (1.2–1.5 s). |
| Quick 1–2 ft, 31 1–2 ft, 2 "2–3 ft" or "one metre", Go 3–4 ft, Slide 1–3 ft | coaching sites (Improve Your Volley, Pakmen, Volleyball Expert, Coaching Volleyball) | All sit inside the measured flight-time bands at club reach | Accepted |
| Hut 8–10 ft, 4 10–12 ft | Improve Your Volley | 8–10 ft is a 1.35–1.5 s ball, 10–12 ft is 1.6 s+; both slower than the measured 2000 average for an ordinary outside set. Internally inconsistent with the same site's "fastest set 3–4 ft" | Rejected; Hut set to the measured 1.12 s, 4 to the slow tail |
| Go = 2nd-step, Hut and 5 = 1st-step or slower, 1 = 3rd/4th-step, Pipe and Bic = 2nd/3rd-step, D = 2nd-step | Gold Medal Squared, Volleyball World | Reproduced by the timing model with route-derived approach times | Accepted; these decide the tempo classes |
| Pipe "about a metre above the antenna", "traditional pipe two metres above the net" | Art of Coaching, Volleyball Hub Pro | Antenna tops 0.8 m above the net, so 1.8 m; hang 1.13 s sits in the measured band | Accepted (modern pipe) |
| Pipe "1.5–2 m off the net" | Sportplan | A back-row hitter must take off behind the 3 m line; with a half-metre broad jump the ball is met about 2.5–2.7 m off | Rejected as contact depth; 2.7 m used |
| Bic "lower, faster version of a Pipe", "the back-row quick" | Gold Medal Squared, Coaching Volleyball | A 2nd/3rd-step ball on a back-row run is about 0.8 s; a third of a second faster than the Pipe | Accepted |
| 31 "lands 4–5 ft in front of the setter" | Improve Your Volley | Contradicts the nine-zone numbering (zone 3 is 2–3 m from the left antenna, Coaching Volleyball). That description is what this app calls the Push 1 | Noted; 3/Shoot follows the zone numbering |
| Slide "2–3 ft behind the setter" | Improve Your Volley | Describes a short slide; the modern slide runs to the right antenna (NCAA) | Antenna slide used |
| Setter target 5 ft right of centre, 2–4 ft (3–5 ft) off the net | How to Coach Volleyball, Volleyballmag | Two independent sources agree | Accepted: 5.9 m from the left antenna, 0.9 m off |
| Approach times: full four-step ≈ 1.0–1.2 s, last two steps ≈ 0.6 s | spike biomechanics (four-step vs step-close studies) | Consistent with the model's 1.0 s full and 0.75 s short approach; uncertainty about ±0.2 s moves only the borderline classes (Hut, 32) | Accepted with that caveat |
| Rise to the ball 0.35 s | Physics: a 0.5 m jump peaks after 0.32 s; elite spike jumps 0.5–0.7 m | Consistent | Accepted |
| Hitter reach: elite men ≈ 3.5 m spike reach on a 2.43 m net, elite women ≈ 3.2 m on 2.24 | spike-jump biomechanics | About a metre above the net at the top level; a third of a metre at club level | Used for the Club / College / Pro levels |
| Net heights 2.43 / 2.24 m, court 9 × 9 m, 3 m line, nine 1 m zones along the net | FIVB rules, Coaching Volleyball | Rules | Accepted |

The targets themselves follow the usual 5-1 references. The setter's target (`SETTER_X`) is about
5 ft right of centre, 5.9 m from the left antenna, on the seam of zones 3 and 2. The 1 is set half
a metre in front of it, the Back 1 half a metre behind, the Push 1 about 1.3 m in front, the 2 about
0.7 m in front and the Back 2 about 1.1 m behind. Pin sets (Go, Hut, 4, Red, 5) land a metre inside
the antenna, the Slide about 1.4 m inside the right antenna, the 3/Shoot and 32 in zone 3 (2.3 to
2.5 m from the left antenna). Quicks are contacted half a metre off the net, flat balls a foot off,
the 2 about 0.6 m, a Hut 0.9 m and a high ball about a metre off. Back-row balls are contacted 2.7 m off the
net (2.5 m for a BIC) with the takeoff behind the 3-m line.

**Tempo is derived, not typed.** It is how far through the approach the hitter is at setter contact
(`WORLD.tempoPhases`): leaving the floor or already up is **minus tempo** (1, Push 1, Back 1);
planting is **first tempo** (3/Shoot, Slide); on the second step is **second tempo** (2, Back 2,
32, Go, Red, A, B, Pipe, C, D, and a BIC ball); on the first step or still waiting is **third
tempo** (Hut, 4, 5). This matches the common "2nd-step tempo" (Go, Red) and "1st-step or slower"
(Hut, 5) descriptions of those sets. The
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
