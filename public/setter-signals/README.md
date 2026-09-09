# Setter Signals & Set Map

A single-file, offline web app that teaches setter hand signals and set trajectories:
front-row sets (1, Push 1, Back 1, 3/Shoot, 2, Back 2, 32/Rip, 4, Hut, Go, 5, Red, Slide)
and back-row attacks (A, B, Pipe, C, D, plus the BIC tempo modifier).

## Open it

- **Phone:** send `index.html` to a player (AirDrop, text, email attachment). Opening it launches the browser; no internet needed.
- **Desktop:** double-click `index.html`, or drag it into a browser window.
- **Hosted:** this folder lives in `public/`, so the main site deploy also serves it at `/volleyball-tactics/setter-signals/`.

No build step, no frameworks, no CDNs. Everything (CSS, JS, SVG) is inline.

## Views

| Tab | What it shows |
| --- | --- |
| Net View | Side view of the net. Every path leaves the setter's hands; height and landing spot tell sets apart. Filter chips hide groups, tap a path to select, ▶ animates the ball (and the Slide's runner). |
| Court View | Top-down half court. Front-row landing spots along the net; back-row attacks with start point, dotted approach, takeoff behind the 3 m line, and set target. BIC toggle switches back-row styling. Tap a zone number to highlight sets landing there. |
| Signals | Card per set: glyph, name, signal description, tempo/hitter chips. Tap to select, then "Show on net" / "Show on court". |
| Quiz | Signal → Set and Trajectory → Set, four choices, instant feedback, running score (saved in `localStorage`), optional group filter. |

Selection is shared across tabs. Keyboard: Tab to a path or card, Enter/Space to select, Esc to clear.

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
  netView: { landX: 0.03, peak: 0.40, flat: true },     // side view
  courtView: { x: 0.03, y: 0.08 } }                      // top-down
```

- **Rename a set / change its signal:** edit `name`, `aliases`, `signal.glyph`, `signal.description`, `coachingNote`. `glyph` can be an emoji (☝️ ✌️ 🖐️ ✊ 🤙) or short text ("3", "A"); text is drawn large in the set's colour.
- **Move a set on the net:** `netView.landX` is 0 (left antenna) → 1 (right antenna); `peak` is 0 → 1 where 1 is the height of a 4 or 5; `flat: true` draws a pushed, dashed, low ball. Optional `label: { at: 'apex' | 'band', dx, dy }` nudges the label (units are font sizes) if two labels collide after your edits. Optional `run: { from, to, takeoff }` draws a dotted ground path for a running hitter (used by the Slide).
- **Move a set on the court:** `courtView.x` is left sideline → right sideline, `y` is net → end line, both 0 → 1. Back-row sets add `takeoff`, `start`, `zones` (which zone numbers light up when a zone is tapped) and an `approach: [start, takeoff]` dotted arrow. Front-row zones are derived from `x`.
- **Add a set:** copy any object, give it a new `id`, and it appears in every view and in the quiz automatically.
- **Remove a set:** delete its object.
- **Modifiers** (like BIC) have `modifier: true` and no `netView`/`courtView`; they appear on the Signals tab and in the Signal → Set quiz only.
- Group labels and hints live in the small `GROUPS` array just below `SETS`.

Save the file and reload the page. If the browser console shows an error after editing, it is almost always a missing comma or quote in the object you changed.
