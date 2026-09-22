# Serve Receive · 5-1, six rotations

A single-file, offline reference for one team's 5-1 (no libero): for each of the six rotations, where the six stand
at the service hit, who passes, who shades the setter and the right side, where everyone goes once the ball is passed,
and where they wait in base once the other side has the ball. The coach's sheet is the source of truth; the page turns
it into a court, checks it against the overlap rule, and puts it on the rally clock. It links to the
[Setter Signals & Set Map](../setter-signals/) page and shares its physics.

## Open it

- **Phone:** send `index.html` to a player; opening it launches the browser, no internet needed.
- **Desktop:** double-click `index.html`.
- **Hosted:** this folder lives in `public/`, so the main site deploy serves it at `/volleyball-tactics/serve-receive/`.

No build step, no frameworks, no CDNs.

## The team

| Code | Player |
| --- | --- |
| S | Setter |
| O1, O2 | Outsides |
| M1, M2 | Middles |
| R | Right side |

Lineup in service order: S, O1, M2, R, O2, M1. **R6 is the starting rotation**, the setter serving from zone 1; R1 is
one rotation later with the setter in zone 6, and so on to R5 with the setter in zone 2. The Setter Signals page
numbers the same rotations 1–6 starting from the setter in zone 1, so its rotation 1 is R6 here.

**The golden rule:** R and S never receive. When either is in the back court they are shaded by a teammate, behind a
passer or stacked tight behind a front-row player at the net. Anyone who shifts forward stays tight to the net or
stacked, never in mid-court, so the receivers keep a clear view of the server.

## The sheet

The page holds the coach's sheet verbatim. A zone digit, then who stands there; `X(f)Y` means Y stands behind X,
`X(l)Y` means Y stands to the right of X.

| Rotation | Start | Serve receive | Attack | Base defence |
| --- | --- | --- | --- | --- |
| R6 | `1S 6M1 5O2 4R 3M2 2O1` | `1O1(f)S 6M1 5O2 4R 3M2` | first ball `6M1 5O2 4R 3M2(l)S 2O1`, after the first hit `6M1 5O2 4O1 3M2(l)S 2R` | `1S 6M1 5O2 4O1 3M2 2R` |
| R1 | `1O1 6S 5M1 4O2 3R 2M2` | `1O1 6M1 5O2 3R(l)S 2M2` | `6M1 5O1 4O2 3M2(l)S 2R` | `1S 6M1 5O1 4O2 3M2 2R` |
| R2 | `1M2 6O1 5S 4M1 3O2 2R` | `1M2 6O1 5O2 4M1(l)S 2R` | `6M2 5O1 4O2 3M1(l)S 2R` | `1S 6M2 5O1 4O2 3M1 2R` |
| R3 | `1R 6M2 5O1 4S 3M1 2O2` | `1M2(f)R 6O1 5O2 4S(l)M1` | `1R 6M2 5O1 4O2 3M1(l)S` | `1R 6M2 5O1 4O2 3M1(l)S` |
| R4 | `1O2 6R 5M2 4O1 3S 2M1` | `1O2 6M2(f)R 5O1 3S(l)M1` | `1R 6M2 5O2 4O1 3M1(l)S` | `1R 6M2 5O2 4O1 3M1(l)S` |
| R5 | `1M1 6O2 5R 4M2 3O1 2S` | `1M1 6O2 5O1(f)R 4M2 2S` | `1R 6M1 5O2 4O1 3M2(l)S` | `1R 6M1 5O2 4O1 3M2(l)S` |

R6 is the exception to the switch: nobody moves off the receive shape until after our first hit, so R hits the first
ball from 4 and O1 from 2, then they swap sides for the rest of the rally.

## Views

