// IPE 331 Machine Shop Atlas - model exam answers and worked solutions.
// Each entry: { ids: [question ids], title, html, numerical }.
// All numbers in the numericals were computed with a script and rounded for display.

export const ANSWERS = [
  /* ---------------------------------------------------------------- INTRO */
  {
    ids: ['2023-24_5d', '2017-18_5a', '2016-17_5a', '2012-13_5a'],
    title: 'Generating vs forming (and combined operations)',
    numerical: false,
    html: `
<p>Each machining operation produces its geometry through two factors: the <b>relative motions</b> between tool and workpart, and the <b>shape of the cutting tool</b>. On this basis operations are <b>generating</b>, <b>forming</b> or a combination.</p>
<h4>1. Generating</h4>
<ol>
<li>The geometry of the work is determined by the <b>feed trajectory</b> (path) of the cutting tool relative to the work.</li>
<li>The tool is a simple one; its own shape is not copied on the work.</li>
<li>Examples: straight turning (tool path parallel to the axis gives a cylinder), taper turning, contour turning, peripheral (slab) milling, profile milling.</li>
</ol>
<h4>2. Forming</h4>
<ol>
<li>The shape of the part is created by the <b>geometry of the cutting tool</b>: the cutting edge has the reverse of the shape to be produced on the part surface.</li>
<li>The tool is plunged into the work with little or no feed path.</li>
<li>Examples: form turning (shaped tool plunged radially), drilling, broaching.</li>
</ol>
<h4>3. Combined generating and forming</h4>
<ol>
<li><b>Thread cutting on a lathe:</b> the tool tip shape forms the thread profile (forming); the feed along the axis at one pitch per revolution generates the helix (generating).</li>
<li><b>Slot milling:</b> the cutter width forms the slot width; the table feed generates its length and the depth setting generates the floor.</li>
</ol>
<h4>Comparison</h4>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Generating</th><th>Forming</th></tr></thead>
<tbody>
<tr><td>Shape fixed by</td><td>Feed path of tool</td><td>Shape of tool</td></tr>
<tr><td>Tool</td><td>Simple, general-purpose</td><td>Special, one per shape</td></tr>
<tr><td>Examples</td><td>Turning, taper turning, slab milling</td><td>Form turning, drilling, broaching</td></tr>
</tbody></table></div>
<p><b>Sketch:</b> three small diagrams: (a) tool moving along a line parallel to the work axis (generating a cylinder), (b) a form tool plunged radially into the work with its profile copied, (c) a threading tool with a feed arrow along the axis.</p>`
  },
  {
    ids: ['2022-23_5a', '2020-21_1a'],
    title: 'Single-point vs multi-point cutting tools (definition, examples, advantages)',
    numerical: false,
    html: `
<p>Cutting tools are classified by the <b>number of main cutting edges engaged in cutting at one time in a single pass</b> into single-point and multi-point tools.</p>
<h4>Single-point cutting tool</h4>
<ol>
<li><b>Definition:</b> a tool with <b>only one main cutting edge</b> that performs material removal at a time in a single pass. Even in insert-type tools with several edges on the insert, only one edge engages at a time.</li>
<li><b>Examples:</b> turning tool (single point turning tool, SPTT), boring tool, shaping tool, planing tool, slotting tool.</li>
</ol>
<h4>Multi-point cutting tool</h4>
<ol>
<li><b>Definition:</b> a tool containing <b>more than two working cutting edges</b>, which successively engage and disengage (they need not cut simultaneously).</li>
<li><b>Examples:</b> milling cutter (4 to many teeth), drill, reamer, broach, hob, hone, grinding wheel (hundreds of grains).</li>
</ol>
<h4>Comparison</h4>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Single-point</th><th>Multi-point</th></tr></thead>
<tbody>
<tr><td>Edges cutting</td><td>One at a time</td><td>Several, in turn</td></tr>
<tr><td>MRR</td><td>Lower</td><td>Higher</td></tr>
<tr><td>Wear / life</td><td>Entire load and wear on one edge</td><td>Load shared; each edge cools between cuts</td></tr>
<tr><td>Cost and complexity</td><td>Simple, cheap, easily reground</td><td>Costly, complex to make and sharpen</td></tr>
<tr><td>Versatility</td><td>Very versatile</td><td>Specific to operation and size</td></tr>
<tr><td>Typical use</td><td>Turning, boring, planing, shaping</td><td>Milling, drilling, grinding, broaching</td></tr>
<tr><td>Disadvantage</td><td>Slow; low productivity</td><td>Expensive, upkeep and sharpening are costly</td></tr>
</tbody></table></div>
<p><b>Sketch:</b> a turning tool cutting a rotating bar (one edge active) beside a milling cutter with several teeth.</p>`
  },
  {
    ids: ['2023-24_7c'],
    title: 'Manufacturing process; additive vs subtractive manufacturing',
    numerical: false,
    html: `
<p><b>Manufacturing process:</b> a planned sequence of physical and/or chemical operations that changes the geometry, properties or appearance of a starting material to make a part or product, adding value to it. Groups: solidification (casting), deformation (forming), material removal (machining), joining, additive, heat/surface treatment and assembly.</p>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Additive (AM)</th><th>Subtractive</th></tr></thead>
<tbody>
<tr><td>Principle</td><td>Builds the part layer by layer from a CAD (STL) model by adding material</td><td>Removes material as chips from a larger solid blank</td></tr>
<tr><td>Waste</td><td>Very little (near-net shape)</td><td>High: chips and scrap</td></tr>
<tr><td>Geometry</td><td>Complex internal shapes, lattices, no special tooling</td><td>Limited by tool access</td></tr>
<tr><td>Accuracy / finish</td><td>Lower; stair-step surface, post-machining often needed</td><td>High accuracy, fine finish</td></tr>
<tr><td>Speed / volume</td><td>Slow; prototypes and low volume</td><td>Fast; economical for medium and mass production</td></tr>
<tr><td>Materials</td><td>Polymers, some metals, ceramics</td><td>Almost all engineering materials</td></tr>
<tr><td>Examples</td><td>FDM, SLA, SLS, DMLS</td><td>Turning, milling, drilling, shaping, grinding</td></tr>
</tbody></table></div>
<p class="note-tag">See Answer Note A</p>`
  },

  /* ---------------------------------------------------------------- TURNING / LATHE */
  {
    ids: ['2023-24_6c'],
    title: 'Main components of a lathe',
    numerical: false,
    html: `
<p>A centre lathe holds and rotates the work and moves a single-point tool along or across it. Main components:</p>
<ol>
<li><b>Bed:</b> the foundation of the lathe; a heavy casting that supports all other components. Its precisely machined <b>ways</b> guide the carriage and the tailstock.</li>
<li><b>Headstock:</b> mounted on the ways at the left end. It houses the <b>hollow spindle</b>, bearings and the transmission (speed) gears. The spindle carries the work holder (chuck jaws), receives power from the motor and gives the various drive speeds. The spindle bore accepts long bar stock.</li>
<li><b>Tailstock:</b> supports the other end of the work (dead/live centre). Its lower casting fits the inner ways, slides longitudinally and locks at the required position; also holds drill chucks, drills and reamers; offset for taper turning.</li>
<li><b>Carriage:</b> slides along the ways; consists of the <b>saddle, cross-slide, compound rest, tool post and apron</b>. It gives the base for mounting and moving the cutting tools, with longitudinal and transverse movement.</li>
<li><b>Cross-slide:</b> mounted on the carriage; moves the tool perpendicular to the axis for facing and cut-off.</li>
<li><b>Compound rest:</b> mounted on the cross-slide; can be swivelled for angular cuts; carries the tool post that holds the tool.</li>
<li><b>Apron:</b> hangs from the carriage; contains the gears, clutches and half-nut for power feed and threading.</li>
<li><b>Feed rod and lead screw:</b> powered by a gear train from the headstock; the feed rod drives turning and facing feeds, the lead screw cuts threads.</li>
</ol>
<p>Specification: swing over the cross-slide (maximum diameter) and distance between centres, e.g. a 300 - 1500 lathe.</p>
<p><b>Sketch:</b> a side view of the lathe with headstock on the left, tailstock on the right, bed with ways below, carriage with cross-slide, compound rest and tool post in between, and lead screw/feed rod in front. Label each part.</p>`
  },
  {
    ids: ['2014-15_5a', '2012-13_5c'],
    title: 'Operations performed on a lathe (explain any five)',
    numerical: false,
    html: `
<p>Lathe operations include facing, turning, contour turning, form turning, taper turning, drilling, boring, threading, knurling, chamfering and cut-off (parting). Five in detail:</p>
<ol>
<li><b>Facing:</b> the tool is fed <b>radially</b> into the rotating work at one end to create a flat surface on the end. Cutting speed falls toward the centre; the feed is along the cross-slide.</li>
<li><b>Straight turning:</b> a single-point tool is fed parallel to the axis of rotation to reduce the diameter and generate a cylinder; depth d = (D1 − D2)/2.</li>
<li><b>Taper turning:</b> instead of a feed parallel to the axis, the tool is fed at an <b>angle</b> (compound rest, tailstock offset, taper attachment), giving a conical surface.</li>
<li><b>Threading:</b> a pointed tool is fed linearly across the outside (or inside) surface parallel to the axis at a large effective feed (one pitch per revolution, via the lead screw), creating a thread.</li>
<li><b>Knurling:</b> a metal-forming (not cutting) operation: hardened knurling rollers pressed on the rotating work give a regular cross-hatched pattern for grip.</li>
<li><b>Boring:</b> a single-point tool fed parallel to the axis on the inside of an existing hole to enlarge it accurately.</li>
<li><b>Drilling:</b> a drill held in the tailstock chuck is fed axially into the rotating work; centre drilling comes first.</li>
<li><b>Cut-off / parting:</b> a thin tool fed radially to cut off the end of the part.</li>
<li><b>Chamfering:</b> the edge of the tool cuts an angle on the corner of the cylinder.</li>
<li><b>Contour / form turning:</b> contour turning follows a curved path; form turning plunges a shaped tool radially.</li>
</ol>
<p><b>Sketch:</b> for each operation draw the work (end view or side view) and the tool with arrows: V (rotation, red), f (feed, blue), d (depth, green).</p>`
  },
  {
    ids: ['2022-23_5c', '2016-17_5d'],
    title: 'Taper turning, threading, knurling, boring and drilling with directions of motion',
    numerical: false,
    html: `
<ol>
<li><b>Taper turning:</b> the work rotates (V); the tool is fed at an <b>angle α</b> to the axis (compound-rest swivel, tailstock offset or taper attachment) instead of parallel to it, producing a cone; tan α = (D − d)/(2l).</li>
<li><b>Threading:</b> the work rotates; a pointed tool (60° for metric) is fed <b>parallel to the axis</b> at a large feed equal to the pitch per revolution, through the lead screw and half-nut. Many passes, each deeper. External or internal.</li>
<li><b>Knurling:</b> the work rotates; knurling rollers are fed <b>radially</b> and pressed against the surface. No chip is cut; metal is formed into a regular cross-hatched pattern for grip.</li>
<li><b>Boring:</b> the work rotates; a single-point tool on a boring bar is fed <b>parallel to the axis</b> inside an existing hole to enlarge it to size.</li>
<li><b>Drilling:</b> the work rotates; the drill (in the tailstock) is fed <b>along the axis</b> into the end of the work. Centre drilling first for accuracy; reaming is done the same way.</li>
</ol>
<p><b>Sketch:</b> five small diagrams, each showing the chuck and work, the tool, and arrows: rotation (V), feed (f), and depth (d). Taper: inclined feed arrow; threading: feed arrow along the axis labelled "pitch/rev"; knurling: radial arrow and rollers; boring: tool inside the hole; drilling: drill on the axis.</p>`
  },
  {
    ids: ['2015-16_3b'],
    title: 'Taper boring, knurling, internal threading, face milling (with directions of movement)',
    numerical: false,
    html: `
<ol>
<li><b>Taper boring:</b> the work rotates; the boring tool is fed at an angle to the axis inside an existing hole (compound-rest swivel or taper attachment), producing an internal cone. Arrows: V rotation, f along an inclined line, d radial.</li>
<li><b>Knurling:</b> a forming operation; rollers are pressed radially into the rotating work, giving a cross-hatched pattern; the carriage may be moved axially to cover the length.</li>
<li><b>Internal threading:</b> a hole is first drilled and bored to the minor (tap-drill) diameter; a boring-bar threading tool of thread form is fed parallel to the axis at a feed equal to the pitch per revolution inside the hole; many passes.</li>
<li><b>Face milling:</b> the cutter axis is perpendicular to the machined surface; the cutter rotates (V) while the table feeds the work (f) under it, with the axial depth d. The surface is cut by the combined action of the side and face of the cutter; conventional, partial and end-milling variants.</li>
</ol>
<p><b>Sketch:</b> one diagram per operation with the work, tool and labelled arrows for V, f and d.</p>`
  },
  {
    ids: ['2017-18_5c'],
    title: 'How boring differs from turning',
    numerical: false,
    html: `
<ol>
<li><b>Turning:</b> a single-point tool is fed linearly parallel to the axis along the <b>outside</b> surface of a rotating workpiece to reduce its diameter (generating a cylinder).</li>
<li><b>Boring:</b> a single-point tool is fed linearly parallel to the axis along the <b>inside diameter of an existing hole</b> to enlarge it or achieve a precise diameter.</li>
</ol>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Turning</th><th>Boring</th></tr></thead>
<tbody>
<tr><td>Surface</td><td>External</td><td>Internal (existing hole needed)</td></tr>
<tr><td>Tool support</td><td>Short, rigid tool shank in the tool post</td><td>Boring bar with overhang, less rigid</td></tr>
<tr><td>Cut</td><td>Heavier cuts possible</td><td>Lighter cuts, more chatter</td></tr>
<tr><td>Chips and coolant</td><td>Easy to clear and supply coolant</td><td>Chip clearance and coolant supply are difficult</td></tr>
<tr><td>Depth of cut</td><td>d = (D1 − D2)/2 (diameter reduces)</td><td>d = (D2 − D1)/2 (diameter increases)</td></tr>
<tr><td>Visibility</td><td>Cutting visible</td><td>Cut hidden in the hole</td></tr>
</tbody></table></div>
<p><b>Sketch:</b> a bar with an external turning tool, and a hollow work with a boring bar inside, each with V, f, d arrows.</p>`
  },
  {
    ids: ['2010-11_5a'],
    title: 'Turning vs threading; how turning corresponds to threading',
    numerical: false,
    html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Turning</th><th>Threading</th></tr></thead>
<tbody>
<tr><td>Purpose</td><td>Cylindrical surface of smaller diameter</td><td>Helical groove (thread)</td></tr>
<tr><td>Tool</td><td>General profile single-point tool</td><td>Pointed tool ground to the thread form (60° for metric, 55° Whitworth)</td></tr>
<tr><td>Feed</td><td>Small, about 0.1 - 0.5 mm/rev, from the feed rod</td><td>Large effective feed: exactly one <b>pitch (lead) per revolution</b>, from the lead screw and half-nut</td></tr>
<tr><td>Passes</td><td>One or a few</td><td>Many, each with a small increment of depth</td></tr>
<tr><td>Speed</td><td>Higher</td><td>Lower, for control</td></tr>
<tr><td>Generating / forming</td><td>Generating</td><td>Combined (tool form + axial feed)</td></tr>
</tbody></table></div>
<p><b>Correspondence:</b> in both operations a single-point tool is fed parallel to the axis of a rotating workpart, and the same cutting parameters V, f, d apply. Threading is turning carried out with a pointed tool at a feed rate equal to the pitch, so the tool path is a helix; the depth is the thread depth.</p>
<p><b>Sketch:</b> two views of a rotating bar: turning tool with feed arrow, and threading tool with feed arrow labelled "pitch per rev".</p>`
  },
  {
    ids: ['2011-12_6a'],
    title: 'Lathe operations that need a drill chuck',
    numerical: false,
    html: `
<p>A drill chuck is mounted in the tailstock quill (with a taper arbor) and holds small straight-shank tools that are fed axially into the rotating work with the tailstock hand-wheel. Operations:</p>
<ol>
<li><b>Centering (centre drilling):</b> a centre drill makes a conical starting hole that locates the later drill or the lathe centre. Must be done before drilling.</li>
<li><b>Drilling:</b> the drill is fed along the axis of the rotating work to make a hole.</li>
<li><b>Reaming:</b> a reamer in the chuck enlarges and finishes a drilled hole to size.</li>
<li><b>Counterboring/countersinking and tapping (by hand):</b> with the appropriate tool in the chuck.</li>
</ol>
<p><b>Sketch:</b> the work in the chuck, the tailstock with the drill chuck, and a drill entering the end face with arrows for rotation and feed.</p>`
  },
  {
    ids: ['2010-11_5b'],
    title: 'Lathe set-up for contour turning and internal threading',
    numerical: false,
    html: `
<h4>Contour turning</h4>
<ol>
<li>Hold the job in a 3-jaw chuck, or between centres for long jobs; support the tail end with the tailstock centre if L/D is above about 3 to 4.</li>
<li>Use a pointed or round-nose single-point tool with enough side and end clearance to follow the profile.</li>
<li>The tool follows a curved path, so longitudinal and cross feeds are combined at the same time: by hand coordination of carriage and cross-slide handwheels, by a copying (tracer) attachment with a stylus following a template, or by CNC interpolation.</li>
<li>Rough with straight passes, then finish with a continuous contour pass at low feed.</li>
</ol>
<h4>Internal threading</h4>
<ol>
<li>Hold the job in a chuck; drill and bore the hole to the minor (tap-drill) diameter.</li>
<li>Use a boring-bar internal threading tool ground to the thread angle (60° metric), set exactly at centre height and square to the axis with a centre gauge.</li>
<li>Select the pitch on the quick-change gearbox and engage the half-nut on the lead screw so that the carriage moves one pitch per revolution.</li>
<li>Swivel the compound rest to 29 - 30° and feed in small depths; use the thread-chasing dial to re-engage in the same groove; low speed and cutting oil; withdraw at the end of each pass.</li>
<li>Check with a plug gauge or the mating bolt.</li>
</ol>
<p><b>Sketch:</b> (a) chuck, work and a tool following a curved path with cross-feed and longitudinal-feed arrows; (b) a bored hole with a threading bar, lead screw and half-nut indicated.</p>
<p class="note-tag">See Answer Note D</p>`
  },
  {
    ids: ['2010-11_5c'],
    title: 'Power feed mechanism for turning and threading',
    numerical: false,
    html: `
<ol>
<li>Drive path: <b>spindle &rarr; tumbler gears &rarr; change gears / quick-change gearbox &rarr; feed rod (turning) or lead screw (threading)</b>.</li>
<li><b>Turning:</b> the keyed feed rod turns a worm and gears in the apron. A friction clutch engages either the rack and pinion (longitudinal feed) or the cross-slide screw (cross feed). An overload clutch protects the drive. Feed is in mm per spindle revolution.</li>
<li><b>Threading:</b> the half-nut (split nut) in the apron closes on the lead screw so the carriage is driven positively, one lead per revolution of the screw. The gear ratio is chosen so the pitch of the job equals the ratio of spindle to lead-screw speed times the lead of the screw.</li>
<li>The feed rod and lead screw are interlocked so they cannot be engaged together.</li>
</ol>
<p><b>Sketch:</b> block diagram: spindle, tumbler reverse, change gear train, gearbox, feed rod and lead screw, apron with clutch and half-nut.</p>
<p class="note-tag">See Answer Note G</p>`
  },
  {
    ids: ['2013-14_6a', '2011-12_5b'],
    title: 'Taper turning with the compound rest swivelled',
    numerical: false,
    html: `
<ol>
<li>The compound rest is mounted on the cross-slide and sits on a graduated circular base. It is <b>swivelled through the half-taper angle α</b> and clamped.</li>
<li>The tool is fed by hand with the compound-slide handle, so it moves in an angular direction at angle α to the axis of the job, cutting a cone.</li>
<li>Angle: tan α = (D − d)/(2l), with D large dia, d small dia, l length of taper.</li>
<li><b>Advantages:</b> any angle up to 90° (steep tapers such as centres, chamfers and bevels); simple, no special attachment; works on external and internal tapers.</li>
<li><b>Disadvantages:</b> hand feed only (poor, non-uniform finish); length of taper limited by the compound slide travel.</li>
</ol>
<p><b>Sketch:</b> plan view of the lathe: the work in the chuck, the compound rest swivelled at angle α to the bed axis, and the tool path along the inclined line.</p>
<p class="note-tag">See Answer Note E</p>`
  },
  {
    ids: ['2012-13_4b'],
    title: 'Factors restraining V, f and d in turning; causes and effects of high cutting temperature',
    numerical: false,
    html: `
<h4>Restraints on V, f and d</h4>
<ol>
<li><b>Cutting velocity V:</b> raises the cutting temperature sharply, causing rapid crater and flank wear, softening of the tool and short tool life (Taylor: V·Tⁿ = C). Also limited by spindle speed, power, vibration of unbalanced work.</li>
<li><b>Feed f:</b> increases cutting force (roughly proportional), power and deflection; poorer finish (roughness h ≈ f²/8r); chatter and edge strength limit it.</li>
<li><b>Depth of cut d:</b> increases force and power; limited by rigidity of machine, tool and work, chatter, tool-edge strength and available stock.</li>
<li>Together they are limited by machine power (P = Fc·V), required finish and accuracy, and economics. Rule: use maximum d first, then maximum f, then V for economic tool life.</li>
</ol>
<h4>Causes of high cutting temperature</h4>
<ol>
<li>Plastic shear deformation in the primary shear zone (about 60 - 70% of the heat).</li>
<li>Friction and secondary deformation at the chip-tool interface (about 20 - 30%).</li>
<li>Rubbing of the flank on the machined surface (about 5 - 10%).</li>
<li>High V and f, worn tool, low thermal conductivity of work and tool, and no coolant raise it further.</li>
</ol>
<h4>Effects</h4>
<ol>
<li><b>Tool:</b> faster wear (diffusion, adhesion, oxidation), loss of hot hardness, plastic deformation of the edge, cracking; shorter life.</li>
<li><b>Job:</b> thermal expansion errors, heat-affected or oxidised surface, residual stress, micro-cracks.</li>
<li><b>Machine:</b> thermal distortion and loss of accuracy.</li>
</ol>
<p class="note-tag">See Answer Note B</p>`
  },
  {
    ids: ['2017-18_5d'],
    title: 'Turning of grey cast iron: MRR, power, speed, torque and time (Ø52, f 0.4, d 4.2, V 75, K 915)',
    numerical: true,
    html: `
<h4>Given</h4>
<p>D = 52 mm (grey CI), f = 0.4 mm/rev, d = 4.2 mm, V = 75 m/min, K = 915 N/mm², L = 152.5 mm, over-travel = 2.5 mm.</p>
<ol class="steps">
<li><b>MRR</b> = V·f·d = (75 000 mm/min)(0.4)(4.2) = <b>126 000 mm³/min</b> (2100 mm³/s).</li>
<li><b>Power</b> P = K × MRR = 915 × 126 000 = 115.29 × 10⁶ N·mm/min = 115 290 N·m/min; P = 115 290/60 = 1921.5 W = <b>1.92 kW</b> (divide by drive efficiency to get motor power).</li>
<li><b>Spindle speed</b> N = 1000V/(πD) = 1000 × 75/(π × 52) = <b>459 rpm</b>.</li>
<li><b>Torque</b> T = P/ω = 1921.5/(2π × 459.1/60) = 1921.5/48.08 = <b>40 N·m</b>. Check: Fc = K·f·d = 915 × 0.4 × 4.2 = 1537 N; T = Fc·D/2 = 1537 × 0.026 = 40 N·m.</li>
<li><b>Machining time</b> t = (L + over-travel)/(f·N) = (152.5 + 2.5)/(0.4 × 459.1) = 155/183.6 = <b>0.844 min (50.6 s)</b>.</li>
</ol>
<div class="callout">Answers: MRR = 126 000 mm³/min; P = 1.92 kW; N = 459 rpm; T = 40 N·m; t = 0.844 min.</div>
<p class="note-tag">See Answer Note C</p>`
  },
  {
    ids: ['2020-21_1b'],
    title: 'Bar Ø4.5 in turned to Ø4.25 in: depth of cut, feed and cutting time',
    numerical: true,
    html: `
<h4>Given</h4>
<p>D1 = 4.5 in, D2 = 4.25 in, length turned L = 46 in (bar 52 in long), V = 450 ft/min, MRR = 6.75 in³/min, one pass.</p>
<ol class="steps">
<li><b>(i) Depth of cut</b> d = (D1 − D2)/2 = (4.5 − 4.25)/2 = <b>0.125 in</b>.</li>
<li>Convert the speed: V = 450 ft/min × 12 = 5400 in/min.</li>
<li><b>(ii) Feed</b> from MRR = V·f·d: f = 6.75/(5400 × 0.125) = <b>0.010 in/rev</b>.</li>
<li>Spindle speed N = V/(πD1) = 5400/(π × 4.5) = 382 rpm (based on the initial diameter).</li>
<li>Feed rate fr = f·N = 0.010 × 382 = 3.82 in/min.</li>
<li><b>(iii) Cutting time</b> Tm = L/(f·N) = 46/3.82 = <b>12.0 min</b> (about 723 s).</li>
</ol>
<div class="callout">Answers: d = 0.125 in; f = 0.010 in/rev; Tm = 12.0 min. Assumption: V is based on the initial diameter 4.5 in and approach/over-travel is neglected.</div>`
  },
  {
    ids: ['2018-19_8b'],
    title: 'Single pass in 5.0 min on a 400 mm × Ø150 job: required cutting speed and MRR',
    numerical: true,
    html: `
<h4>Given</h4>
<p>Length L = 400 mm, D = 150 mm, f = 0.30 mm/rev, d = 4 mm, Tm = 5.0 min, over-travel = 33.33% of the length.</p>
<ol class="steps">
<li>Over-travel = 0.3333 × 400 = 133.33 mm, so total tool travel = 400 + 133.33 = 533.33 mm.</li>
<li>From Tm = (L + over-travel)/(f·N): N = 533.33/(0.30 × 5.0) = <b>355.6 rpm</b>.</li>
<li><b>Cutting speed</b> V = πDN/1000 = π × 150 × 355.6/1000 = <b>167.6 m/min</b>.</li>
<li><b>MRR</b> = V·f·d = 167 550 mm/min × 0.30 × 4 = <b>201 060 mm³/min</b> (about 201 cm³/min).</li>
</ol>
<div class="callout">Answers: N = 355.6 rpm, V = 167.6 m/min, MRR = 2.01 × 10⁵ mm³/min. (Check: 533.33/(0.30 × 355.6) = 5.0 min.)</div>`
  },
  {
    ids: ['2021-22_1c'],
    title: 'Multi-pass turning time (roughing + finishing): method and worked example',
    numerical: true,
    html: `
<p class="callout warn">The figure of 2021-22 Q1(c) (brass Ø60 × 145 mm, V = 60 m/min HSS, depth 3 mm per pass) is not in the extracted text and the feed is missing. The method is given below with the slide-25 and slide-28 example numbers (labelled as such). Replace the values with those in your figure.</p>
<h4>Method for the actual question</h4>
<ol class="steps">
<li>N = 1000V/(πD) = 1000 × 60/(π × 60) = <b>318.3 rpm</b> (for the largest diameter; use the nearest lower standard speed if a speed ladder is given).</li>
<li>Radial stock = (60 − D_final)/2; number of passes = stock/3 mm, rounded up.</li>
<li>Time per pass = (L + allowance)/(f·N); total = passes × time per pass (plus facing or other operations if the figure shows them).</li>
</ol>
<h4>Worked example with the slide-25 data (Q1)</h4>
<p>C40 steel blank Ø50 mm, finished Ø42 mm over 120 mm length (figure dimensions as read from the slide); roughing V = 30 m/min, f = 0.24 mm/rev, max d = 2 mm; finishing V = 60 m/min, f = 0.10 mm/rev, allowance 0.75 mm; spindle speeds 70, 110, 176, 280, 440, 700, 1100, 1760, 2800 rpm. Approach/over-travel neglected.</p>
<ol class="steps">
<li>Radial stock = (50 − 42)/2 = 4 mm. Finishing allowance 0.75 mm, so roughing stock = 4 − 0.75 = 3.25 mm, needing 3.25/2 = 1.6, so <b>2 roughing passes</b> (2 mm + 1.25 mm) and 1 finishing pass.</li>
<li>Roughing: N = 1000 × 30/(π × 50) = 191.0 rpm, so select <b>176 rpm</b> (highest available not exceeding it; actual V = 27.65 m/min).</li>
<li>Time per roughing pass = 120/(0.24 × 176) = 2.841 min; two passes = <b>5.682 min</b>.</li>
<li>Finishing: N = 1000 × 60/(π × 42) = 454.7 rpm, so select <b>440 rpm</b> (V = 58.1 m/min).</li>
<li>Finishing time = 120/(0.10 × 440) = <b>2.727 min</b>.</li>
<li>Total machining time = 5.682 + 2.727 = <b>8.41 min</b>.</li>
</ol>
<h4>Illustration with the slide-28 numbers (HSS part)</h4>
<p>Shaft Ø40 to Ø22 over 32 mm (assumed reading of the figure), V = 30 m/min, f = 0.3 mm/rev, d = 2 mm: N = 238.7 rpm, select 176 rpm, passes = 9/2, so 5 passes, time = 5 × 32/(0.3 × 176) = <b>3.03 min</b> (solved in full under 2009-10 Q5(b)).</p>
<div class="callout">Slide-25 example answer: 8.41 min. For the actual question apply the same steps with f from the figure.</div>`
  },
  {
    ids: ['2009-10_5b'],
    title: 'C40 shaft Ø40 × 75: machining time with HSS and carbide (slide-28 example)',
    numerical: true,
    html: `
<p class="callout warn">The figure is not available in the extracted text. Geometry assumed from the slide-28 fragments (40, 75, 22, 32 mm): stock Ø40 × 75 mm, a length of 32 mm turned down to Ø22 mm. Spindle speeds taken from the question (70, 110, 176, 280, 440, 700, 1100, 1760, 2800 rpm). Approach/over-travel neglected. Replace these with your figure's values if different.</p>
<h4>Common calculation</h4>
<ol class="steps">
<li>Radial depth to remove = (40 − 22)/2 = 9 mm. Maximum d = 2 mm per pass gives 9/2 = 4.5, so <b>5 passes</b> (4 × 2 mm + 1 × 1 mm).</li>
<li>Choose the highest standard speed that does not exceed the speed calculated from V at the largest diameter (Ø40).</li>
<li>Total time = passes × L/(f·N).</li>
</ol>
<h4>Question data (carbide, V = 135 m/min, f = 0.38 mm/rev)</h4>
<ol class="steps">
<li>N = 1000 × 135/(π × 40) = 1074 rpm, so select <b>700 rpm</b> (actual V = 88 m/min).</li>
<li>Tm = 5 × 32/(0.38 × 700) = <b>0.602 min</b> (36 s).</li>
</ol>
<h4>Slide 28 Q2 (parts a and b)</h4>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Case</th><th>V (m/min)</th><th>f (mm/rev)</th><th>N calc (rpm)</th><th>N used</th><th>Passes</th><th>Time (min)</th></tr></thead>
<tbody>
<tr><td>(a) HSS</td><td>30</td><td>0.30</td><td>238.7</td><td>176</td><td>5</td><td>3.03</td></tr>
<tr><td>(b) Carbide</td><td>145</td><td>0.38</td><td>1153.9</td><td>1100</td><td>5</td><td>0.383</td></tr>
</tbody></table></div>
<div class="callout">Answer (question data): Tm = 0.60 min. Slide 28: HSS 3.03 min, carbide 0.383 min (about 8 times faster). These use the assumed geometry above.</div>`
  },

  /* ---------------------------------------------------------------- MILLING */
  {
    ids: ['2012-13_7a'],
    title: 'Principal parts and movements of a column-and-knee milling machine',
    numerical: false,
    html: `
<ol>
<li><b>Column:</b> a vertical casting that houses the spindle, bearings, gearbox, clutches, shafts, pumps and the shifting mechanisms for transmitting power from the motor to the spindle at the selected speed.</li>
<li><b>Knee:</b> mounted in front of the column; supports the table and gives <b>vertical (up/down) motion along the Z axis</b> to set the depth of cut.</li>
<li><b>Saddle:</b> sits on the knee; has two slideways at 90° to each other (top and bottom) to give motion in the <b>X or Y axes</b> via lead screws.</li>
<li><b>Table:</b> mounted on the saddle; moves along X (longitudinal feed); T-slots on top hold the work or fixtures.</li>
<li><b>Arbor</b> (horizontal machines): extension of the spindle carrying the cutters; usually a left-hand thread end. Supported by an overarm and arbor support.</li>
<li><b>Vertical machine only:</b> <b>milling head</b> (spindle, motor, feed control) on a <b>swivel base</b> so it can be set at an angle to the table; <b>ram</b> carrying the head, adjustable forward and backward on slideways at the top of the column.</li>
</ol>
<p><b>Movements:</b> cutter rotation (primary, spindle); table longitudinal (X, feed), saddle cross (Y), knee vertical (Z); rotary table gives the 4th axis on some machines.</p>
<p><b>Sketch:</b> side view with column, knee, saddle, table (with work), arbor with cutter, overarm; arrows for X, Y, Z.</p>`
  },
  {
    ids: ['2011-12_5a'],
    title: 'Are turning/threading and milling both continuous cutting processes?',
    numerical: false,
    html: `
<ol>
<li><b>Turning and threading (continuous):</b> the work rotates and the single-point tool stays in contact with it throughout the pass. The chip is formed continuously with constant thickness (feed × sin of approach angle), cutting force is steady, and the tool engages and leaves the work only at the start and end of the pass.</li>
<li><b>Milling (intermittent):</b> the cutter is multi-tooth; each tooth <b>enters, cuts a chip of varying (comma-shaped) thickness and leaves</b> the work, then travels through the air during the rest of the revolution. The cutting force fluctuates with every tooth, there is impact on entry, and the tooth cools between cuts.</li>
<li>Therefore turning and threading are continuous cutting processes, but milling is an <b>interrupted (intermittent) cutting</b> process, even though the cutter rotation and the table feed themselves are continuous. (A turned surface with keyways or splines would also be cut intermittently.)</li>
</ol>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Turning / threading</th><th>Milling</th></tr></thead>
<tbody>
<tr><td>Tool contact</td><td>Continuous</td><td>Each tooth cuts only part of a revolution</td></tr>
<tr><td>Chip thickness</td><td>Constant</td><td>Varies from zero to maximum (or the reverse)</td></tr>
<tr><td>Cutting force</td><td>Steady</td><td>Fluctuating, shock on entry</td></tr>
<tr><td>Cooling of tool edge</td><td>None between cuts</td><td>Edge cools each revolution</td></tr>
</tbody></table></div>`
  },
  {
    ids: ['2017-18_6a'],
    title: 'Peripheral vs face milling; proof that A = (√3/4)D for d = D/4',
    numerical: true,
    html: `
<h4>Peripheral vs face milling</h4>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Peripheral milling</th><th>Face milling</th></tr></thead>
<tbody>
<tr><td>Cutter axis relative to surface</td><td>Cut in a plane parallel to the cutter axis</td><td>Cut at right angles to the cutter axis</td></tr>
<tr><td>Surface produced</td><td>Cross-section follows the contour of the cutter (flat, slot, form)</td><td>Flat surface, no relation to the cutter contour</td></tr>
<tr><td>Teeth cutting</td><td>Peripheral teeth only</td><td>Combined action of side and face of cutter</td></tr>
<tr><td>Cutters</td><td>Slab, side, form, slitting saw</td><td>Face mill, end mill</td></tr>
<tr><td>Machine</td><td>Usually horizontal spindle</td><td>Usually vertical spindle</td></tr>
<tr><td>Operations</td><td>Slab milling, slotting, slitting, side, form, straddle</td><td>Conventional face, partial face, end, profile, pocket, contouring</td></tr>
</tbody></table></div>
<h4>Proof for slab milling with d = D/4</h4>
<ol class="steps">
<li>Cutter radius R = D/2. The axis is at height R − d above the work surface, so the vertical side of the right triangle is δ = D/2 − d.</li>
<li>Pythagoras: R² = A² + δ², so A² = (D/2)² − (D/2 − d)² = d(D − d).</li>
<li>Substitute d = D/4: A² = (D/4)(D − D/4) = (D/4)(3D/4) = 3D²/16.</li>
<li>A = √(3D²/16) = <b>(√3/4)·D</b> ≈ 0.433 D. Hence proved.</li>
</ol>
<p><b>Sketch:</b> the cutter circle touching the work top at its entry corner, vertical drop d, radius to the contact point, right triangle with sides A, δ = D/2 − d and hypotenuse D/2.</p>`
  },
  {
    ids: ['2013-14_5b'],
    title: 'Peripheral milling operations',
    numerical: false,
    html: `
<p>In peripheral milling the cut is in a plane parallel to the cutter axis, and the cross-section of the surface corresponds to the contour of the cutter.</p>
<ol>
<li><b>Slab milling:</b> a cylindrical cutter on an axis parallel to the table creates a flat surface.</li>
<li><b>Slotting:</b> cuts a narrow groove (slot) in the surface of the work.</li>
<li><b>Slitting:</b> a thin rotary saw with peripheral teeth cuts deep, narrow slots or parts the work off.</li>
<li><b>Side milling:</b> a side-milling cutter machines one vertical surface of the work.</li>
<li><b>Straddle milling:</b> two side-milling cutters machine two parallel vertical surfaces simultaneously.</li>
<li><b>Form milling:</b> a cutter with a unique shape reproduces that shape in the work (gear teeth, flutes).</li>
</ol>
<p><b>Sketch:</b> for each, the cutter on the arbor over the work with arrows: cutter rotation V, table feed f, depth d.</p>`
  },
  {
    ids: ['2010-11_6a'],
    title: 'Side milling and face milling operations',
    numerical: false,
    html: `
<h4>Side milling (peripheral)</h4>
<p>A side-milling cutter (teeth on the periphery and side) cuts one vertical surface, shoulder or slot; with two cutters on one arbor (<b>straddle milling</b>) two parallel vertical faces are cut at once. Cutting is mainly by peripheral teeth; the side teeth finish the wall.</p>
<h4>Face milling</h4>
<p>The cutter axis is perpendicular to the machined surface; the surface is generated by the combined action of face and side of the cutter and is flat. Variants:</p>
<ol>
<li><b>Conventional face milling:</b> cutter diameter greater than the work width; cutter overhangs both sides.</li>
<li><b>Partial face milling:</b> cutter overhangs one side only.</li>
<li><b>End milling:</b> cutter diameter less than the work width, cutting a slot.</li>
<li><b>Profile milling, pocket milling and surface contouring</b> (ball nose).</li>
</ol>
<p><b>Sketch:</b> side milling: horizontal arbor cutter beside the work; face milling: vertical-axis face mill above the work. Mark V, f and d.</p>`
  },
  {
    ids: ['2016-17_7d'],
    title: 'Face milling and four face milling operations',
    numerical: false,
    html: `
<p><b>Face milling:</b> a milling operation in which the surface is cut at right angles to the cutter axis, producing a flat surface by the combined action of the side and face of the cutter; the cutter is usually mounted on a vertical spindle.</p>
<ol>
<li><b>Conventional face milling:</b> the cutter diameter is greater than the work width, so the cutter overhangs the work on both sides; used for large flat surfaces.</li>
<li><b>Partial face milling:</b> the cutter overhangs the work on only one side.</li>
<li><b>End milling:</b> the cutter diameter is less than the work width, so a slot is cut into the part.</li>
<li><b>Profile milling:</b> a form of end milling in which the outside periphery of a flat part is cut.</li>
<li><b>Pocket milling:</b> end milling to mill shallow pockets into flat parts.</li>
<li><b>Surface contouring:</b> a ball-nose cutter is fed back and forth across the work along a curved path at close intervals to produce a three-dimensional surface.</li>
</ol>
<p>(Any four are required.)</p>
<p><b>Sketch:</b> top views of the six cases: cutter circle larger than the work (a), overhanging one side (b), smaller than the work cutting a slot (c), outline of the part (d), a pocket (e), and a ball-nose cutter (f).</p>`
  },
  {
    ids: ['2013-14_6c'],
    title: 'Cutting tools (cutters) used for milling',
    numerical: false,
    html: `
<p>Milling cutters are multi-point tools; they have right-hand or left-hand cut and spiral.</p>
<h4>Horizontal milling</h4>
<ol>
<li><b>Plain (slab) milling cutter:</b> straight teeth parallel to the axis; flat surfaces. Helical teeth version for smoother cut.</li>
<li><b>Side and face cutters:</b> teeth on the periphery and on the sides; cut shoulders and slots.</li>
<li><b>Slitting saws:</b> thin; deep slots and parting off.</li>
<li><b>Form cutters:</b> special shape (gear, flute).</li>
</ol>
<h4>Vertical milling</h4>
<ol>
<li><b>End mills:</b> facing, slotting and profile milling.</li>
<li><b>Face milling cutters:</b> heavy cutting of large faces.</li>
<li><b>Slot drills:</b> produce pockets without pre-drilling a hole.</li>
<li><b>Ball-nose cutter:</b> 3D contouring.</li>
</ol>
<p><b>Sketch:</b> a plain cutter, a helical cutter, a side-and-face cutter, a slitting saw, an end mill and a face mill, each with teeth shown.</p>`
  },
  {
    ids: ['2009-10_6a'],
    title: 'Helical vs plain milling cutter',
    numerical: false,
    html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Plain milling cutter</th><th>Helical milling cutter</th></tr></thead>
<tbody>
<tr><td>Teeth</td><td>Straight, parallel to the axis of rotation</td><td>Spiral (helix) around the body at a helix angle</td></tr>
<tr><td>Engagement</td><td>Whole tooth length strikes at once</td><td>Gradual, progressive entry</td></tr>
<tr><td>Action</td><td>Intermittent impact, more vibration</td><td>Smooth, quiet, continuous</td></tr>
<tr><td>Power</td><td>More power in heavy cuts</td><td>Less shock, less power</td></tr>
<tr><td>Finish</td><td>Slightly rougher</td><td>Much smoother</td></tr>
<tr><td>Use</td><td>Wide, rough or light flat-surface passes</td><td>Uneven surfaces, interrupted cuts (pre-drilled holes), tough materials, where chatter must be avoided</td></tr>
<tr><td>Axial thrust</td><td>None</td><td>Present (balanced by right/left-hand spiral pairs)</td></tr>
</tbody></table></div>
<p><b>Sketch:</b> two cylindrical cutters side by side: one with straight teeth parallel to the axis, and one with teeth wrapped helically.</p>`
  },
  {
    ids: ['2023-24_6a', '2022-23_7a', '2014-15_6d', '2010-11_6b', '2021-22_2d', '2020-21_3b'],
    title: 'Up milling vs down milling (13 points) and which is preferred',
    numerical: false,
    html: `
<p><b>Up (conventional) milling:</b> the cutter rotates <b>against</b> the direction of table feed. <b>Down (climb) milling:</b> the cutter rotates in the <b>same direction</b> as the table feed.</p>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>#</th><th>Up milling</th><th>Down milling</th></tr></thead>
<tbody>
<tr><td>1</td><td>Traditional, usually used for roughing</td><td>Used nowadays for better finish; usually finishing</td></tr>
<tr><td>2</td><td>Conventional milling</td><td>Climb milling</td></tr>
<tr><td>3</td><td>Cutter rotates against the feed</td><td>Cutter rotates with the feed</td></tr>
<tr><td>4</td><td>Cutting force acts upward (tends to lift the work)</td><td>Cutting force acts downward (presses work to the table)</td></tr>
<tr><td>5</td><td>Takes a large amount of force</td><td>Needs less force</td></tr>
<tr><td>6</td><td>Generates more heat</td><td>Generates less heat</td></tr>
<tr><td>7</td><td>Chip thickness increases gradually (zero at start)</td><td>Chip thickness decreases gradually (maximum at start)</td></tr>
<tr><td>8</td><td>Chips thrown upward</td><td>Chips removed downward</td></tr>
<tr><td>9</td><td>Less suitable for chip management</td><td>More suitable for chip management</td></tr>
<tr><td>10</td><td>For brass, bronze and ferrous materials; lower MRR</td><td>For aluminium and its alloys; higher MRR</td></tr>
<tr><td>11</td><td>Higher tool wear (cutter turns against feed)</td><td>Lower tool wear</td></tr>
<tr><td>12</td><td>Shorter tool life</td><td>Longer tool life</td></tr>
<tr><td>13</td><td>Backlash eliminator not required</td><td>Backlash eliminator required, especially on old machines</td></tr>
</tbody></table></div>
<h4>Which is preferred?</h4>
<ol>
<li><b>Down milling is preferred</b> where the machine allows it (rigid CNC or machines with a backlash eliminator): better surface finish, less power and heat, longer tool life, higher MRR, easier chip removal, and the downward force holds the work.</li>
<li><b>Up milling</b> is the conventional choice on ordinary manual machines (backlash between lead screw and nut is eliminated by the cutting force opposing the feed), and for scaly or hard-skinned castings and forgings. Roughing is usually done by up milling.</li>
<li>Conclusion: use down milling for finishing on machines with no backlash; use up milling when backlash cannot be eliminated or the surface is hard/scaled.</li>
</ol>
<p><b>Sketch:</b> two diagrams of a cutter over a work-piece with the table-feed arrow. Up milling: cutter rotation opposite to the feed, chip thin at entry and thick at exit, force pointing up. Down milling: rotation same as the feed, chip thick at entry, thin at exit, force pointing down.</p>`
  },
  {
    ids: ['2021-22_2c', '2020-21_3a'],
    title: 'Derivation of the approach length A in milling',
    numerical: false,
    html: `
<p><b>Approach length A</b> is the distance the cutter travels from the first touch with the work to the position at which it is fully engaged at the set depth. It adds to the length of cut: Tm = (L + A + O)/fr.</p>
<h4>Slab (horizontal, peripheral) milling</h4>
<ol class="steps">
<li>Let D = cutter diameter, d = depth of cut. The cutter radius R = D/2 is the hypotenuse of a right triangle.</li>
<li>The cutter axis is at height D/2 − d above the work surface: this is the vertical side δ = D/2 − d. The horizontal side is A.</li>
<li>Pythagoras: (D/2)² = A² + (D/2 − d)².</li>
<li>A² = D²/4 − (D²/4 − Dd + d²) = Dd − d² = d(D − d).</li>
<li><b>A = √(d(D − d))</b>.</li>
</ol>
<h4>Face milling</h4>
<ol class="steps">
<li><b>Case 1 (cutter centred over the work):</b> the cutter first touches the work after travelling a radius, so <b>A = O = D/2</b>.</li>
<li><b>Case 2 (cutter offset, width of work w &lt; D):</b> the cutter axis is offset from the work edge, the triangle has hypotenuse D/2 and vertical side D/2 − w, so A² = (D/2)² − (D/2 − w)² = w(D − w), giving <b>A = O = √(w(D − w))</b>.</li>
</ol>
<p><b>Sketch:</b> circle of the cutter, work top surface, vertical drop d, radius, δ = D/2 − d and the horizontal distance A marked in the right triangle.</p>`
  },
  {
    ids: ['2018-19_7c'],
    title: 'Approach distance for slab milling and face milling (with solved examples, slides 74 and 75)',
    numerical: true,
    html: `
<h4>Derivations</h4>
<ol class="steps">
<li><b>Slab milling:</b> radius D/2 is the hypotenuse; vertical side D/2 − d; horizontal side A. (D/2)² = A² + (D/2 − d)², so <b>A = √(d(D − d))</b>. Tm = (L + A)/fr (add over-travel O if needed).</li>
<li><b>Face milling, case 1 (cutter centred over the work):</b> <b>A = O = D/2</b>, so Tm = (L + D)/fr.</li>
<li><b>Face milling, case 2 (cutter offset, w &lt; D):</b> triangle with hypotenuse D/2 and vertical side D/2 − w: A² = (D/2)² − (D/2 − w)² = w(D − w), so <b>A = O = √(w(D − w))</b> and Tm = (L + 2A)/fr.</li>
<li>Feed rate: fr = N·nt·f, N = 1000V/(πD). MRR = w·d·fr.</li>
</ol>
<h4>Example 1 (slide 74): slab milling</h4>
<p>C50 steel surface 150 × 100 mm, HSS slab mill Ø100 × 150 wide, 8 teeth, d = 2 mm in one pass, V = 20 m/min, f = 0.13 mm/tooth. Assumption: the cutter width (150 mm) spans the 150 mm side, so the feed is along the 100 mm side, L = 100 mm; over-travel neglected.</p>
<ol class="steps">
<li>N = 1000 × 20/(π × 100) = <b>63.66 rpm</b>.</li>
<li>fr = N·nt·f = 63.66 × 8 × 0.13 = <b>66.21 mm/min</b>.</li>
<li>A = √(2 × (100 − 2)) = <b>14.0 mm</b>.</li>
<li>Tm = (L + A)/fr = (100 + 14.0)/66.21 = <b>1.72 min</b> (103 s).</li>
<li>MRR = w·d·fr = 150 × 2 × 66.21 = <b>19 860 mm³/min</b>.</li>
</ol>
<p class="muted small">If the feed were along the 150 mm side the time would be (150 + 14)/66.21 = 2.48 min.</p>
<h4>Example 2 (slide 75): face milling</h4>
<p>Surface 115 mm wide × 250 mm long, d = 6 mm, 16-tooth carbide face mill Ø150, V = 60 m/min, f = 0.18 mm/tooth (slide text reads "0.1 8"). Cutter taken centred over the work (case 1: A = O = D/2).</p>
<ol class="steps">
<li>N = 1000 × 60/(π × 150) = <b>127.3 rpm</b>.</li>
<li>fr = 127.3 × 16 × 0.18 = <b>366.7 mm/min</b>.</li>
<li>A = O = D/2 = <b>75 mm</b>.</li>
<li>Tm = (L + A + O)/fr = (250 + 75 + 75)/366.7 = <b>1.09 min</b> (65 s).</li>
<li>MRR = w·d·fr = 115 × 6 × 366.7 = <b>253 000 mm³/min</b> (253 cm³/min).</li>
</ol>
<p class="muted small">If the offset formula (case 2) were used: A = O = √(115 × 35) = 63.4 mm and Tm = (250 + 126.9)/366.7 = 1.03 min.</p>
<div class="callout">Answers: Example 1: Tm = 1.72 min; Example 2: Tm = 1.09 min, MRR = 2.53 × 10⁵ mm³/min.</div>`
  },
  {
    ids: ['2023-24_6d'],
    title: 'Approach length derivation and machining time with an 8-tooth Ø32 HSS end mill',
    numerical: true,
    html: `
<h4>Part 1: derivation (5 marks)</h4>
<ol class="steps">
<li>The cutter (radius D/2) first touches the work edge; full depth d is reached when the axis is directly above the entry point.</li>
<li>Right triangle: hypotenuse D/2, vertical side D/2 − d, horizontal side A.</li>
<li>(D/2)² = A² + (D/2 − d)², so A² = d(D − d).</li>
<li><b>A = √(d(D − d))</b>.</li>
</ol>
<h4>Part 2: machining time (10 marks)</h4>
<p><b>Given:</b> flat surface length L = 150 mm, depth of cut d = 15 mm, 8-tooth HSS end mill D = 32 mm, V = 30 m/min, f = 0.15 mm/tooth.</p>
<p><b>Assumption:</b> the cutter axis is parallel to the table (horizontal milling) so the slab-milling approach applies, with d = 15 mm &lt; D/2 = 16 mm; the width of the surface is covered in the same pass (width not given); the over-travel is taken as zero (cutter leaves the work at the end of the cut).</p>
<ol class="steps">
<li>N = 1000V/(πD) = 1000 × 30/(π × 32) = <b>298.4 rpm</b>.</li>
<li>fr = N·nt·f = 298.4 × 8 × 0.15 = <b>358.1 mm/min</b>.</li>
<li>A = √(15 × (32 − 15)) = √255 = <b>15.97 mm</b>.</li>
<li>Tm = (L + A)/fr = (150 + 15.97)/358.1 = <b>0.463 min</b> (about 27.8 s).</li>
</ol>
<div class="callout">Answer: A = 15.97 mm, N = 298.4 rpm, fr = 358.1 mm/min, Tm = 0.463 min. (If an equal over-travel O = A is also allowed: Tm = (150 + 2 × 15.97)/358.1 = 0.508 min.)</div>`
  },

  /* ---------------------------------------------------------------- SHAPING */
  {
    ids: ['2023-24_5a', '2021-22_2a', '2016-17_6a'],
    title: 'Effect of feed per stroke on surface roughness in shaping',
    numerical: false,
    html: `
<ol>
<li><b>Feed per stroke</b> f (mm/stroke) is the sideways distance the work (or tool) is advanced after each stroke, at right angles to the cutting direction.</li>
<li>Between two successive strokes the tool leaves a ridge (scallop); the peak-to-valley height h grows with feed, approximately <b>h ≈ f²/(8r)</b> for a tool nose radius r. Therefore roughness increases with feed.</li>
<li><b>Large feed:</b> rough surface, higher cutting force and power, but higher MRR, fewer strokes and a short machining time.</li>
<li><b>Small feed:</b> smooth surface, lower force, but more strokes (strokes = width/f) and a long machining time.</li>
<li>Practice: use a coarse feed with greater depth for roughing; a fine feed with a broad-nosed finishing tool for the final pass.</li>
<li>Very large feed also causes chatter and tool breakage.</li>
</ol>
<p><b>Sketch:</b> the work surface cross-section showing scallops of height h at spacing f, with the tool nose of radius r.</p>`
  },
  {
    ids: ['2021-22_2b', '2018-19_6c', '2017-18_6b'],
    title: 'Shaping vs planing: differences, similarities and common geometry',
    numerical: false,
    html: `
<p>Both are single-point reciprocating processes producing flat surfaces, slots and grooves. <b>Main difference:</b> in shaping the <b>tool reciprocates</b> and the work is fed; in planing the <b>work reciprocates</b> and the tool is fed.</p>
<h4>Differences</h4>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Shaping</th><th>Planing</th></tr></thead>
<tbody>
<tr><td>Cutting motion</td><td>Tool (ram) reciprocates</td><td>Work (table) reciprocates</td></tr>
<tr><td>Feed</td><td>Work moved sideways each stroke</td><td>Tool head moved sideways each stroke</td></tr>
<tr><td>Work size</td><td>Small to medium</td><td>Large, heavy work</td></tr>
<tr><td>Cutting velocity</td><td>Varies along stroke (crank): zero, max, zero</td><td>Linear, constant along the cutting path</td></tr>
<tr><td>Machine</td><td>Light, low cost</td><td>Heavy, rigid, costly</td></tr>
<tr><td>Tools</td><td>Single tool</td><td>Several tools simultaneously</td></tr>
</tbody></table></div>
<h4>Similarities</h4>
<ol>
<li>Both are conventional, subtractive (material removed layer by layer as chips).</li>
<li>Both use general-purpose machines and a single-point tool (one edge cutting at a time).</li>
<li>Neither uses rotary motion: reciprocating motion gives V, f and d.</li>
<li>Both have forward cutting and idle return strokes with a quick-return mechanism.</li>
<li>Similar applications: flat surfaces, slots, grooves, T-slots, V-blocks; no curved (circular or parabolic) slots.</li>
</ol>
<h4>Common geometry</h4>
<p>Flat surface, chuck key, V-block, dovetail, external and internal keyways, rack, and a contour (marked work).</p>
<p><b>Sketch:</b> a V-block, a dovetail, an external keyway, and a rack, drawn as the cross-sections produced.</p>`
  },
  {
    ids: ['2013-14_6d'],
    title: 'Kinematics of shaping and planing; shaper size and width',
    numerical: false,
    html: `
<h4>Shaping kinematics</h4>
<ol>
<li><b>Cutting motion:</b> reciprocating straight-line motion of the tool on the ram, forward stroke cutting at V, quick idle return.</li>
<li><b>Feed motion:</b> intermittent sideways movement of the table (work) at the end or beginning of each stroke, in mm/stroke, at right angles to the cutting direction.</li>
<li><b>Depth of cut:</b> set by lowering the tool head or raising the table/saddle.</li>
<li>V is not constant along the stroke: zero at the start, maximum mid-stroke, zero at the end.</li>
</ol>
<h4>Planing kinematics</h4>
<ol>
<li><b>Cutting motion:</b> reciprocation of the <b>work</b> on the table, constant speed along the cut; the tool is fixed.</li>
<li><b>Feed:</b> the tool head moves sideways intermittently on the cross-rail at the end of each stroke; depth by cross-rail or head adjustment.</li>
</ol>
<h4>Shaper size and width</h4>
<ol>
<li><b>Size</b> = the maximum length of stroke it can take (typically 16 - 24 in; 2 - 5 hp motors).</li>
<li><b>Width</b> = maximum width that can be cut, which depends on the table movement; most shapers have a width capacity equal to or greater than the stroke; maximum vertical height available is about 12 - 15 in.</li>
</ol>
<p><b>Sketch:</b> shaper: tool on ram with a double arrow (V), work on table with a feed arrow (f), depth arrow (d); planer: work on a reciprocating table, tool on a cross-rail.</p>`
  },
  {
    ids: ['2023-24_5c', '2022-23_7c', '2020-21_1c', '2016-17_6c', '2014-15_6c', '2012-13_5d'],
    title: 'Quick return and the hydraulic shaper: working, advantages and disadvantages',
    numerical: false,
    html: `
<h4>Quick return mechanism: what and why</h4>
<ol>
<li>A shaper cuts only in the forward stroke; the return stroke is idle (auxiliary). A <b>quick return mechanism</b> makes the return stroke faster than the forward cutting stroke.</li>
<li>It is used to reduce idle (non-cutting) time and so raise productivity.</li>
<li>Mechanical type: the bull gear carries a crank pin that slides in the slot of a rocker arm (slotted link); the arm oscillates and drives the ram through a link. The forward stroke takes a larger crank angle (e.g. 220°) than the return (140°). Speed varies along the stroke.</li>
</ol>
<h4>Hydraulic shaper: how it achieves quick return</h4>
<ol>
<li>The ram is connected to a <b>hydraulic cylinder</b>. A pump delivers fluid through a <b>control valve</b> to either side of the piston; the valve is also connected to the reservoir.</li>
<li>For the cutting stroke the fluid is directed behind the piston; for the return stroke the valve reverses the flow and the ram returns at a higher speed (a larger flow rate to the rod side, as set by the flow-control valve).</li>
<li>A <b>flow-control valve</b> sets the quantity of fluid and so the speed of the ram.</li>
<li>An <b>adjustable trip dog</b> on the ram operates a lever which shifts the valve to reverse the ram at the set stroke ends; a finger lever starts and stops the machine.</li>
</ol>
<h4>Advantages over mechanical</h4>
<ol>
<li>Cutting speed is <b>constant</b> throughout the stroke (unlike the crank, where it varies continuously).</li>
<li>Constant power, so the full capacity of the tool is used.</li>
<li>Ram reverses quickly without shock, since the inertia of moving parts is small.</li>
<li>A large range and number of speeds is possible.</li>
<li>More strokes per minute due to less reversal time and return time.</li>
</ol>
<h4>Disadvantages</h4>
<ol>
<li>More expensive than a mechanical shaper.</li>
<li>The stopping point of the cutting stroke can vary with the resistance offered by the work material (less positive).</li>
<li>Oil leakage and maintenance of pumps, valves and seals.</li>
</ol>
<p><b>Sketch:</b> a cylinder with a piston and ram, a pump, a reservoir, a control valve with two lines to the cylinder, an adjustable trip dog on the ram operating the valve lever, and arrows for the forward and return strokes.</p>`
  },
  {
    ids: ['2009-10_6c'],
    title: 'Need for a clapper box; hydraulic vs mechanical shaper',
    numerical: false,
    html: `
<h4>Need for a clapper box</h4>
<ol>
<li>On the return stroke the cutting tool drags over the machined surface. The clapper box is hinged so that the tool block <b>lifts (swings up)</b> about the pin, and the tool slides lightly over the work.</li>
<li>On the forward stroke the cutting force presses the block against the solid seat so the tool is rigid.</li>
<li>It prevents rubbing, blunting and chipping of the tool edge and scoring of the finished surface, and stops the tool digging in. On large shapers the block is lifted automatically (mechanical, air or hydraulic).</li>
</ol>
<h4>Hydraulic vs mechanical shaper</h4>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Hydraulic</th><th>Mechanical (crank)</th></tr></thead>
<tbody>
<tr><td>Cutting speed</td><td>Constant over the stroke</td><td>Varies along the stroke</td></tr>
<tr><td>Power used</td><td>Constant; full tool capacity used</td><td>Not fully used</td></tr>
<tr><td>Reversal</td><td>Quick, without shock</td><td>Impact due to inertia</td></tr>
<tr><td>Speeds</td><td>Wide range and number</td><td>Limited by gears</td></tr>
<tr><td>Strokes per minute</td><td>More</td><td>Fewer</td></tr>
<tr><td>Cost</td><td>Higher (disadvantage)</td><td>Lower</td></tr>
<tr><td>Stroke end</td><td>May vary with cutting resistance</td><td>Positive, fixed</td></tr>
</tbody></table></div>`
  },
  {
    ids: ['2016-17_6d'],
    title: 'Shaper at 22 000 mm/min, job 240 × 100: stroke times, total time, strokes per minute (and slide-104 example)',
    numerical: true,
    html: `
<h4>Given</h4>
<p>Cutting speed V = 22 000 mm/min, job 240 mm long × 100 mm wide, f = 0.6 mm/stroke, d = 3 mm, forward stroke in 220° of crank rotation, clearance 25 mm.</p>
<p><b>Assumptions:</b> total clearance of 25 mm is added to the job length (stroke length = 240 + 25 = 265 mm); the depth of material to be removed is not given in the extracted question, so the slide-104 value of <b>6 mm</b> is used (2 passes of 3 mm, with width 100 mm fed across); the return crank angle is 360° − 220° = 140°.</p>
<ol class="steps">
<li>Stroke length S = 240 + 25 = <b>265 mm</b>.</li>
<li><b>Forward stroke time</b> tf = S/V = 265/22 000 = 0.01205 min = <b>0.723 s</b>.</li>
<li><b>Return stroke time</b> tr = tf × 140/220 = 0.01205 × 0.6364 = 0.00767 min = <b>0.460 s</b>.</li>
<li>Time per cycle = 0.01205 + 0.00767 = 0.01971 min = 1.183 s.</li>
<li><b>Strokes per minute</b> = 1/0.01971 = <b>50.7 strokes/min</b>.</li>
<li>Strokes per pass = width/feed = 100/0.6 = 166.7, so <b>167 strokes</b>.</li>
<li>Passes = 6/3 = <b>2</b>.</li>
<li><b>Total machining time</b> = 2 × 167 × 0.01971 = <b>6.58 min</b> (395 s). (One pass: 3.29 min.)</li>
<li>MRR = f·d·L·n = 0.6 × 3 × 240 × 50.73 = 21 900 mm³/min.</li>
</ol>
<div class="callout">Answers: tf = 0.723 s; tr = 0.460 s; strokes/min = 50.7; total time = 6.58 min for 6 mm removal (3.29 min if only 3 mm).</div>
<h4>Slide-104 example (Q1) solved</h4>
<p>24 000 mm/min, 250 × 120 mm, f = 0.6, d = 3, forward in 220°, height to be reduced 6 mm. The clearance is not in the extracted text; 25 mm is assumed as above (stroke 275 mm).</p>
<ol class="steps">
<li>tf = 275/24 000 = 0.01146 min = 0.688 s; tr = tf × 140/220 = 0.00729 min = 0.438 s.</li>
<li>Cycle = 1.125 s, so 53.3 strokes/min.</li>
<li>Strokes = 120/0.6 = 200; passes = 6/3 = 2; total = 400 strokes × 1.125 s = 450 s = <b>7.5 min</b>.</li>
<li>MRR = 0.6 × 3 × 250 × 53.33 = 24 000 mm³/min.</li>
</ol>`
  },

  /* ---------------------------------------------------------------- Shaper tool geometry */
  {
    ids: ['2015-16_4d', '2010-11_7a', '2011-12_6b'],
    title: 'Clapper box, strain-back effect and why shaper tool clearance is less than 4°',
    numerical: false,
    html: `
<h4>Clapper box (how it saves the tool)</h4>
<ol>
<li>The tool post is on a clapper block hinged by a pin in the clapper box on the down-feed slide. On the cutting stroke the force presses the block against the seat, so the tool is rigid.</li>
<li>On the return stroke the tool drags on the work, the block swings up about the pin, the tool lifts and slides lightly over the surface: no rubbing, blunting or scoring.</li>
<li>If the tool is strained back and springs forward, the hinge lets it swing up and away rather than dig in.</li>
</ol>
<h4>Strain-back effect</h4>
<ol>
<li>During cutting, the force elastically deflects the ram, tool head, tool holder and overhung tool backward about the clapper hinge.</li>
<li>At the end of the cut or when a hard spot is passed and the load drops suddenly, the stored elastic energy is released and the tool springs back into the work.</li>
<li>A tool with a large clearance (weak point) would dig in, gouge the surface and may break.</li>
</ol>
<h4>Why clearance angle &lt; 4°</h4>
<ol>
<li>Cutting is intermittent with impact on every stroke: a small clearance leaves more metal behind the edge, so the edge is stronger.</li>
<li>With strain-back, a small clearance makes the flank rub lightly and supports the tool instead of letting it dig.</li>
<li>The cut surface is flat and the tool path is straight (not a helix as in turning), so a large clearance is not needed to avoid rubbing.</li>
<li>Better heat dissipation and fewer regrinds.</li>
</ol>
<p><b>Sketch:</b> the clapper box with the hinge pin, tool post and seat; show the block lifted on the return stroke; show a tool with clearance angle marked.</p>
<p class="note-tag">See Answer Note J</p>`
  },

  /* ---------------------------------------------------------------- GRINDING */
  {
    ids: ['2021-22_1a'],
    title: "Hard wheel for soft material and soft wheel for hard material: why?",
    numerical: false,
    html: `
<ol>
<li>The grade (hardness) of a wheel is the <b>strength of the bond holding the grains</b>. It is not the hardness of the abrasive.</li>
<li><b>Hard material:</b> grains dull quickly. A <b>soft-grade wheel</b> lets the dull grains break away (or be pulled out) under the cutting force, exposing fresh sharp grains. This prevents glazing, heat and burning. A hard wheel would hold the dull grains and glaze.</li>
<li><b>Soft material:</b> grains stay sharp for a long time and the cutting force is low. A <b>hard-grade wheel</b> holds the grains, so the wheel wears slowly and keeps its shape. A soft wheel would shed useful sharp grains too early and wear rapidly.</li>
<li>Therefore: soft work, hard wheel; hard work, soft wheel. Grade runs from A (soft) to Z (hard).</li>
</ol>`
  },
  {
    ids: ['2020-21_2a', '2014-15_5c', '2012-13_6a'],
    title: 'Grinding wheel parameters that influence performance',
    numerical: false,
    html: `
<p>The properties of a wheel that determine how it acts are the kind and size of abrasive, how closely the grains are packed and the amount of bond. Five parameters:</p>
<ol>
<li><b>Abrasive:</b> hard, tough, and friable (self-sharpening). Aluminium oxide: hardened steels, HSS, steels, cast iron. Silicon carbide: carbides, aluminium, brass, brittle materials. CBN: tool steels, aerospace alloys. Diamond: ceramics, cemented carbides.</li>
<li><b>Grain (grit) size:</b> screen mesh number, 6 (very coarse) to 600 (very fine). Small grits give a fine finish with small depth of cut; large grits give a larger MRR.</li>
<li><b>Bond:</b> holds the grains and gives the wheel its shape. Vitrified (ceramic, most common, strong, rigid, heat-resistant, brittle), resinoid (thermosetting resin, rough grinding and cut-off), rubber (flexible; cut-off wheels, regulating wheels, fine finish), metallic (bronze; diamond and CBN wheels, electrolytic grinding).</li>
<li><b>Grade (hardness):</b> bond strength holding the grains, A (soft) to Z (hard). Soft for hard work, hard for soft work.</li>
<li><b>Structure:</b> grain spacing, 1 (dense) to 17 (open). Open: high stock removal, chip clearance, less loading, rougher finish. Dense: better finish and accuracy.</li>
</ol>
<p><b>Marking example:</b> A 60 K 5 V = aluminium oxide, grit 60, grade K, structure 5, vitrified bond.</p>
<p><b>Sketch:</b> a magnified wheel section showing grains, bond bridges and pores.</p>`
  },
  {
    ids: ['2015-16_3c', '2009-10_5d'],
    title: 'Grain size (20 grit), grade and structure of a grinding wheel',
    numerical: false,
    html: `
<ol>
<li><b>Grain (grit) size:</b> the average size of the abrasive grains, found by passing them through a screen mesh. The number is roughly the number of mesh openings per linear inch, so <b>smaller grit = larger number</b>. Range 6 (very coarse) to 600 (very fine); up to 1000 for superfinishing. <b>20 grit</b> therefore means a very coarse grain for fast stock removal with a rough finish. Small grains give a good surface finish; large grains give a high MRR.</li>
<li><b>Grade:</b> the hardness of the wheel: the ability of the bond to hold the grains in place, A (soft) to Z (hard) (A–H soft, I–P medium, Q–Z hard). A soft grade releases dull grains (hard work); a hard grade retains grains (soft work). It is independent of the abrasive hardness.</li>
<li><b>Structure:</b> the spacing of the abrasive grains, from dense (1) to open (17). Open structure has more pores, which carry chips and coolant and avoid loading, used for large stock removal; dense structure gives a better finish and accuracy.</li>
</ol>`
  },
  {
    ids: ['2011-12_7a'],
    title: 'Appropriate density (structure) of abrasives in a grinding wheel',
    numerical: false,
    html: `
<ol>
<li>The wheel structure (density) is the grain spacing: <b>1 (densest) to 17 (least dense)</b>; open means more pores and fewer grains per unit volume.</li>
<li>The pores give <b>chip clearance</b> and carry coolant. The right density is a compromise between the number of cutting points and chip room.</li>
<li><b>Open structure (wide spacing):</b> for high stock removal, large contact area, soft/ductile (gummy) materials; avoids <b>loading</b>, runs cooler, can take deeper/wider cut with less coolant, but leaves a rough surface.</li>
<li><b>Dense structure (close spacing):</b> for finishing, precision, hard and brittle work, light cuts: more cutting points per area give a better finish and form retention, but chips cannot escape easily, so loading and heat occur if used for heavy removal.</li>
<li>Medium structure is used for general purpose grinding. Hence there is no single density; it is chosen according to the material, stock removal and finish.</li>
</ol>`
  },
  {
    ids: ['2013-14_6b', '2012-13_6b'],
    title: 'Classification of grinding by surface produced',
    numerical: false,
    html: `
<p>Based on the surface produced, grinding is of three types: <b>surface, cylindrical and centreless</b>.</p>
<ol>
<li><b>Surface grinding:</b> the most common; a rotating wheel grinds flat surfaces. Types: <b>horizontal-spindle</b> (periphery of the wheel) or <b>vertical-spindle</b> (face of the wheel), with <b>reciprocating or rotary table</b>. Work is held on a magnetic chuck.</li>
<li><b>Cylindrical grinding:</b> <b>external</b> (centre-type): work between centres rotates; wheel rotates in a separate motor at a different speed; removes cylindrical surfaces and shoulders; wheel axis adjustable for tapers. <b>Internal</b>: grinds the inside diameter, tapered holes with a swivelling wheel head.</li>
<li><b>Centreless grinding:</b> work supported on a rest blade between a grinding wheel and a tilted regulating wheel; no centres; through-feed, plunge, internal variants.</li>
</ol>
<p><b>Sketch:</b> horizontal-spindle surface grinder (wheel over work on a table); external cylindrical (work between centres with a wheel); centreless (grinding wheel, regulating wheel, work on a blade).</p>`
  },
  {
    ids: ['2018-19_8a'],
    title: 'Grinding processes to finish all surfaces of a hollow cylindrical part',
    numerical: false,
    html: `
<p>A hollow cylinder has an outer cylindrical surface, an inner (bore) surface and two flat ends (possibly shoulders). Processes:</p>
<ol>
<li><b>Outside diameter:</b> <b>external cylindrical grinding</b> (centre-type): mount the part on a mandrel between centres (or use a centreless grinder in through-feed for long tubes or many parts); the wheel rotates against the rotating work; feed along the length.</li>
<li><b>Bore (inside diameter):</b> <b>internal cylindrical grinding</b>: the part is held in a chuck and rotates; a small-diameter wheel rotates at high speed inside the bore and traverses along it. Tapered bores by swivelling. For rings and sleeves, internal centreless grinding with three rolls is possible.</li>
<li><b>End faces and shoulders:</b> <b>surface grinding</b> (horizontal- or vertical-spindle, rotary or reciprocating table, magnetic chuck or fixture), or grinding the faces/shoulders on a cylindrical grinder with an angled wheel.</li>
<li><b>Order:</b> grind the bore first (a reference), then mount the part on a mandrel on the bore and grind the OD and faces concentric with it.</li>
</ol>
<p><b>Sketch:</b> a hollow cylinder with three small views: OD grinding (wheel outside), bore grinding (small wheel inside), and face grinding on a surface grinder.</p>`
  },
  {
    ids: ['2016-17_7b', '2009-10_5c'],
    title: 'Centreless grinding',
    numerical: false,
    html: `
<ol>
<li><b>Definition:</b> a process for continuously grinding cylindrical surfaces in which the workpiece is supported <b>not by centres or chucks but by a rest blade</b>, and is ground between two wheels.</li>
<li><b>Grinding wheel:</b> the larger wheel that does the cutting.</li>
<li><b>Regulating wheel:</b> the smaller (rubber-bonded) wheel, tilted at a small angle <b>i</b>, which controls the rotation of the work and its axial feed velocity Vf.</li>
<li><b>Work rest blade:</b> supports the work between the wheels, with the work centre set slightly above the wheel centre line to produce roundness.</li>
<li><b>Types:</b> external or internal; <b>traverse (through) feed</b> (most common: work moves axially through the wheels) and <b>plunge feed</b> (for parts with variable diameter: bolts, valve tappets, distributor shafts). Internal: ring supported between three rolls.</li>
<li><b>Applications:</b> roller bearings, piston pins, shafts, bars.</li>
<li><b>Advantages:</b> no centring or chucking, fast, continuous, easily automated, good roundness, long thin parts supported without deflection.</li>
</ol>
<p><b>Sketch:</b> end view with the grinding wheel on one side, the regulating wheel on the other, the work resting on the blade between them; top view showing the tilt angle i of the regulating wheel and the axial motion Vf.</p>`
  },
  {
    ids: ['2021-22_3b'],
    title: 'Creep-feed grinding and how it differs from conventional grinding',
    numerical: false,
    html: `
<p><b>Creep-feed grinding:</b> a grinding process that removes a deep amount of material (depth of cut up to about <b>6 mm</b>) in a <b>single, slow pass</b> at a very low workpiece speed, so that it competes with milling, shaping and planing. Wheels are mostly softer-grade, resin-bonded and open-structure to keep temperature low.</p>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Creep-feed grinding</th><th>Conventional grinding</th></tr></thead>
<tbody>
<tr><td>Depth of cut</td><td>Large (to 6 mm)</td><td>Small</td></tr>
<tr><td>Work speed</td><td>Very low</td><td>Higher</td></tr>
<tr><td>Passes</td><td>One</td><td>Many</td></tr>
<tr><td>Wheel</td><td>Soft, open, resin bond; continuously dressed</td><td>Harder, denser</td></tr>
<tr><td>Forces and power</td><td>High (40 - 120 kW)</td><td>Lower</td></tr>
<tr><td>Idle time</td><td>Reduced (no table reversals)</td><td>More reversals</td></tr>
<tr><td>Heat / coolant</td><td>High thermal load, high flow coolant</td><td>Moderate</td></tr>
<tr><td>Use</td><td>Deep slots, profiles, superalloys</td><td>Finishing</td></tr>
</tbody></table></div>
<p><b>Advantages:</b> high MRR, precision, good surface finish, reduced machine wear, longer wheel life, versatile for hard materials. <b>Disadvantages:</b> thermal damage, costly rigid machine, special coolant/dressing equipment, high forces.</p>
<p><b>Sketch:</b> a wheel making one deep cut of depth up to 6 mm in the work at a slow feed, next to a conventional shallow cut.</p>`
  },
  {
    ids: ['2020-21_2b'],
    title: 'Creep-feed grinding, centreless grinding, super-finishing and honing',
    numerical: false,
    html: `
<ol>
<li><b>Creep-feed grinding:</b> a deep cut (up to 6 mm) in one slow pass with a soft, open, resin-bonded wheel; high MRR, few reversals; needs a rigid, high-power machine and abundant coolant, and continuous dressing.</li>
<li><b>Centreless grinding:</b> the work rests on a blade between a larger grinding wheel and a smaller tilted regulating wheel; the regulating wheel controls rotation and axial feed; no centres or chucks; through-feed and plunge types.</li>
<li><b>Honing:</b> a low-speed finishing process mainly for internal cylindrical holes (engine bores). A honing head with 4 - 6 abrasive sticks (Al₂O₃/SiC, grit 80 - 600, or diamond/CBN) is pressed outward on the bore (0.5 - 3 MPa) and is <b>rotated and reciprocated axially</b>, leaving a cross-hatch pattern (30 - 60°) that holds oil. The tool floats, so it follows the existing axis and corrects size, roundness and taper but not position. Ra about 0.1 - 0.8 µm; stock removal 0.02 - 0.5 mm; honing oil as coolant.</li>
<li><b>Super-finishing:</b> removes the smeared surface layer (1 - 2 µm) left by grinding on external surfaces such as bearing races and crankpins. A fine-grit stone (grit 400 - 1000+) at low pressure (0.1 - 0.3 MPa) oscillates with short rapid strokes (amplitude 1 - 5 mm, 500 - 2000 cycles/min) against the rotating work, with a lubricant. The action stops by itself as the surface smooths. Ra 0.01 - 0.1 µm.</li>
</ol>
<p><b>Sketch:</b> (i) wheel with deep cut; (ii) wheels and blade; (iii) stone oscillating on a rotating shaft; (iv) honing head in a bore with rotation and reciprocation arrows.</p>
<p class="note-tag">See Answer Note L</p>`
  },
  {
    ids: ['2016-17_6b'],
    title: 'Major wheel defects in grinding: glazing and loading (with dressing and truing)',
    numerical: false,
    html: `
<ol>
<li><b>Glazing:</b> after continued use the wheel becomes dull and its face acquires a <b>glass-like appearance</b>: the cutting points of the abrasives are dull and worn down to the bond. The wheel face becomes smooth, stops cutting, rubs and heats the work. Causes: too hard a wheel for the work, high speed, light feed.</li>
<li><b>Loading:</b> the cutting face becomes filled and clogged with <b>chips of the workpiece material</b> in the pores, preventing grinding. Occurs when grinding <b>softer (ductile) materials</b>, with a fine grit or dense structure or insufficient coolant.</li>
<li><b>Out-of-balance and out-of-true wheel:</b> poor surface and strain on the machine; balanced by moving weights around the flange.</li>
</ol>
<h4>Remedies</h4>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Dressing</th><th>Truing</th></tr></thead>
<tbody>
<tr><td>Purpose</td><td>Removes loading and breaks the glazed surface to expose sharp grains</td><td>Restores the wheel geometry/shape and concentricity</td></tr>
<tr><td>Produces</td><td>Micro-geometry</td><td>Macro-geometry</td></tr>
</tbody></table></div>`
  },

  /* ---------------------------------------------------------------- Grinding numerical */
  {
    ids: ['2023-24_8b'],
    title: 'Why specific energy in grinding is much greater than in conventional machining',
    numerical: false,
    html: `
<p>Specific energy (energy per unit volume removed) is about <b>10 - 60 J/mm³</b> in grinding against about 1 - 5 J/mm³ in turning or milling. Reasons:</p>
<ol>
<li><b>Size effect:</b> the undeformed chip thickness is only a few micrometres; at this scale the shear strength of the metal is higher, so more energy is needed per unit volume.</li>
<li><b>Large negative rake angles</b> of the randomly oriented abrasive grains (about −30° to −60°) give a high shear strain and high force.</li>
<li><b>Rubbing and ploughing:</b> many grains only rub (wear flats) or plough the surface (plastic flow without a chip), consuming energy without removing material.</li>
<li><b>High speed and a dull or loaded wheel</b> (about 30 - 60 m/s) give high friction; most of the energy becomes heat.</li>
<li>The bond also rubs on the work.</li>
</ol>
<p class="note-tag">See Answer Note K</p>`
  },
  {
    ids: ['2017-18_7c'],
    title: 'Surface grinding: contact length, MRR, chips per time, volume per chip, specific energy',
    numerical: true,
    html: `
<h4>Given</h4>
<p>Wheel D = 200 mm, width 25 mm, N = 2400 rpm, infeed d = 0.05 mm, crossfeed w = 3.5 mm, work speed vw = 6 m/min = 6000 mm/min, grit density C = 64 grits/cm² = 0.64 /mm², tangential force Fc = 25 N.</p>
<ol class="steps">
<li><b>Length of contact</b> lc = √(D·d) = √(200 × 0.05) = √10 = <b>3.16 mm</b>.</li>
<li><b>MRR</b> = vw·w·d = 6000 × 3.5 × 0.05 = <b>1050 mm³/min</b> (17.5 mm³/s).</li>
<li>Wheel speed v = πDN = π × 200 × 2400 = 1.508 × 10⁶ mm/min (25.13 m/s).</li>
<li><b>Chips per unit time</b> nc = v·w·C = 1.508 × 10⁶ × 3.5 × 0.64 = 3.38 × 10⁶ chips/min = <b>56 300 chips/s</b>.</li>
<li><b>Average volume per chip</b> = MRR/nc = 1050/3.378 × 10⁶ = <b>3.11 × 10⁻⁴ mm³</b>.</li>
<li><b>Specific energy:</b> power P = Fc·v = 25 × 25.13 = 628.3 W; U = P/MRR = 628.3/17.5 = <b>35.9 J/mm³</b>.</li>
</ol>
<div class="callout">Answers: lc = 3.16 mm; MRR = 1050 mm³/min; 3.38 × 10⁶ chips/min; 3.11 × 10⁻⁴ mm³ per chip; U = 35.9 J/mm³ (compare about 2 - 3 J/mm³ for turning steel: size effect).</div>
<p class="note-tag">See Answer Note K</p>`
  },

  /* ---------------------------------------------------------------- DRILLING */
  {
    ids: ['2020-21_2c', '2015-16_3d'],
    title: 'Views, elements and angles of a drill bit; why body-diameter clearance is needed',
    numerical: false,
    html: `
<h4>Elements</h4>
<ol>
<li><b>Shank:</b> the part clamped to give the drive; straight (up to ½ in) or tapered with a tang.</li>
<li><b>Body:</b> flutes, margin, body clearance, web.</li>
<li><b>Point:</b> two lips (cutting edges), chisel edge, flanks.</li>
<li><b>Flutes:</b> helical grooves forming the cutting edges, carrying chips out and coolant in.</li>
<li><b>Margin (land):</b> narrow raised strip along the flute that gives full body-to-hole support and guidance.</li>
<li><b>Web:</b> central core, thicker towards the shank; forms the chisel edge.</li>
</ol>
<h4>Angles</h4>
<ol>
<li><b>Point angle</b> (included): 118° for general work; larger for harder material (e.g. 130-140°), smaller for soft.</li>
<li><b>Helix angle:</b> 27° - 45° for soft materials and deep holes; 10° - 19° for hard/brittle.</li>
<li><b>Lip clearance angle:</b> supports the lip; too large makes the lip dig in, too little causes rubbing; fixed by the point angle (about 8 - 12°).</li>
<li><b>Chisel-edge angle:</b> about 120 - 135°.</li>
</ol>
<h4>Why body-diameter clearance</h4>
<ol>
<li>The body clearance is a <b>reduced diameter</b> of the body between the flute and the margin.</li>
<li>It <b>reduces friction</b> between the drill body and the hole wall, since only the narrow margin touches the work.</li>
<li>It cuts heat generation, torque and power, avoids seizure and binding, and lets coolant reach the cutting edge.</li>
<li>The margin still guides the drill and keeps the hole straight and round.</li>
</ol>
<p><b>Sketch:</b> side view of the drill (shank, neck, body, point), an end view (two lips, chisel edge, web, margin, body clearance, flutes), and a point view showing point angle and lip clearance.</p>`
  },
  {
    ids: ['2014-15_6b', '2012-13_6d'],
    title: 'Constructional features of a twist drill',
    numerical: false,
    html: `
<p>A twist drill has three main parts: <b>shank, body and point</b>.</p>
<ol>
<li><b>Shank:</b> clamped to drive the drill; straight (up to ½ in, equal to body diameter) or taper (with tang) above that.</li>
<li><b>Body:</b> contains the <b>flutes</b> (helical grooves, form cutting edges, give chip and coolant passage), <b>margin</b> (narrow raised land for full body-to-hole support), <b>body clearance</b> (reduced section to reduce friction), <b>web</b> (core thickness increasing toward the shank; forms the chisel edge).</li>
<li><b>Point:</b> two <b>lips</b> (main cutting edges) and the <b>chisel edge</b>; <b>point angle</b> (118° general) and <b>lip clearance</b> angle.</li>
<li><b>Helix angle:</b> controls chip removal; high helix 27° - 45° for soft materials, low 10° - 19° for hard materials.</li>
</ol>
<p><b>Sketch:</b> side view of the drill with shank (tang), neck, body, flutes, margin, body clearance and point; end view with lips, chisel edge, web and margins; mark point angle and helix angle.</p>`
  },
  {
    ids: ['2011-12_6d', '2010-11_6d'],
    title: 'Cutting edges of a (double-flute) twist drill',
    numerical: false,
    html: `
<p>A twist drill has two symmetrical cutting edges, each removing part of the material as chips. Edges at the point:</p>
<ol>
<li><b>Two main cutting edges (lips):</b> the intersection of each flute face (rake face) with the conical flank. They cut the chips. Cutting speed is zero at the centre and a maximum at the corner (V = πDN). Both lips must have equal length and angle.</li>
<li><b>Chisel edge (dead centre):</b> formed where the two flanks meet across the web. It does not cut in the normal sense; it scrapes/extrudes metal and causes most of the thrust. Web thinning reduces it.</li>
<li><b>Margins (secondary edges):</b> narrow lands along the flute edges that guide the drill and burnish the hole wall.</li>
</ol>
<p>Actions at the tip: the web forms a small hole, the lips form chips, the flutes lift the chips out by screw action, and the margins guide the drill in the hole.</p>
<p><b>Sketch:</b> the end view of the drill point showing the two lips, the chisel edge at the centre, the web, flutes and margins; and a side view showing the point angle.</p>`
  },
  {
    ids: ['2016-17_7c'],
    title: 'Properties and functions of a twist drill and a core drill',
    numerical: false,
    html: `
<h4>Twist drill</h4>
<ol>
<li>The most common drill: <b>two cutting edges and two helical flutes</b> along the body; neck and shank (straight or tapered).</li>
<li>Used to <b>originate holes</b> in solid material.</li>
<li>Taper shank is held by wedge action in the tapered spindle socket, with a tang for positive drive; straight shank in a drill chuck.</li>
<li>Helical flutes carry chips out and coolant in; margins guide; typical point angle 118°.</li>
</ol>
<h4>Core drill</h4>
<ol>
<li>Consists of the chamfer, body, neck and shank, with <b>three or four flutes</b> and an equal number of margins.</li>
<li>Used to <b>enlarge and finish</b> drilled, cast or punched holes; it <b>cannot produce an original hole</b> (no cutting chisel-edge/central lips).</li>
<li>More margins give superior guidance and therefore <b>high accuracy</b>, and a better finish with a stronger section (no web at the centre problem).</li>
<li>Depth of cut in core drilling d = (Ddrill − Dhole)/2.</li>
</ol>
<p><b>Sketch:</b> a two-flute twist drill and an end view with two lips; a three-flute core drill end view with three margins and a chamfered end.</p>`
  },
  {
    ids: ['2014-15_5d'],
    title: 'Spade drill and gun drill',
    numerical: false,
    html: `
<h4>Spade drill</h4>
<ol>
<li>A flat blade (paddle) with a <b>sharp tip at the centre</b> that keeps the bit on target; cutting edges on the flat blade.</li>
<li>Used for drilling <b>large holes, 90 mm or more</b>.</li>
<li>Advantages: marked saving in tool cost (only the blade is replaced), lower tool weight (easy handling), easy to grind.</li>
</ol>
<h4>Gun drill</h4>
<ol>
<li>Used for drilling <b>deep holes</b>.</li>
<li>All gun drills are <b>straight-fluted</b> and have a <b>single cutting edge</b>.</li>
<li>A hole through the body acts as a conduit for <b>coolant under high pressure</b> to the tip, which flushes the chips out of the hole.</li>
<li>Used for gun barrels, crankshaft oil holes, with high straightness and accuracy.</li>
</ol>
<p><b>Sketch:</b> a flat spade blade on a shank with a central point; a gun drill with a V-groove flute, a single lip and a coolant hole through the shank.</p>`
  },
  {
    ids: ['2009-10_7b'],
    title: 'Classification of drills used in a drill press',
    numerical: false,
    html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Basis</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td rowspan="3">Construction</td><td>Solid</td><td>One piece, e.g. HSS</td></tr>
<tr><td>Tipped solid</td><td>Body of one material with cutting lips of another (brazed)</td></tr>
<tr><td>Composite</td><td>Cutting portions mechanically held</td></tr>
<tr><td rowspan="2">Holding / driving</td><td>Straight shank</td><td>Cylindrical shank; with or without driving flats, tang, grooves or threads</td></tr>
<tr><td>Taper shank</td><td>Conical shank fitting into spindle sockets; generally with a driving tang</td></tr>
<tr><td rowspan="4">Number of flutes</td><td>Two-flute</td><td>Conventional twist drill; originates holes</td></tr>
<tr><td>Single-flute</td><td>Originates holes</td></tr>
<tr><td>Three-flute (core)</td><td>Enlarges and finishes drilled, cast, punched holes; cannot originate</td></tr>
<tr><td>Four-flute (core)</td><td>Similar to three-flute</td></tr>
<tr><td rowspan="2">Hand of cut</td><td>Right-hand</td><td>Counterclockwise rotation viewed from the cutting point (the majority)</td></tr>
<tr><td>Left-hand</td><td>Clockwise rotation</td></tr>
</tbody></table></div>
<p><b>By type/use:</b> twist drill, core drill, spade drill, step drill (stepped holes), gun drill (deep holes), centre drill, auger, Forstner and hole saw (wood/sheet).</p>`
  },
  {
    ids: ['2023-24_6b', '2018-19_5b', '2009-10_7a'],
    title: 'Sequence of operations to obtain an accurate hole aligned on centre',
    numerical: false,
    html: `
<p>A drill alone cannot give an accurate, well-located hole, so a sequence of operations is used:</p>
<ol>
<li><b>Centering (centre drilling):</b> a short, stiff centre drill makes a small conical starting hole that accurately fixes the position and prevents the next drill from wandering.</li>
<li><b>Drilling:</b> a twist drill (slightly undersize) produces the hole by removing most of the material; rough size and finish.</li>
<li><b>Boring:</b> a single-point boring tool on an adjustable boring head corrects the position and alignment (straightness) of the drilled hole and enlarges it close to the final size.</li>
<li><b>Reaming:</b> a multi-fluted reamer slightly enlarges the hole, giving the final size tolerance and a fine surface finish. A reamer follows the existing axis, so boring (not reaming) is used to correct position.</li>
<li><b>Related finishing operations as required:</b> counterboring (stepped hole for bolt heads), countersinking (cone for flat-head screws), spotfacing (flat seat), tapping (internal threads).</li>
</ol>
<p>Sequence: centre drill, drill, bore, ream (then counterbore/countersink/tap).</p>
<p><b>Sketch:</b> a series of sectioned views of the plate: (1) centre-drilled cone, (2) drilled hole, (3) bored hole, (4) reamed hole, plus counterbore, countersink and spotface profiles.</p>`
  },
  {
    ids: ['2013-14_5c'],
    title: 'Boring, reaming and countersinking',
    numerical: false,
    html: `
<ol>
<li><b>Boring:</b> a single-point boring tool enters the work axially and cuts along the internal surface of an existing hole, to enlarge the diameter or obtain more precise dimensions and correct the alignment. It is set to the desired diameter with an adjustable boring head; on a lathe the work rotates, on a mill/drill the tool rotates.</li>
<li><b>Reaming:</b> slightly enlarges a hole to give a better diameter tolerance and surface finish. A reamer (4 - 8 straight or helical flutes, very short tip with no cutting edges) is fed into a drilled or bored hole at low speed and large feed, removing only 0.1 - 0.5 mm.</li>
<li><b>Countersinking:</b> a cone-shaped enlargement at the mouth of a hole to seat flat-head screws and bolts (similar to counterboring, but the step is conical, e.g. 60°, 82° or 90°).</li>
</ol>
<p><b>Sketch:</b> sectioned work with: (a) a boring bar inside a hole, (b) a fluted reamer in a hole, (c) a conical countersink tool and the cone-shaped hole.</p>`
  },
  {
    ids: ['2011-12_5d'],
    title: 'Why not make a hole to final dimension by drilling only',
    numerical: false,
    html: `
<ol>
<li><b>Accuracy:</b> a drill gives only rough tolerance (about IT11 - IT12). Unequal lip length or angle makes the hole oversize and out of round.</li>
<li><b>Location and alignment:</b> the drill can wander at the start (chisel edge has no centre) and deflect along the hole, so the hole is off position and not straight.</li>
<li><b>Surface finish:</b> flutes, margins and the chisel edge leave feed marks and a rough, burred, sometimes work-hardened surface.</li>
<li><b>Bell-mouth and burr</b> at the entry and exit.</li>
<li>Therefore a <b>sequence</b> is used: centering to locate, drilling for bulk removal, boring to correct position and alignment, reaming for size and finish.</li>
<li>Economics: drilling removes the bulk quickly; the finishing tools take only a light cut, and need a stiff, accurate start.</li>
</ol>`
  },
  {
    ids: ['2023-24_5b', '2012-13_6c'],
    title: 'Ø25 mm hole, 60 mm deep, 1020 steel: MRR and time for 15 holes (point angle 120°)',
    numerical: true,
    html: `
<h4>Given</h4>
<p>D = 25 mm, hole depth t = 60 mm (treated as a blind hole, as in slide 168), point angle θ = 120°, V = 44 m/min, f = 0.25 mm/rev, 15 holes.</p>
<h4>Formulas</h4>
<p class="formula">N = 1000V/(πD) ; fr = f·N ; A = 0.5·D·tan(90° − θ/2) ; Tm = (t + A)/fr ; MRR = πD²·fr/4</p>
<ol class="steps">
<li>Spindle speed N = 1000 × 44/(π × 25) = <b>560.2 rpm</b>.</li>
<li>Feed rate fr = 0.25 × 560.2 = <b>140.06 mm/min</b>.</li>
<li>Approach A = 0.5 × 25 × tan(90° − 60°) = 12.5 × tan 30° = 12.5 × 0.5774 = <b>7.217 mm</b>.</li>
<li>Time for one hole Tm = (60 + 7.217)/140.06 = <b>0.480 min</b> (28.8 s).</li>
<li><b>Time for 15 holes</b> = 15 × 0.480 = <b>7.20 min</b> (432 s) (machining time only; no handling or tool-change time).</li>
<li>Area of the hole πD²/4 = π × 25²/4 = 490.9 mm².</li>
<li><b>MRR</b> = 490.9 × 140.06 = <b>68 750 mm³/min</b> = 68.75 cm³/min (1146 mm³/s).</li>
</ol>
<div class="callout">Answers: MRR = 6.88 × 10⁴ mm³/min; Tm = 0.480 min per hole; 15 holes = 7.20 min. If the hole were a through hole in a 60 mm plate, the same calculation applies plus any over-travel.</div>`
  },
  {
    ids: ['2022-23_5b', '2017-18_6c'],
    title: 'Ø12.7 mm twist drill, 60 mm deep blind hole, 118°: cutting time and MRR',
    numerical: true,
    html: `
<h4>Given</h4>
<p>D = 12.7 mm, blind hole depth t = 60 mm, point angle θ = 118°, V = 25 m/min, f = 0.30 mm/rev.</p>
<ol class="steps">
<li>N = 1000 × 25/(π × 12.7) = <b>626.6 rpm</b>.</li>
<li>fr = 0.30 × 626.6 = <b>187.98 mm/min</b>.</li>
<li>A = 0.5 × 12.7 × tan(90° − 59°) = 6.35 × tan 31° = 6.35 × 0.6009 = <b>3.815 mm</b>.</li>
<li><b>Cutting time</b> Tm = (60 + 3.815)/187.98 = <b>0.340 min</b> (20.4 s).</li>
<li>Hole area πD²/4 = π × 12.7²/4 = 126.7 mm².</li>
<li><b>MRR</b> = 126.7 × 187.98 = <b>23 810 mm³/min</b> (23.8 cm³/min).</li>
</ol>
<div class="callout">Answers: Tm = 0.34 min (20.4 s); MRR = 2.38 × 10⁴ mm³/min.</div>`
  },
  {
    ids: ['2021-22_3c'],
    title: 'Ø25.4 mm twist drill, 50 mm deep blind hole, 100° point: cutting time and MRR',
    numerical: true,
    html: `
<h4>Given</h4>
<p>D = 25.4 mm, t = 50 mm (blind), θ = 100°, V = 25 m/min, f = 0.25 mm/rev.</p>
<ol class="steps">
<li>N = 1000 × 25/(π × 25.4) = <b>313.3 rpm</b>.</li>
<li>fr = 0.25 × 313.3 = <b>78.32 mm/min</b>.</li>
<li>A = 0.5 × 25.4 × tan(90° − 50°) = 12.7 × tan 40° = 12.7 × 0.8391 = <b>10.66 mm</b>.</li>
<li><b>Cutting time</b> Tm = (50 + 10.66)/78.32 = <b>0.774 min</b> (46.5 s).</li>
<li>Hole area πD²/4 = π × 25.4²/4 = 506.7 mm².</li>
<li><b>MRR</b> = 506.7 × 78.32 = <b>39 690 mm³/min</b> (39.7 cm³/min).</li>
</ol>
<div class="callout">Answers: Tm = 0.774 min (46.5 s); MRR = 3.97 × 10⁴ mm³/min.</div>`
  },
  {
    ids: ['2018-19_5c'],
    title: 'Derivation of MRR for drilling a blind hole',
    numerical: false,
    html: `
<ol class="steps">
<li>Let D = drill diameter, θ = point (included) angle, t = depth of the blind hole, V = cutting speed, f = feed per revolution.</li>
<li>Spindle speed N = 1000V/(πD). Feed rate (axial velocity of the drill) fr = f·N.</li>
<li>The conical point gives an approach: the drill must enter by the height of the cone before the full diameter cuts. From the right triangle with base D/2 and half-angle θ/2: A = (D/2)/tan(θ/2) = <b>0.5·D·tan(90° − θ/2)</b>.</li>
<li>Total travel of the drill for the blind hole = t + A, so the cutting time is <b>Tm = (t + A)/fr</b>.</li>
<li>When the drill is fully engaged, the volume removed per unit time is the cross-sectional area of the hole times the axial feed rate:</li>
<li class="formula">MRR = (π·D²/4) · fr = (π·D²/4) · f · N</li>
<li>Substituting N: MRR = (π D²/4) f (1000V/πD) = 250·D·f·V mm³/min (D in mm, V in m/min, f in mm/rev).</li>
<li>(Average over the whole hole: MRR_avg = (volume of the hole)/Tm = (πD²t/4)/Tm, slightly lower than the steady value by the factor t/(t + A).)</li>
</ol>
<p><b>Sketch:</b> a blind hole in section with the drill, the conical point of angle θ, the approach A, the depth t, and the feed arrow fr.</p>`
  }
];
