# Serve Receive Rotations · 5-1

A single-file, offline reference for a 5-1 team's serve receive: for each of the six rotations,
where the six players stand before the serve, why the overlap rule puts them there, who passes and
in which lane, where the setter hides and how far they release, and where everyone goes once the
ball is passed. It is the serve-receive half of the [Setter Signals & Set Map](../setter-signals/)
page, built on the same model, and the two link to each other. Modelled on the interactive 5-1
formation pages at learnvolley.com, with the positions derived rather than drawn.

## Open it

- **Phone:** send `index.html` to a player; opening it launches the browser, no internet needed.
- **Desktop:** double-click `index.html`.
- **Hosted:** this folder lives in `public/`, so the main site deploy serves it at `/volleyball-tactics/serve-receive/`.

No build step, no frameworks, no CDNs.

## Views

| Tab | What it shows |
| --- | --- |
| Rotations | The court for the current rotation: passers in their lanes (cyan, the libero green), the setter (yellow) with the release run to the target, front-row hitters hiding at the net (violet), a back-row opposite tucked short (pink), and dotted routes to where each one attacks from after the pass (the 4, 2, 5, Pipe/A/B or D start). Tap a player to see which overlap pairs hold them there and how far the rule pushed them from where their job alone would put them. ▶ plays the serve, the pass and everyone's transition on the real clock. Toggles: libero on/off (without one the back-row middle passes), routes, lanes. |
| Overlap | FIVB 7.4 in plain words and the seven pairs it consists of, with the actual gap in metres for the current rotation and the pairs that sit on the margin. |
| Roles | A table of every player's job in every rotation (lane, hide, tuck, set) and where they transition to, plus the responsibilities of each position in a 5-1. |
| Checks | Seven rule sets, all six rotations: legal under all seven pairs (recomputed from the rule text, not the solver's flag), the right three passing from 5–7.5 m, the setter at the target before the pass comes down, hiders at the net and tuckers out of the lanes, every start and route on the court and deterministic, a serve that clears the tape and a pass that comes down at the hands, and a lineup that is a 5-1. |

## How the positions are derived

Nothing is typed per rotation. The lineup in service order (`S, OH, MB, OPP, OH, MB`, setter serving
from zone 1 in rotation 1) gives who is where; the libero replaces the back-row middle. Each player
wants a spot for their job: the libero and both outsides pass, spread left–centre–right about 6 m
off (the centre passer 0.8 m deeper, a front-row outside a little shallower); the front-row middle
and opposite hide at the net as close to their own attack start as they can; a back-row opposite
tucks short at the attack line; the setter waits at the target when front row and at the attack line
when back row. Then the seven overlap constraints of FIVB rule 7.4 (front-row player nearer the net
than the back-row player in their column; each row in left-centre-right order; no diagonals) push
players until legal with a 0.4 m margin, the least important job giving way first: passers hold,
the setter yields a little, hiders yield first. A back-row setter or opposite forced deeper than a
passer tucks into the near corner, and nobody tucked short stands in a passer's lane.

That reproduces the textbook 5-1 without per-rotation data: in rotation 1 the setter hides in the
right-back corner behind the right passer and releases 5.6 m, and the middle and the opposite stack
right at the net; in rotation 2 the setter stacks at the attack line behind the opposite; in
rotation 3 they start left of centre; in rotation 4 they start at the net just left of the middle;
in rotations 5 and 6 they are already at the target and the back-row opposite tucks short.

## The clock

The serve is a float that clears the tape by 0.3 m and comes down on the passer's platform (about
1.1 s, inside the 0.6–1.1 s receivers are measured to get). The pass rises to a 3.8 m apex and
comes down at jump-set height at the target (1.26 s). The setter releases 0.3 s after the service
hit and runs at 4 m/s; hiders release with them; passers move once the ball is past them, the
passer after passing; hitters run at 3.5 m/s to their attack starts. Sources and their validation
are in the Setter Signals README, which this page shares its constants with.
