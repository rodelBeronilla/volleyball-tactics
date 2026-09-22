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
| Rotations · Serve receive | The court for the current rotation: passers in their lanes (cyan, the libero green), the setter (yellow) with the release run to the target, front-row hitters hiding at the net (violet), a back-row opposite tucked short (pink), and dotted routes to where each one attacks from after the pass (the 4, 2, 5, Pipe/A/B or D start). Tap a player to see which overlap pairs hold them there and how far the rule pushed them from where their job alone would put them. ▶ plays the serve, the pass and everyone's transition on the real clock. Toggles: libero on/off (without one the back-row middle passes), routes, lanes. |
| Rotations · Base defence | The same rotation once the other side has the ball: three blockers at the net (outside left, middle centre, setter or opposite right) and three diggers deep (libero left back, outside middle back, setter or opposite right back). Dashed rings show where each one stands at our own service hit, still in rotational order, with the switch to base and its distance; the server stands behind the end line and runs in. ▶ plays our serve and the switch on the clock, against the moment the other side's setter touches. Tap a player for which pair holds them in the stack, how far they switch and how much time they have. |
| Overlap | FIVB 7.4 in plain words and the seven pairs it consists of, with the actual gap in metres for the current rotation and the pairs that sit on the margin. |
| Roles | A table of every player's job in every rotation (lane, hide, tuck, set), where they transition to and their base defence spot, plus the responsibilities of each position in a 5-1. |
| Checks | Ten rule sets, all six rotations: legal under all seven pairs (recomputed from the rule text, not the solver's flag), the right three passing from 5–7.5 m, the setter at the target before the pass comes down, hiders at the net and tuckers out of the lanes, every start and route on the court and deterministic, a serve that clears the tape and a pass that comes down at the hands,, a lineup that is a 5-1; and for base defence the six right spots one per zone, a legal stack at our serve with the server exempt and behind the end line, and every switch finished before the other side sets. |

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

## Base defence

Base is where the six wait from the moment the other side has the ball until their setter touches it; from there
everyone reads the set and moves to their read position. The spots are the standard ones and, like serve receive,
nothing is typed per rotation: the lineup says who is front and back row, and each position has one base spot.

| Who | Base | Why |
| --- | --- | --- |
| Outside (front) | Left block, 2.0 m in from the left sideline, 0.5 m off the net | The outside blocks left after the switch; the two outside blockers start pinched toward the middle. The pinch distance is this page's choice (the sources describe it without metres). |
| Middle (front) | Middle block, centre of the net, 0.5 m off | Anchors the block and closes to either pin. Blockers stand about half an arm's length off the net so they can jump without touching it. |
| Setter or opposite (front) | Right block, 2.0 m in from the right sideline | The right-side player blocks right; a front-row setter blocks right and digs nothing. |
| Setter or opposite (back) | Right back, 1.2 m in from the sideline, 1.2 m behind the attack line | A back-row setter defends zone 1 so they can release to set; the opposite takes the same spot when the setter is front row. |
| Outside (back) | Middle back, centre, 7.0 m off the net | Deep in the centre, covering the deep corners in a perimeter defence. |
| Libero, or the back-row middle | Left back, 1.2 m in from the sideline, 1.2 m behind the attack line | The libero digs zone 5. |

Back-row wings about 4 ft from the sideline and 4 ft behind the 10-foot line is the figure the coaching sites give
for base; the middle back is described as deep in the centre.

### The stack at our serve and the switch

At the service hit all six must still be in rotational order (FIVB 7.4), except the server. So the page runs the same
overlap solver as serve receive with different wants: each player wants their base spot, the server wants the end line
behind it, the five pairs that do not involve zone 1 push the others until legal with the 0.4 m margin, and the middle
blocker is three times stiffer than the pins so the pins compress toward them. Whatever distance is left is the switch.
That gives the familiar picture without per-rotation data: in rotations 1 and 4 the two pins stand either side of the
middle and swap sides after the hit; in rotations 2 and 5 the opposite (or setter) stands just left of the middle; in
rotations 3 and 6 the back-row setter (or opposite) stands just left of the middle-back outside and runs to zone 1.

The clock starts at our service hit. The serve reaches their centre passer in about 1.07 s and their pass hangs about
1.26 s (the same physics as our own serve receive, mirrored), so their setter touches about 2.3 s after the hit.
Everyone leaves 0.3 s after the hit and runs at 3.5 m/s (the setter 4 m/s). The longest job is the server's run in from
behind the end line (5.4 m); every switch finishes with at least 0.5 s to spare, and the Checks tab grades that.

When the middle is due to serve (rotations 3 and 6) the libero cannot take their place, because under FIVB rules a
libero may not serve; the middle serves and plays left back for that rally, and the libero replaces them at the next
dead ball. USAV, NCAA and NFHS let a libero serve in one rotation position per set. The page shows the FIVB case and
says so.

Sources for the base spots and rules (read as search excerpts; several of these sites block automated fetching):
Volleyball Vault and HoopsKing on base positions (4 ft off the sideline and behind the attack line; base is where
the six start after serving or before the opponent sets); The Art of Coaching Volleyball on base position and
defensive systems (outside blockers pinched toward the middle, middle blocker centred, back row spread deep,
perimeter defence with the middle back deep); Improve Your Volley on the blocker's ready position (about half an arm's
length off the net); Gold Medal Squared's 5-1 guide and learnvolley.com's 5-1 formation pages (outside switches to
left front, right side to right front, back-row setter zone 1, libero zone 5, outside zone 6); Volleyball Rotations and
The Art of Coaching on switching only after the service hit; FIVB rule 7.4 (the server is exempt from positional
faults) and rule 19 with the USAV libero serving modification (coachingvb.com, playingvolley.com, the NCVA's USAV
libero serve rule note).