| Tab | What it shows |
| --- | --- |
| Rotations · Start | The page opens here, at R6 Start: the rotational order before anyone moves, with dotted lines to each player's serve-receive spot. Next (or the right arrow key) runs the six to their next spots in the scene on screen and then switches to that phase: Start → Serve receive → Attack (→ after the first hit in R6) → Base defence, then on to the next rotation in match order, R6 → R1 → … → R5, the rotation itself animated. Back walks it the other way. A tap, Play or another press completes a move at once. |
| Rotations · Serve receive | The court at the service hit: passers (cyan) with their receive coverage shaded 6 back (the wings take short and mid serves in their thirds up to the seams, the centre passer takes the middle and every deep ball across the court), the setter (yellow) with the release run to the target, front-row players waiting at the net (violet), a back-row right side tucked behind a passer (pink), and dotted routes to where each one goes after the pass. Tap a player to see which overlap pairs hold them there and how far the rule moved them from where the sheet alone would put them. ▶ plays the serve, the pass and everyone's transition on the real clock. Toggles: routes, coverage. |
| Rotations · Attack | Where everyone is once our ball is set: hitters at their approach starts (violet), the setter at the target, the back row covering (cyan), with dashed rings at the serve-receive spot each one came from. R6 has a First ball / After the first hit switch. |
| Rotations · Base defence | The team's 6-back defence. Base once the other side has the ball: three blockers at the net, the wings out on the sidelines, the middle back deep on the end line, with who-is-where from the sheet's defence line. Dashed rings show where each one stands at our own service hit, still in rotational order, with the switch to base; the server stands behind the end line and runs in. ▶ plays our serve and the switch against the moment the other side's setter touches. Their outside / Their middle / Their right side show the read once their ball is set: two on the block, the off-blocker to the attack line, line and cross from the sidelines, the middle back on the end line, with each player's coverage shaded and the campfire marked. |
| Overlap | FIVB 7.4 in plain words and the seven pairs it consists of, with the actual gap in metres for the current rotation's receive formation and the pairs that sit on the margin. |
| Roles | A table of every player's job in every rotation: receive job, where they go for the attack, and their base spot. Plus the team's rules. |
| Checks | Thirteen rule sets: the sheet complete and consistent (six players per phase, the start line matching the rotational order, net zones front row, R6's first-ball swap); every receive formation legal under all seven pairs, recomputed from the rule text; the formation matching the sheet's zones and relations; the golden rule (the two outsides and the back-row middle pass from 5–7.5 m, R and S never pass and are shaded when back row); the setter at the target before a good pass comes down; anyone who shifts forward tight to the net or stacked, and nobody in mid-court in a lane; every start and route on the court and deterministic; a serve that clears the tape and a pass that comes down at the hands; base defence with the six 6-back spots on the perimeter, the three reads with two on the block, the off-blocker at the attack line, wings on the sidelines and the middle back on the end line, a legal stack at our serve with the server exempt and behind the end line, every switch finished before the other side sets; and a lineup that is a 5-1. |

## From the sheet to the floor

The sheet gives zones and relations, not metres. Each player wants a spot for what the sheet says they do: a passer
their lane (left, centre or right by the zone listed, spread 2.0 / 4.5 / 7.2 m across, about 6 m off, the centre
passer 0.8 m deeper, a front-row passer a little shallower); a front-row player waiting at the net the column of their
zone, 1 m off; a front-row setter the net (the target when listed in zone 2); a player shaded behind someone the spot
1.2 m behind them, peeking half a metre toward the side the back-row order needs; a front-row player beside someone the
spot 1 m to their right at the net; a back-row player beside a front-row player stacks tight behind them, 0.6 m to
their right and just behind them (1.45 m off the net), out of the receivers' sightline. Then the seven overlap constraints of FIVB rule 7.4
push players until legal with a 0.4 m margin, the least important job giving way first (passers hold, the setter yields
a little, waiters yield first), nobody in mid-court stands in a passer's lane, and the relations are re-applied to the settled
positions and solved once more. The Checks tab verifies the result against the rule text and against the sheet, so a
line that cannot be made legal shows up as a fault rather than a quietly moved player.

Attack spots come from the attack line's zones: a hitter listed in zone 4, 3 or 2 at that approach start (just outside
the left sideline, the centre, just outside the right sideline, about 3 m off), the setter at the target, a player
listed in 5, 6 or 1 covering left back, middle back or right back. Base spots come from the defence line: blockers half
an arm's length off the net with the pins pinched 2 m in from the sideline, wings 1.2 m in from the sideline and 1.2 m
behind the attack line, the middle back deep in the centre; `X(l)S` at the net means the setter takes the block to the
right of X.

## Nobody runs through anybody

Every move on the page (the step from phase to phase, the serve-receive clip, the base-defence clip) comes from a
small simulation rather than straight lines: each player heads for their spot at their own speed from their own leave
time, steps round anyone within a body's reach (0.7 m), and when two meet head-on both step to their right and pass,
so a pair swapping sides (O1 and R after R6's first hit, the pins switching at our serve) go round each other instead
of through. Everyone is exactly on their spot when the move ends. The arrival times in the checks are the straight-line
ones; a detour adds a few tenths at most.

## Receive coverage

With three passers the court is split at the two seams between them, and each seam is shared by the seam rule: the
passer nearer the server takes the short seam, the passer further away takes the deep seam (coachingvb.com, "Whose
ball? Seam responsibilities in serve receive and defense"; The Art of Coaching Volleyball on the four seams of a
three-passer formation). With the serve coming from the far centre the wings are nearer, so a wing owns their third and
the short part of the seam, and the deep centre passer owns the middle and the deep part of both seams. The overlay
draws exactly that: three regions, the centre one widening behind 6.4 m. The 2.6 m and 6.4 m lines are this page's
choice for where "short" and "deep" start.

## The clock

The serve is a float that clears the tape by 0.3 m and comes down on the passer's platform (about 1.1 s). The pass
rises to a 3.8 m apex and comes down at jump-set height at the target (1.26 s). The setter releases 0.3 s after the
service hit and runs at 4 m/s; passers move once the ball is past them, the passer after passing; everyone else runs
at 3.5 m/s to their attack spot. The base view runs the same serve the other way: our serve lands on their centre
passer, their pass hangs, and their setter touches about 2.3 s after our service hit; everyone leaves 0.3 s after the
hit and must be home by then. Sources and their validation are in the Setter Signals README.

## Base defence: 6 back

The team plays a 6-back (perimeter, middle-back) defence, and the Base defence view shows it two ways.

**Base**, before the other side sets: three blockers at the net with the pins pinched 2 m in, the two wings out on the
sidelines (1 m in, 6 m off), the middle back deep on the end line (8 m off): a loose triangle on the perimeter. Who is
where comes from the sheet's defence line (an outside left back, a middle middle back, the setter or right side right
back).

**Read**, once their ball is set, chosen with the Their outside / Their middle / Their right side control:

| Their attack | Block | Off-blocker | Line | Cross-court | End line |
| --- | --- | --- | --- | --- | --- |
| Outside (over our right) | our right blocker and middle, on the ball | our left blocker, off to the attack line (1.8 m in, 3 m off) for tips and the sharp angle | right back, on the sideline 6.5 m off | left back, on the sideline 6 m off | middle back on the end line in line with the hitter, for what comes through or over the block |
| Middle | our middle, the right blocker joining | our left blocker, off to the attack line for tips | left back and right back each take their angle from the sidelines | | middle back on the end line |
| Right side (over our left) | mirror of the outside | | | | |

Shaded areas show who covers what; the dashed red box is the campfire in the middle that a perimeter defence leaves
thin against tips. The read spots are this page's placement of the principles below; the sources give the shape and
the responsibilities, not metres.

Sources (search excerpts; the sites block automated fetching): The Art of Coaching Volleyball, defensive systems
(6-back or middle-back defence, "6" being the international designation of the middle back; perimeter defence places
at least three defenders on the court lines, the middle back deep in the centre, the wings back and toward the
sidelines; the middle-up alternative has one defender behind the block on the 3 m line); The Art of Coaching Volleyball,
defending the outside attack in perimeter defence (the middle back reads the set and takes a position on the end line
in line with the hitter's approach to cover the attack through or over the block; the right back drops back and
defends the line; the fourth digger, the off-blocker, positions near or on the attack line behind their starting point
at the net; the wing diggers take a position on the sidelines outside the blockers' shoulders and read attack or tip);
HoopsKing, base positions and systems (base with the outside blockers pinched toward the middle and the three back-row
defenders spread across the deep court in a loose triangle; wings use the sidelines and the middle back the end line;
the strength of the perimeter is four diggers on the hard spike, its weakness is the tip to the centre, the campfire);
Gold Medal Squared and The Volleyball Drill Shop on perimeter versus rotational defence; coachingvb.com on the middle
back playing deep in 6 or about 3 m in from the end line depending on the read.

## Earlier base-position sources

The blocker and stack conventions also draw on:
Volleyball Vault and HoopsKing on base positions (back-row wings about 4 ft off the sideline and 4 ft behind the
attack line; base is where the six start after serving or before the opponent sets); The Art of Coaching Volleyball on
base position and defensive systems (outside blockers pinched toward the middle, the middle blocker centred, the
middle back deep); Improve Your Volley on the blocker's ready position (about half an arm's length off the net);
Volleyball Rotations and The Art of Coaching on switching only after the service hit; FIVB rule 7.4 (the server is
exempt from positional faults). The pinch distance (2 m in from the sideline) is this page's choice; the sources
describe the pinch without metres.
