// IPE 331 Machine Shop Atlas - chapter study notes (Prianka ma'am's part, slides 1-171).
// All HTML uses only the classes listed in SPEC.md.

export const CHAPTERS = [
  /* ===================================================================== INTRO */
  {
    id: 'intro',
    title: 'Introduction & cutting tools',
    slides: '1–13',
    lead: `Manufacturing turns raw material into items of greater value by physical and chemical processes. Machining (material removal) produces rotational or prismatic parts, and every operation creates its geometry by <b>generating</b> (feed path of the tool), <b>forming</b> (shape of the tool) or a combination. Cutting tools are classed as <b>single-point</b> (one cutting edge engaged, e.g. turning tool) or <b>multi-point</b> (two or more edges, e.g. milling cutter, drill, grinding wheel).`,
    sections: [
      {
        id: 'manufacturing',
        title: 'What is manufacturing?',
        slides: [2],
        html: `
<p>The word <b>manufacturing</b> comes from the Latin <i>manus</i> (hand) and <i>factus</i> (made).</p>
<ol>
<li><b>Technologically:</b> the application of physical and chemical processes to alter the geometry, properties and/or appearance of a given starting material to make parts or products.</li>
<li><b>Economically:</b> the transformation of raw material into items of greater value (value addition) by one or more processing and/or assembly operations.</li>
<li><b>Materials used:</b> metals, ceramics, polymers, composites (wood and plastics are also listed on the slide).</li>
</ol>
<p class="muted small">Additive vs subtractive manufacturing and process-selection factors are covered in Answer Note A (see the answer bank).</p>`
      },
      {
        id: 'part-geometry',
        title: 'Machined part geometry: rotational vs prismatic',
        slides: [3],
        html: `
<p>Machined parts are classified as <b>(a) rotational</b> or <b>(b) non-rotational (prismatic)</b>.</p>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Rotational part</th><th>Non-rotational (prismatic) part</th></tr></thead>
<tbody>
<tr><td>Shape</td><td>Cylindrical or disk-like</td><td>Block-like or plate-like (flat parts)</td></tr>
<tr><td>How produced</td><td>A cutting tool removes material from a <b>rotating workpart</b></td><td>Linear motions of the workpart combined with rotating or linear tool motions</td></tr>
<tr><td>Operations</td><td>Turning, boring; drilling is closely related (but usually the tool rotates, not the work)</td><td>Milling, shaping, planing, sawing</td></tr>
</tbody></table></div>`
      },
      {
        id: 'gen-form',
        title: 'Generating vs forming',
        slides: [4, 5, 6, 7],
        html: `
<p>Each machining operation produces a characteristic geometry because of two factors: the <b>relative motions</b> between the tool and the workpart, and the <b>shape of the cutting tool</b>. Operations are therefore classified as <b>generating</b>, <b>forming</b> or a combination.</p>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Generating</th><th>Forming</th></tr></thead>
<tbody>
<tr><td>Geometry determined by</td><td>The <b>feed trajectory</b> (path) of the cutting tool relative to the work</td><td>The <b>geometry (shape) of the cutting tool</b>, which is the reverse of the shape produced</td></tr>
<tr><td>Tool shape</td><td>Simple tool; its shape does not appear on the work</td><td>Tool edge is a copy (negative) of the work surface</td></tr>
<tr><td>Feed</td><td>Tool is fed along a path (straight, angular, curved)</td><td>Usually plunged (radial/axial) into the work, no long feed path</td></tr>
<tr><td>Examples</td><td>Straight turning, taper turning, contour turning, peripheral (slab) milling, profile milling</td><td>Form turning, drilling, broaching</td></tr>
<tr><td>Cost of tool</td><td>Cheap general-purpose tool</td><td>Special, costly tool for each shape</td></tr>
</tbody></table></div>
<p><b>Combined generating and forming</b> (slide 7): both occur in one operation. Examples: <b>thread cutting on a lathe</b> (the tool tip form gives the thread profile; the feed along the axis at a lead equal to the pitch generates the helix) and <b>slot milling</b> (cutter width forms the slot width; the table feed generates its length).</p>
<div class="callout">Exam hint: always give two examples for each of generating, forming and combined, and sketch the tool path/shape.</div>`
      },
      {
        id: 'tool-classes',
        title: 'Classification of cutting tools',
        slides: [8],
        html: `
<p>A cutting tool must have a <b>wedge-shaped portion with a sharp cutting edge</b> that cuts material smoothly. Tool materials: carbide and high-speed steel (HSS) are the most common general-purpose materials; carbide is chosen for tougher and harder work.</p>
<p>Tools are classified in several ways; the most common is by the <b>number of main cutting edges that take part in cutting at one time in a single pass</b>:</p>
<ol>
<li><b>Single-point cutting tool</b></li>
<li><b>Multi-point cutting tool</b></li>
</ol>`
      },
      {
        id: 'single-point',
        title: 'Single-point cutting tool',
        slides: [9, 10, 11],
        html: `
<p><b>Definition:</b> a tool with only <b>one main cutting edge</b> that performs the material removal action at a time in a single pass. In indexable-insert tools several edges may exist on the insert, but only <b>one edge engages</b> the work at a time, so it is still a single-point tool.</p>
<ol>
<li>Perfect example: the <b>turning tool</b> (single point turning tool, SPTT).</li>
<li>Others: <b>shaping, planing, slotting and boring tools</b>.</li>
</ol>`
      },
      {
        id: 'multi-point',
        title: 'Multi-point cutting tool',
        slides: [10, 11],
        html: `
<p><b>Definition:</b> a tool containing <b>more than two working cutting edges</b>. The number varies from about four (milling cutter) to hundreds (grinding wheel). All edges need not cut simultaneously: they successively engage and disengage.</p>
<ol>
<li>Common example: <b>milling cutter</b>.</li>
<li>Others: <b>reamer</b> (reaming), <b>broach</b> (broaching), <b>hob</b> (hobbing), <b>grinding wheel</b> (abrasive cutter), <b>hone</b> (honing), <b>drill</b>.</li>
</ol>
<p class="muted small">A broach is the classic multi-point tool with successive teeth of increasing height (see Answer Note I).</p>`
      },
      {
        id: 'single-vs-multi',
        title: 'Single-point vs multi-point tools',
        slides: [12, 13],
        html: `
<p>The desired form of the material decides the tool: use <b>single-point</b> tools for turning, boring and planing (shaping); use <b>multi-point</b> tools for milling and drilling. Proper use and maintenance of tools is essential for quality, and upkeep of machinery and tooling is where cost can mount.</p>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Single-point tool</th><th>Multi-point tool</th></tr></thead>
<tbody>
<tr><td>Cutting edges engaged</td><td>One at a time</td><td>Several in the same pass (not always simultaneously)</td></tr>
<tr><td>Examples</td><td>Turning, boring, shaping, planing, slotting tools</td><td>Milling cutter, drill, reamer, broach, hob, grinding wheel, hone</td></tr>
<tr><td>Material removal rate</td><td>Lower</td><td>Higher: many edges produce many chips per revolution</td></tr>
<tr><td>Load per edge / wear</td><td>All the load and wear on one edge</td><td>Load and heat shared by many edges, edge life is longer</td></tr>
<tr><td>Cutting action</td><td>Continuous (turning) or intermittent (shaping)</td><td>Intermittent: each edge cuts, then leaves the work and cools</td></tr>
<tr><td>Tool cost and complexity</td><td>Simple, cheap, easy to regrind</td><td>Complex, costly, harder to make and sharpen</td></tr>
<tr><td>Flexibility</td><td>Very versatile; one tool for many shapes</td><td>Tool is specific to an operation or size</td></tr>
<tr><td>Productivity</td><td>Suited to low and medium volume, toolroom, prototype</td><td>Suited to production runs</td></tr>
<tr><td>Typical processes</td><td>Lathe, shaper, planer</td><td>Milling machine, drill press, grinder, broaching machine</td></tr>
</tbody></table></div>`
      }
    ],
    formulas: [],
    keyTerms: [
      ['Manufacturing', 'Application of physical and chemical processes to change geometry, properties or appearance of a starting material; economically, adding value.'],
      ['Rotational part', 'Cylindrical or disk-like part made by cutting a rotating work (turning, boring).'],
      ['Prismatic part', 'Block- or plate-like part made by linear work motion with rotating or linear tool motion (milling, shaping, planing).'],
      ['Generating', 'Work shape is determined by the feed trajectory of the tool (turning, taper turning, peripheral milling).'],
      ['Forming', 'Work shape is determined by the tool shape (form turning, drilling, broaching).'],
      ['Single-point tool', 'Tool with one main cutting edge doing the cutting at a time (turning, boring, shaping tool).'],
      ['Multi-point tool', 'Tool with more than two cutting edges that successively engage the work (milling cutter, drill, grinding wheel).'],
      ['HSS', 'High-speed steel, a common general-purpose tool material; carbide is used for harder, tougher work.']
    ]
  },

  /* ===================================================================== TURNING */
  {
    id: 'turning',
    title: 'Turning & the lathe',
    slides: '14–44',
    lead: `Turning removes material from the surface of a rotating workpiece with a single-point tool fed parallel to the axis, generating a cylinder. The three cutting parameters are cutting speed V (m/min), feed f (mm/rev) and depth of cut d (mm); they give MRR = V·f·d and machining time Tm = L/(f·N). The lathe performs facing, contour, form, taper, threading, boring, knurling, chamfering, drilling and parting operations.`,
    sections: [
      {
        id: 'turning-basics',
        title: 'Turning: definition, motions and machine',
        slides: [15, 16],
        html: `
<ol>
<li><b>Turning</b> is a machining process in which a <b>single-point tool</b> removes material from the surface of a rotating workpiece. The tool is fed linearly in a direction <b>parallel to the axis of rotation</b> to generate a cylinder.</li>
<li><b>Primary motion</b> (cutting): rotation of the workpiece. <b>Secondary motion</b>: feed motion of the tool.</li>
<li>It is done on a <b>lathe</b>, which provides power to rotate the part at a given speed and to feed the tool at a specified rate and depth of cut.</li>
<li>Done manually on a traditional lathe (needs continuous operator supervision), or on a computer-controlled automated lathe (<b>CNC</b>).</li>
<li>Turning can be <b>external</b> (outside of the cylinder) or <b>internal</b> (boring) to produce tubular parts.</li>
</ol>
<p>Cutting conditions: <span class="tag-v">cutting speed V</span> (also Vc), <span class="tag-f">feed f</span> (also So) and <span class="tag-d">depth of cut d</span> (also t).</p>`
      },
      {
        id: 'turning-params',
        title: 'Cutting speed, feed and depth of cut',
        slides: [17, 18, 19],
        html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Parameter</th><th>Meaning</th><th>Unit / formula</th></tr></thead>
<tbody>
<tr><td><span class="tag-v">Cutting speed V</span></td><td>Distance travelled by the work surface in unit time with reference to the cutting edge</td><td>m/min; V = πDN / 1000 (D in mm, N in rpm)</td></tr>
<tr><td><span class="tag-f">Feed f</span></td><td>Distance the tool advances per revolution of the work (also called feed rate)</td><td>mm/rev; feed rate fr = f·N (mm/min)</td></tr>
<tr><td><span class="tag-d">Depth of cut d</span></td><td>Perpendicular distance between the machined surface and the uncut (or previously machined) surface</td><td>mm; d = (D1 − D2)/2</td></tr>
</tbody></table></div>
<p>D1 = initial diameter, D2 = final diameter after a single cut. Note the depth is a <b>radial</b> quantity, so diameter reduces by 2d.</p>`
      },
      {
        id: 'turning-effects',
        title: 'Effect of V, f and d',
        slides: [20],
        html: `
<ol>
<li>Higher V, f, d give a <b>higher MRR</b>.</li>
<li>Higher V, f, d give <b>higher cutting temperature</b> and so higher tool wear.</li>
<li>Higher V gives lower cutting force and a better surface finish, but only up to a limit.</li>
<li>Lower f and d give lower cutting force, better surface finish, lower tool wear and lower chatter.</li>
</ol>
<p class="muted small">Detailed limits on V, f, d and causes/effects of cutting temperature: Answer Note B.</p>`
      },
      {
        id: 'turning-time',
        title: 'MRR and machining time in turning',
        slides: [21, 22, 23, 24],
        html: `
<p>Derivation (single pass, turning from D1 to D2, length L):</p>
<ol class="steps">
<li>Spindle speed from the cutting speed: <span class="mono">N = 1000 V / (π D)</span> rpm.</li>
<li>Feed rate: <span class="mono">fr = f · N</span> mm/min (tool advance per minute).</li>
<li>Depth of cut: <span class="mono">d = (D1 − D2) / 2</span>.</li>
<li>Material removed per minute is the cross-section of the chip times the cutting speed: <span class="mono">MRR = V · f · d</span> (with V in mm/min, MRR in mm³/min). Equivalent form: MRR = π·Davg·d·fr.</li>
<li>Tool travels the length of cut L plus an approach/over-travel allowance: <span class="mono">Tm = (L + allowance) / (f · N)</span> min.</li>
</ol>
<p>For several passes, multiply by the number of passes: passes = total radial depth to remove / depth per pass (round up).</p>
<div class="callout">Check units: V in m/min and D in mm gives N = 1000V/(πD). For MRR in mm³/min convert V to mm/min (V × 1000).</div>
<h4>Power and torque (Answer Note C)</h4>
<ol>
<li>Machining power <span class="mono">P = K · MRR</span> where K is the specific cutting energy (N/mm² = N·mm/mm³).</li>
<li>Cutting force <span class="mono">Fc = K · f · d</span>.</li>
<li>Spindle torque <span class="mono">T = P / ω = Fc · D/2</span>.</li>
</ol>`
      },
      {
        id: 'turning-examples',
        title: 'Solved turning examples (slides 25 and 28)',
        slides: [25, 26, 27, 28],
        html: `
<p><b>Multi-pass method (roughing + finishing)</b>:</p>
<ol class="steps">
<li>Radial stock to remove = (blank dia − final dia)/2. Subtract the finishing allowance to get the roughing stock.</li>
<li>Number of roughing passes = roughing stock ÷ maximum rough depth of cut (round up); then one finishing pass.</li>
<li>Calculate N for each speed and pick the nearest available spindle speed that does <b>not exceed</b> it (standard ladder: 70, 110, 176, 280, 440, 700, 1100, 1760, 2800 rpm).</li>
<li>Time per pass = L/(f·N). Total = sum over roughing and finishing passes.</li>
</ol>
<div class="callout"><b>Slide 25, Q1:</b> C40 steel, blank Ø50 mm, roughing V = 30 m/min, f = 0.24 mm/rev, max d = 2 mm; finishing V = 60 m/min, f = 0.10 mm/rev, finish allowance 0.75 mm; length 120 mm (figure dimensions as read from the slide). Worked solution is in the answer bank (2021-22_1c).</div>
<div class="callout"><b>Slide 28, Q2:</b> C40 shaft Ø40 × 75 long, max d = 2 mm: (a) HSS V = 30 m/min, f = 0.3 mm/rev; (b) carbide V = 145 m/min, f = 0.38 mm/rev. Same as 2009-10 Q5(b) (answer bank).</div>`
      },
      {
        id: 'turning-ops',
        title: 'Basic turning operations (slides 29–38)',
        slides: [29, 30, 31, 32, 33, 34, 35, 36, 37, 38],
        html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Operation</th><th>Tool motion / description</th><th>Gen. / form</th></tr></thead>
<tbody>
<tr><td><b>Facing</b></td><td>Tool fed <b>radially</b> into the rotating work at one end to create a flat surface on the end.</td><td>Generating</td></tr>
<tr><td><b>Contour turning</b></td><td>Instead of a straight feed parallel to the axis, the tool follows a <b>contour other than straight</b>, creating a contoured form.</td><td>Generating</td></tr>
<tr><td><b>Form turning</b> (forming)</td><td>Tool has a shape imparted to the work by <b>plunging the tool radially</b> into the work.</td><td>Forming</td></tr>
<tr><td><b>Taper turning</b></td><td>Tool is fed at an <b>angle</b> to the axis (instead of parallel), giving a conical shape.</td><td>Generating</td></tr>
<tr><td><b>Drilling</b> (on lathe)</td><td>Drill is fed into the rotating work <b>along its axis</b>. Reaming is similar. Centering (centre drilling) must be done before drilling. Needs a drill chuck in the tailstock.</td><td>Forming</td></tr>
<tr><td><b>Boring</b></td><td>Single-point tool fed linearly parallel to the axis on the <b>inside diameter of an existing hole</b>.</td><td>Generating</td></tr>
<tr><td><b>Threading</b></td><td>Pointed tool fed linearly across the outside surface parallel to the axis at a <b>large effective feed</b> (feed = pitch/lead per rev), creating threads. Can be external or internal.</td><td>Combined</td></tr>
<tr><td><b>Knurling</b></td><td>Not a machining operation (no cutting): a <b>metal forming</b> operation producing a regular cross-hatched pattern on the surface.</td><td>Forming</td></tr>
<tr><td><b>Chamfering</b></td><td>Cutting edge cuts an <b>angle on the corner</b> of the cylinder, forming a chamfer.</td><td>Forming</td></tr>
<tr><td><b>Cut-off / parting</b></td><td>Tool fed <b>radially</b> into the rotating work at some location along its length to cut off the end of the part.</td><td>Forming</td></tr>
</tbody></table></div>
<h4>How boring differs from turning (slide 34)</h4>
<ol>
<li>Turning works on the outer surface; boring on the inside of an existing hole.</li>
<li>Boring tool is held on a boring bar with limited rigidity (overhang), so lighter cuts, more chatter.</li>
<li>Chips are harder to clear and cutting fluid is harder to supply in boring.</li>
<li>Both use a single-point tool with feed parallel to the axis.</li>
</ol>
<h4>Turning vs threading (slide 35)</h4>
<ol>
<li>In turning feed is small (mm/rev); in threading the feed per revolution equals the pitch/lead.</li>
<li>Turning tool is a general profile tool; threading tool is shaped to the thread form (60° for metric).</li>
<li>Threading needs the lead screw and half-nut, so that the carriage moves one pitch per rev; turning uses the feed rod.</li>
<li>Threading takes many passes with progressive depth; turning can be a single pass.</li>
</ol>`
      },
      {
        id: 'taper',
        title: 'Taper turning methods (Answer Note E)',
        slides: [32, 42],
        html: `
<p>Taper half-angle: <span class="mono">tan α = (D − d) / (2l)</span>.</p>
<ol>
<li><b>Form tool</b> (plunged), short tapers/chamfers only.</li>
<li><b>Compound rest swivel</b>: swivel the compound slide to α and feed by hand; steep short tapers.</li>
<li><b>Tailstock offset</b>: offset s = L(D − d)/(2l); job between centres; long gentle tapers.</li>
<li><b>Taper-turning attachment</b>: guide bar swivelled to α, cross-slide freed from the cross-feed screw by removing the binder screw; power feed.</li>
<li><b>Combined feeds</b> / CNC.</li>
</ol>`
      },
      {
        id: 'lathe-parts',
        title: 'Lathe components',
        slides: [39, 40, 41, 42],
        html: `
<ol>
<li><b>Bed:</b> the foundation of the lathe; supports all major components. Its <b>ways</b> give precise guidance to the carriage and the tailstock.</li>
<li><b>Headstock:</b> mounted on the ways at one end. Contains the <b>hollow spindle</b>, bearings and transmission gears. It carries the work holders (jaws), supplies power to them at various drive speeds. The hollow hole accepts long work or bar stock.</li>
<li><b>Tailstock:</b> supports the other end of the work. Lower portion of the casting fits the inner ways, can slide longitudinally and lock at the desired position. Used for centres, drill chucks, drills, reamers; offset for taper turning.</li>
<li><b>Carriage:</b> slides along the ways; consists of the cross-slide, tool post and apron. Together with the apron it provides the base for mounting and moving cutting tools, giving longitudinal and transverse movement.</li>
<li><b>Cross slide:</b> mounted on the carriage; gives movement for facing and cut-off.</li>
<li><b>Compound rest:</b> mounted on the cross slide; can rotate for angle cuts; holds the tool post.</li>
<li><b>Feed rod and lead screw:</b> powered through a set of gears from the headstock. Feed rod for turning, lead screw for threading.</li>
<li><b>Ways:</b> precise guidance for the carriage assembly and tailstock.</li>
</ol>
<p class="muted small">Work-holding devices: Answer Note F. Change gears, power feed and reversing: Answer Note G.</p>`
      },
      {
        id: 'lathe-spec',
        title: 'Lathe specification',
        slides: [43],
        html: `
<ol>
<li><b>Swing over the cross slide:</b> maximum diameter that can be rotated on the lathe (maximum diameter of workpiece that can be machined).</li>
<li><b>Distance between centres:</b> maximum length of workpiece that can be held between centres.</li>
</ol>
<p>Example: a <b>300 – 1500 lathe</b> has a swing of 300 mm and 1500 mm between centres.</p>`
      }
    ],
    formulas: [
      { name: 'Cutting speed', expr: 'V = πDN / 1000', vars: 'D = work dia (mm), N = rpm, V in m/min', slide: 17 },
      { name: 'Spindle speed', expr: 'N = 1000 V / (πD)', vars: 'V in m/min, D in mm', slide: 17 },
      { name: 'Feed rate', expr: 'fr = f · N', vars: 'f = mm/rev, fr = mm/min', slide: 18 },
      { name: 'Depth of cut (turning)', expr: 'd = (D1 − D2) / 2', vars: 'D1 initial dia, D2 final dia (mm)', slide: 19 },
      { name: 'Material removal rate', expr: 'MRR = V · f · d', vars: 'V in mm/min gives mm³/min', slide: 22 },
      { name: 'Machining time (one pass)', expr: 'Tm = (L + allowance) / (f · N)', vars: 'L = length of cut (mm)', slide: 24 },
      { name: 'Machining power', expr: 'P = K · MRR', vars: 'K = specific energy (N/mm²); P in N·mm/min, divide by 60 000 for W', slide: 24 },
      { name: 'Cutting force and torque', expr: 'Fc = K·f·d ; T = Fc·D/2 = P/ω', vars: 'ω = 2πN/60 rad/s', slide: 24 },
      { name: 'Taper half-angle', expr: 'tan α = (D − d) / (2l)', vars: 'D large dia, d small dia, l taper length', slide: 32 },
      { name: 'Tailstock offset', expr: 's = L (D − d) / (2l)', vars: 'L = total length between centres', slide: 32 }
    ],
    keyTerms: [
      ['Turning', 'Single-point tool removes material from a rotating workpiece while fed parallel to its axis to generate a cylinder.'],
      ['Cutting speed V', 'Linear speed of the work surface relative to the tool edge, m/min.'],
      ['Feed f', 'Tool advance per revolution of the work, mm/rev.'],
      ['Depth of cut d', 'Perpendicular distance between uncut and machined surface; d = (D1 − D2)/2.'],
      ['Facing', 'Radial feed on the end of the work to make a flat face.'],
      ['Form turning', 'Tool of required shape plunged radially into the work.'],
      ['Knurling', 'Metal-forming (not cutting) operation that gives a cross-hatched pattern.'],
      ['Parting / cut-off', 'Radial feed of a thin tool to separate the end of the part.'],
      ['Swing', 'Largest diameter of work that can rotate over the lathe (specification).'],
      ['Compound rest', 'Slide on the cross-slide that can be swivelled for angular cuts; carries the tool post.'],
      ['Apron', 'Part of the carriage housing the feed mechanisms.']
    ]
  },

  /* ===================================================================== MILLING */
  {
    id: 'milling',
    title: 'Milling',
    slides: '45–77',
    lead: `Milling uses a rotating multi-tooth cutter that removes material while the workpiece is fed against it. Machines are horizontal or vertical; the process is <b>peripheral</b> (slab, slot, slit, side, form, straddle) or <b>face</b> (conventional, partial, end, profile, pocket, contouring). In up milling the cutter rotates against the feed, in down milling with it. Machining time is Tm = (L + A + O)/fr where the approach A = √(d(D−d)) in slab milling and A = O = D/2 (centred) or √(w(D−w)) (offset) in face milling.`,
    sections: [
      {
        id: 'milling-intro',
        title: 'Introduction to milling',
        slides: [46, 47],
        html: `
<ol>
<li>Milling is a process in which a <b>rotating multi-point (multi-tooth) cutter</b> (milling cutter) removes material while travelling along various axes with respect to the workpiece.</li>
<li>The cutter rotates at very high speed and, because of the multiple cutting edges, produces a number of chips in one revolution, so metal is cut at a very fast rate. The rotation of the cutter (and the feed) is continuous, although each individual tooth cuts only for part of a revolution (see the answer to 2011-12 Q5a).</li>
<li>One or more cutters can be mounted simultaneously on the <b>arbor</b> of the machine.</li>
<li>Produces flat surfaces, contoured surfaces, surfaces of revolution, external and internal threads, and helical surfaces of various cross-sections.</li>
<li>Because of its high production rate (MRR) and accuracy, milling has replaced shapers and slotters in many applications and suits mass production.</li>
</ol>`
      },
      {
        id: 'milling-classes',
        title: 'Classification of milling machines',
        slides: [48, 49],
        html: `
<p>Milling machines are classified according to:</p>
<ol>
<li><b>Configuration</b>: column-and-knee (most common), bed type, planer type, special types.</li>
<li><b>Spindle orientation</b>: <b>horizontal</b> (spindle parallel to the table) and <b>vertical</b> (spindle perpendicular to the table).</li>
</ol>
<p class="muted small">Indexing / dividing head and gear cutting: Answer Note H.</p>`
      },
      {
        id: 'milling-parts',
        title: 'Parts of column-and-knee milling machines',
        slides: [50, 51, 52, 53],
        html: `
<h4>Horizontal milling machine</h4>
<ol>
<li><b>Column:</b> houses the spindle, bearings, gearbox, clutches, shafts, pumps and shifting mechanisms that transmit power from the motor to the spindle at the selected speed.</li>
<li><b>Knee:</b> mounted in front of the column; supports the table and gives <b>up/down motion (Z axis)</b>.</li>
<li><b>Saddle:</b> two slideways, one on the top and one at the bottom, at 90° to each other, giving motion in the <b>X or Y axes</b> via lead screws.</li>
<li><b>Table:</b> mounted on the saddle; moves along X; has <b>T-slots</b> for workpiece or fixture clamping.</li>
<li><b>Arbor:</b> extension of the spindle for mounting cutters; the thread end is usually a left-hand helix.</li>
</ol>
<h4>Vertical milling machine</h4>
<ol>
<li>Column, knee, saddle and table: same functions as above.</li>
<li><b>Milling head:</b> contains the spindle, motor and feed control; mounted on a <b>swivel base</b> so it can be set at any angle to the table.</li>
<li><b>Ram:</b> carries the milling head; positioned forward and backward on slideways on top of the column.</li>
</ol>`
      },
      {
        id: 'hmc-vs-vmc',
        title: 'Horizontal vs vertical milling machines',
        slides: [54, 55],
        html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Characteristic</th><th>Horizontal (HMC)</th><th>Vertical (VMC)</th></tr></thead>
<tbody>
<tr><td>Spindle orientation</td><td>Horizontal, parallel to the worktable</td><td>Vertical, perpendicular to the worktable</td></tr>
<tr><td>Number of axes</td><td>Generally 4 (X, Y, Z, A)</td><td>Generally 3 (X, Y, Z)</td></tr>
<tr><td>Cutting orientation</td><td>Cuts in multiple planes due to the rotary table</td><td>Cuts in a single plane</td></tr>
<tr><td>Surface finish</td><td>Best</td><td>Poorer</td></tr>
<tr><td>Cutter movement</td><td>Cutter cannot be moved up/down and tilted</td><td>Cutter can be moved up/down and tilted</td></tr>
<tr><td>Cutter mounting</td><td>Mounted on an arbor</td><td>Mounted directly on the spindle</td></tr>
<tr><td>Tool life</td><td>Increased</td><td>Reduced</td></tr>
<tr><td>Floor area</td><td>Large</td><td>Smaller</td></tr>
<tr><td>Cost</td><td>Expensive</td><td>Cheaper</td></tr>
<tr><td>Chip evacuation</td><td>Chips fall/are thrown away properly and easily</td><td>No proper chip removal area</td></tr>
<tr><td>Working capacity</td><td>High</td><td>Low</td></tr>
<tr><td>Weight / power</td><td>More powerful and heavy</td><td>Less powerful and light</td></tr>
</tbody></table></div>`
      },
      {
        id: 'up-down',
        title: 'Up milling vs down milling',
        slides: [56, 57, 58],
        html: `
<p><b>Up (conventional) milling:</b> the cutter rotates <b>against</b> the direction of table feed. <b>Down (climb) milling:</b> the cutter rotates in the <b>same direction</b> as the table feed.</p>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>#</th><th>Up milling</th><th>Down milling</th></tr></thead>
<tbody>
<tr><td>1</td><td>Traditional process, usually used for roughing</td><td>Used nowadays for better finish; usually the finishing operation</td></tr>
<tr><td>2</td><td>Known as conventional milling</td><td>Known as climb milling</td></tr>
<tr><td>3</td><td>Cutter rotates against the direction of feed</td><td>Cutter rotates in the same direction as feed</td></tr>
<tr><td>4</td><td>Cutting force acts upward (tends to lift the work)</td><td>Cutting force acts downward (holds the work on the table)</td></tr>
<tr><td>5</td><td>Takes a large amount of force</td><td>Does not need as much force</td></tr>
<tr><td>6</td><td>Generates more heat</td><td>Generates less heat</td></tr>
<tr><td>7</td><td>Chip thickness increases gradually from zero</td><td>Chip thickness decreases gradually to zero</td></tr>
<tr><td>8</td><td>Chips thrown upward, towards the cutting zone</td><td>Chips removed in a downward direction</td></tr>
<tr><td>9</td><td>Less suitable for chip management</td><td>More suitable for chip management</td></tr>
<tr><td>10</td><td>Used for brass, bronze and ferrous materials; lower MRR</td><td>Applicable to aluminium and its alloys; higher MRR</td></tr>
<tr><td>11</td><td>Tool wear rate is higher (cutter turns against the feed)</td><td>Tool wear rate is lower</td></tr>
<tr><td>12</td><td>Tool life is shorter</td><td>Tool life is longer</td></tr>
<tr><td>13</td><td>Backlash eliminator not required</td><td>Backlash eliminator required, especially on older machines</td></tr>
</tbody></table></div>
<p>Slide 56: up milling is conventionally used in most milling operations because the backlash between the lead screw and the table nut can be eliminated. Down milling can only be used on machines with a backlash eliminator (or CNC); when properly treated it needs less power and gives a better surface finish.</p>`
      },
      {
        id: 'milling-ops',
        title: 'Milling operations: peripheral vs face',
        slides: [59, 60, 61],
        html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Peripheral milling</th><th>Face milling</th></tr></thead>
<tbody>
<tr><td>Cutter axis vs surface</td><td>Cut generally in a plane <b>parallel to the axis</b> of the cutter</td><td>Cut generally at <b>right angles to the axis</b> of the cutter</td></tr>
<tr><td>Surface produced</td><td>Cross-section of the milled surface corresponds to the <b>contour of the cutter</b></td><td>Surface is flat and has no relationship to the contour of the cutter</td></tr>
<tr><td>Cutting action</td><td>Teeth on the periphery only</td><td>Combined cutting action of the <b>side and face</b> of the cutter</td></tr>
<tr><td>Cutter</td><td>Slab mill, side mill, form cutter, slitting saw</td><td>Face mill, end mill</td></tr>
</tbody></table></div>
<h4>Peripheral operations</h4>
<ol>
<li><b>Slab milling:</b> cylindrical mill on an axis parallel to the worktable creates a flat surface.</li>
<li><b>Slotting:</b> cuts a narrow groove (slot) into the surface of the workpiece.</li>
<li><b>Slitting:</b> a thin rotary tool-steel saw with peripheral teeth cuts deep, narrow slots or parts the work off.</li>
<li><b>Side milling:</b> milling with a side-milling cutter to machine one vertical surface.</li>
<li><b>Straddle milling:</b> face milling of two parallel vertical surfaces simultaneously with two side-milling cutters.</li>
<li><b>Form milling:</b> a mill with a unique shape creates that shape in the workpiece.</li>
</ol>`
      },
      {
        id: 'face-ops',
        title: 'Face milling operations',
        slides: [62, 63],
        html: `
<ol>
<li><b>Conventional face milling:</b> cutter diameter is greater than the work width, so the cutter overhangs the work on both sides.</li>
<li><b>Partial face milling:</b> cutter overhangs the work on only one side.</li>
<li><b>End milling:</b> cutter diameter is less than the work width, so a slot is cut into the part.</li>
<li><b>Profile milling:</b> a form of end milling in which the outside periphery of a flat part is cut.</li>
<li><b>Pocket milling:</b> another form of end milling used to mill shallow pockets into flat parts.</li>
<li><b>Surface contouring:</b> a ball-nose cutter (not a square end cutter) is fed back and forth across the work along a curvilinear path at close intervals to create a three-dimensional surface form.</li>
</ol>`
      },
      {
        id: 'cutters',
        title: 'Milling cutters, plain vs helical',
        slides: [64, 65, 66, 67],
        html: `
<p><b>Hand of cutter:</b> cutters have right-hand or left-hand cut and left-hand or right-hand spiral (helix) (slide 64).</p>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Plain milling cutter</th><th>Helical milling cutter</th></tr></thead>
<tbody>
<tr><td>Teeth</td><td>Straight teeth parallel to the axis of rotation</td><td>Teeth wrapped around the body in a helix at a helix angle</td></tr>
<tr><td>Engagement</td><td>Strikes the work along the whole tooth length at once</td><td>Engages progressively (gradual entry)</td></tr>
<tr><td>Cutting action</td><td>Intermittent impact, more vibration</td><td>Smooth, quiet and continuous</td></tr>
<tr><td>Power</td><td>Needs more power in heavy cuts</td><td>Shock is reduced, less power</td></tr>
<tr><td>Surface finish</td><td>Slightly rougher</td><td>Much smoother</td></tr>
<tr><td>Best for</td><td>Wide, rough or light flat surface passes</td><td>Uneven surfaces, interrupted cuts (e.g. pre-drilled holes), tough materials where chatter must be avoided</td></tr>
<tr><td>Cost / sharpening</td><td>Simpler, cheaper</td><td>Costlier; end thrust (axial) produced</td></tr>
</tbody></table></div>
<h4>Cutters for horizontal machines (slide 66)</h4>
<ol>
<li><b>Slab mills:</b> heavy cutting of large flat surfaces.</li>
<li><b>Side and face cutters:</b> cutting edges on the periphery and sides of the teeth; shoulders and slots.</li>
<li><b>Slitting saws:</b> deep slots or parting off.</li>
</ol>
<h4>Cutters for vertical machines (slide 67)</h4>
<ol>
<li><b>End mills:</b> facing, slotting and profile milling.</li>
<li><b>Face milling cutters:</b> heavy cutting.</li>
<li><b>Slot drills:</b> produce pockets without pre-drilling a hole.</li>
</ol>`
      },
      {
        id: 'milling-approach',
        title: 'Approach length derivations (slab and face milling)',
        slides: [68, 69, 70, 71, 72],
        html: `
<p><b>Machining time</b> = (cut length) / (table feed rate): <span class="mono">Tm = (L + A + O) / fr</span>, where L = length of work, A = approach, O = over-travel, <span class="mono">fr = N · nt · f</span> (N = rpm, nt = number of teeth, f = feed per tooth) and <span class="mono">N = 1000 V / (π D)</span>.</p>
<h4>Slab (peripheral) milling approach</h4>
<ol class="steps">
<li>The cutter (radius D/2) must travel horizontally from the first touch of the work to the position where the full depth d is reached, directly under the axis. This distance is the approach A.</li>
<li>Draw the right triangle: hypotenuse = radius = D/2, vertical side δ = D/2 − d (axis height above the work surface), horizontal side = A.</li>
<li>Pythagoras: (D/2)² = A² + (D/2 − d)².</li>
<li>A² = D²/4 − (D²/4 − Dd + d²) = Dd − d² = d(D − d).</li>
<li><b>A = √(d(D − d))</b>. (Check: d = D/4 gives A = √(D/4 · 3D/4) = (√3/4)·D.)</li>
<li>Then Tm = (L + A) / fr (over-travel O may be added if the cutter must clear the work).</li>
</ol>
<h4>Face milling approach</h4>
<ol class="steps">
<li><b>Case 1, cutter centred over the work</b> (work width w, cutter D): the cutter first touches the work at its leading edge on the axis line, a distance D/2 before the axis. The approach is the cutter radius: <b>A = D/2</b>. By symmetry the over-travel is also <b>O = D/2</b>.</li>
<li><b>Case 2, cutter offset</b> so the cutter edge is flush with one side of the work (w &lt; D): the nearest point of the work's leading face to the cutter axis line is at lateral distance D/2 − w from the axis. Triangle: hypotenuse D/2, vertical side D/2 − w, horizontal side A.</li>
<li>A² = (D/2)² − (D/2 − w)² = w(D − w), so <b>A = O = √(w(D − w))</b>.</li>
<li>Time: <b>Tm = (L + A + O) / fr</b>.</li>
</ol>
<p class="muted small">Slide 72 shows the two cases as Case 1 (centred) and Case 2 (offset) with L and w marked.</p>`
      },
      {
        id: 'milling-mrr',
        title: 'MRR in milling and solved examples',
        slides: [73, 74, 75, 76],
        html: `
<p><span class="mono">MRR = w · d · fr</span> where w = width of cut, d = depth of cut, fr = table feed rate (mm/min).</p>
<ol>
<li><b>Slide 74, Q1:</b> C50 steel flat 150 × 100 mm, HSS slab mill Ø100 × 150 wide, 8 teeth, one pass d = 2 mm, V = 20 m/min, f = 0.13 mm/tooth: find machining time (worked solution in the answer bank under 2018-19_7c).</li>
<li><b>Slide 75, Q2:</b> surface 115 × 250 mm, depth 6 mm, 16-tooth carbide face mill Ø150, alloy steel, V = 60 m/min, f = 0.18 mm/tooth: estimate the time (also under 2018-19_7c).</li>
<li><b>Slide 76 assignment:</b> derive approach for face milling (both cases); side cutting on a 200 mm steel part, width of cut 40 mm, 4-tooth cutter Ø100, V = 60 m/min, f = 0.18 mm/tooth, d = 2 mm: find time and MRR; derive MRR for the two solved problems.</li>
</ol>`
      }
    ],
    formulas: [
      { name: 'Spindle speed', expr: 'N = 1000 V / (π D)', vars: 'V m/min, D cutter dia (mm)', slide: 73 },
      { name: 'Table feed rate', expr: 'fr = N · nt · f', vars: 'nt = number of teeth, f = feed per tooth (mm), fr in mm/min', slide: 73 },
      { name: 'Approach (slab milling)', expr: 'A = √(d (D − d))', vars: 'd = depth of cut, D = cutter dia; from δ = D/2 − d', slide: 69 },
      { name: 'Approach, d = D/4', expr: 'A = (√3 / 4) · D', vars: 'special case of slab milling', slide: 59 },
      { name: 'Face milling, centred (case 1)', expr: 'A = O = D / 2', vars: 'cutter centred over the work', slide: 72 },
      { name: 'Face milling, offset (case 2)', expr: 'A = O = √(w (D − w))', vars: 'w = width of work (w < D)', slide: 72 },
      { name: 'Machining time (milling)', expr: 'Tm = (L + A + O) / fr', vars: 'slab: O often taken 0; face: A and O as above', slide: 71 },
      { name: 'MRR (milling)', expr: 'MRR = w · d · fr', vars: 'w width of cut, d depth, fr mm/min', slide: 73 }
    ],
    keyTerms: [
      ['Milling', 'Rotating multi-tooth cutter removes metal while the work is fed against it along one or more axes.'],
      ['Up milling', 'Cutter rotates against the table feed; chip thickness grows from zero; force upward.'],
      ['Down (climb) milling', 'Cutter rotates with the feed; chip thickness falls to zero; force downward; needs backlash eliminator.'],
      ['Peripheral milling', 'Surface cut parallel to the cutter axis; shape follows the cutter contour.'],
      ['Face milling', 'Surface cut at right angles to the cutter axis; flat surface.'],
      ['Slab milling', 'Peripheral milling with a cylindrical cutter on an axis parallel to the table.'],
      ['Straddle milling', 'Two side cutters machine two parallel vertical faces at once.'],
      ['Approach length A', 'Distance the cutter travels from first touch until full depth/width engagement.'],
      ['Arbor', 'Spindle extension that carries the cutter on a horizontal machine.'],
      ['Knee', 'Casting that supports the table and gives vertical (Z) motion.'],
      ['Feed per tooth', 'Advance of the work per tooth per cutter revolution, mm/tooth.']
    ]
  },

  /* ===================================================================== SHAPING */
  {
    id: 'shaping',
    title: 'Shaping & planing',
    slides: '78–107',
    lead: `Shaping and planing remove metal with a single-point tool by relative reciprocating motion: in a shaper the tool reciprocates and the work is fed; in a planer the work reciprocates and the tool is fed. Cutting is intermittent (forward stroke cuts, return stroke is idle). A quick-return mechanism (crank/slotted link, or hydraulic) shortens the idle stroke. Feed per stroke controls surface finish; the clapper box lifts the tool on the return stroke.`,
    sections: [
      {
        id: 'shaping-intro',
        title: 'Shaping and planing: definition',
        slides: [79, 80],
        html: `
<ol>
<li>Shaping and planing are among the <b>oldest single-point machining processes</b> and the simplest of all machining operations.</li>
<li>Defined as removing metal from a surface in horizontal, vertical or inclined position to produce a <b>flat or plane surface</b>, slots and grooves, by a <b>relative reciprocating motion</b> between tool and work.</li>
<li>Both use a straight-line cutting motion with a <b>single-point cutting tool</b>.</li>
<li><b>Main difference:</b> in shaping, the <b>tool reciprocates</b> (horizontally) and the work is fed; in planing, the <b>work reciprocates</b> (horizontally) and the tool is fed in.</li>
<li>Cutting is <b>intermittent</b> in both: the tool cuts only in the forward working stroke, followed by an idle return stroke.</li>
</ol>`
      },
      {
        id: 'shaping-vs-planing',
        title: 'Shaping vs planing: differences and similarities',
        slides: [81, 82, 83],
        html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Shaping</th><th>Planing</th></tr></thead>
<tbody>
<tr><td>Reciprocating member</td><td>Tool (on the ram)</td><td>Work (on the table)</td></tr>
<tr><td>Feed given to</td><td>Work (table) at the end of each stroke</td><td>Tool (tool head) at the end of each stroke</td></tr>
<tr><td>Size of work</td><td>Small and medium, up to about 500 mm stroke</td><td>Very large and heavy work (long beds, large castings)</td></tr>
<tr><td>Cutting velocity</td><td>Not constant along the stroke (crank mechanism): zero at the start, maximum mid stroke, zero at the end</td><td>Linear and constant along the cutting path</td></tr>
<tr><td>Tools</td><td>Usually one tool</td><td>Several tools can cut at once, in different heads</td></tr>
<tr><td>Machine</td><td>Lighter, less rigid, cheaper</td><td>Heavy, rigid, expensive, large floor space</td></tr>
<tr><td>Quick return</td><td>Crank and slotted lever, hydraulic</td><td>Drive via reversing motor, rack and pinion, or hydraulic</td></tr>
<tr><td>Use</td><td>Toolroom, small batches</td><td>Heavy work, large flat surfaces, T-slots, guideways</td></tr>
</tbody></table></div>
<h4>Similarities (slide 83)</h4>
<ol>
<li>Both are conventional machining operations that follow the <b>subtractive</b> approach (layer-by-layer removal from a solid blank).</li>
<li>Both use general-purpose machine tools.</li>
<li>Neither uses rotational motion (unlike turning, milling, drilling); only reciprocating motion gives the cutting velocity, feed and depth of cut.</li>
<li>Applications are similar: straight slots, grooves, pockets, T-slots, V-blocks, etc.</li>
<li>Neither can produce curved slots (circular or parabolic).</li>
<li>Excess material is removed as chips (unlike non-traditional processes).</li>
<li>Both use a <b>single-point tool</b> (only one edge cuts at a time).</li>
<li>A quick-return mechanism is used in both, but the points of application differ.</li>
</ol>
<p class="muted small">Slide 92-96 geometry produced by both: flat surfaces, chuck key, V-block, external and internal keyways, dovetail, rack, contour.</p>`
      },
      {
        id: 'shaping-conditions',
        title: 'Cutting conditions; principle of working',
        slides: [84, 85],
        html: `
<ol>
<li><b>Cutting velocity V:</b> in planing it is linear and constant along the cutting path. In shaping it is more complicated: the tool is held in the tool post on the ram which reciprocates over the work with a forward cutting stroke at velocity V and a faster quick return stroke. V is not constant along the stroke: it rises from zero to a maximum at the beginning and gradually decreases to zero at the end of the stroke; V is treated as a representative (average) value for time calculations.</li>
<li><b>Feed f:</b> in mm per stroke, at right angles to the cutting direction.</li>
<li><b>Depth of cut d:</b> distance between the work surface and the machined surface (as usual).</li>
</ol>
<h4>Working principle</h4>
<ol>
<li>Job rigidly fixed on the table (vise, T-slots).</li>
<li>Single-point tool held in the tool post, mounted on a <b>reciprocating ram</b>.</li>
<li>Ram motion is obtained by a quick-return mechanism.</li>
<li>Tool cuts in the <b>forward stroke</b>; the return is the <b>idle stroke</b>; the two together form one operating cycle.</li>
</ol>
<h4>Shaper size and width (slide 91)</h4>
<ol>
<li><b>Size</b> of a shaper = maximum length of stroke it can take. Horizontal shapers are most often 16 to 24 in stroke; driven by 2 to 5 hp motors.</li>
<li><b>Width</b> = maximum width that can be cut, limited by table movement; most shapers have width capacity equal to or greater than the stroke length. Maximum vertical height available is about 12 to 15 in.</li>
</ol>`
      },
      {
        id: 'feed-per-stroke',
        title: 'Effect of feed per stroke on surface finish',
        slides: [86],
        html: `
<ol>
<li>Feed per stroke f (mm/stroke) is the distance the work (or tool) is advanced sideways after each stroke.</li>
<li>The tool leaves a ridge pattern of peak-to-valley height h that increases with f: roughly <b>h ∝ f²/(8r)</b> for a rounded nose of radius r (flat finishing tool: h depends on the lead angle).</li>
<li><b>Large feed:</b> rough surface (high roughness Ra), higher MRR, fewer strokes, shorter time, larger cutting force.</li>
<li><b>Small feed:</b> fine finish, lower force, but more strokes and longer machining time.</li>
<li>Therefore use a coarse feed for roughing and a small feed (plus a wide-nose finishing tool) for finishing.</li>
<li>Number of strokes = width of work / feed per stroke.</li>
</ol>`
      },
      {
        id: 'shaper-parts',
        title: 'Parts of a horizontal shaper',
        slides: [87, 88, 89, 90, 91],
        html: `
<p>The shaper is simple, used in the toolroom or for prototype work; tooling is simple and it does not need operator attention while cutting. The horizontal shaper is the most common type.</p>
<ol>
<li><b>Ram:</b> slides back and forth in dovetail or square ways to transmit power to the cutter. The starting point and the length of stroke are adjustable.</li>
<li><b>Tool head:</b> fastened to the ram on a circular plate so it can be rotated for angular cuts; can be moved up and down with a hand crank for precise depth.</li>
<li><b>Clapper box:</b> needed because the cutter drags over the work on the return stroke; it is hinged so the cutting tool does not dig in. It is raised automatically by mechanical, air or hydraulic action.</li>
<li><b>Table:</b> moved left and right, usually by hand, to position the work, and then moved sideways (by hand or automatically) to feed the work at the end or beginning of each stroke.</li>
<li><b>Saddle:</b> moves up and down (Y axis), usually by hand, to set the rough position; final depth by the hand crank of the tool head.</li>
<li><b>Column:</b> supports the ram and the rails for the saddle; houses the mechanism for moving ram and table.</li>
<li><b>Tool holders:</b> same as on an engine lathe but larger; rake and clearance angles similar to lathe tools but <b>smaller</b> because the work surface is flat; the cutter works in a vertical plane.</li>
<li><b>Work holding:</b> a vise with long ways opening up to 14 in or more; may have a swivel base. Large work is clamped directly on the table like on a milling table.</li>
</ol>
<p class="muted small">Strain-back effect and why clearance &lt; 4°: Answer Note J.</p>`
      },
      {
        id: 'quick-return',
        title: 'Quick-return mechanism (crank and rocker)',
        slides: [97, 98],
        html: `
<ol>
<li>Motions in a shaper: <b>reciprocating</b> cutting motion of the tool (main) and the <b>auxiliary</b> feed. In the forward stroke the cut is made; in the return stroke the tool just slides back, so the idle time must be reduced.</li>
<li>Achieved with a <b>quick return mechanism</b>, in which the return stroke is made faster than the forward stroke.</li>
<li>Typical crank type: the motor drives the <b>bull gear</b>, which carries a pin in a circular path. The pin fits in the slot of a <b>rocker arm</b> and slides in it; as the bull gear rotates, the rocker arm oscillates about its pivot.</li>
<li>The end of the rocker arm is connected to the ram through a link arm. The stroke length is changed by changing the radius of the circle of the pin on the bull gear; the travel is slightly longer than the work length.</li>
<li>The forward stroke takes a larger crank angle (e.g. 220°) than the return (140°), so return is faster. Time ratio (forward/return) = 220/140 ≈ 1.57.</li>
<li>Velocity profile of the crank mechanism varies continuously along the stroke; the return stroke has a higher velocity.</li>
</ol>`
      },
      {
        id: 'hydraulic-shaper',
        title: 'Hydraulic shaper and quick return; hydraulic vs mechanical',
        slides: [99, 100, 101],
        html: `
<p><b>Why a hydraulic drive:</b> the mechanical shaper has the problem of inertia of the main drive components, which need time for reversal at every stroke, so a large proportion of the time the tool cuts air.</p>
<h4>Working</h4>
<ol>
<li>The ram is connected to a <b>hydraulic cylinder</b> controlled by a valve. Hydraulic fluid is pumped to the cylinder through the valve; the valve is also connected to the reservoir.</li>
<li>The valve controls the direction of high-pressure fluid into the cylinder and so the direction of motion: cutting stroke or return stroke. A flow-control valve controls the flow rate of fluid and thereby the speed of the ram.</li>
<li>A finger-operated lever starts and stops the machine; an <b>adjustable trip-dog</b> operated lever controls the valve to reverse the ram.</li>
<li>For quick return the fluid is sent to the other side of the piston at a higher flow rate (area difference/more flow), so return is faster than cutting.</li>
</ol>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Hydraulic shaper</th><th>Mechanical shaper</th></tr></thead>
<tbody>
<tr><td>Cutting speed</td><td><b>Constant</b> throughout the cutting stroke</td><td>Varies continuously over the stroke (crank mechanism)</td></tr>
<tr><td>Power use</td><td>Constant power available, so the full capacity of the tool can be used</td><td>Cutting capacity limited because speed varies</td></tr>
<tr><td>Reversal</td><td>Quick and shock-free (small inertia of moving parts)</td><td>Impact at reversal; large inertia</td></tr>
<tr><td>Speed range</td><td>Large number and range of speeds</td><td>Limited by the gear drive</td></tr>
<tr><td>Strokes per minute</td><td>More, due to less reversal and return time</td><td>Fewer</td></tr>
<tr><td>Cost</td><td>More expensive</td><td>Cheaper</td></tr>
<tr><td>Stroke end</td><td>Stopping point can vary with the resistance offered to cutting by the work material (not positive)</td><td>Positive, fixed by crank radius</td></tr>
<tr><td>Maintenance</td><td>Oil leakage, sealing, oil heating</td><td>Gears and bearings wear</td></tr>
<tr><td>Overload protection</td><td>Relief valve gives safe overload protection</td><td>Needs friction clutch / shear pin</td></tr>
</tbody></table></div>`
      },
      {
        id: 'shaper-calc',
        title: 'Shaper machining time and MRR',
        slides: [102, 103, 104, 105, 106],
        html: `
<ol class="steps">
<li>Stroke length S = length of job + clearance at the start and end (approach and over-travel).</li>
<li>Forward (cutting) stroke time: <b>tf = S / V</b> (V = cutting speed, mm/min).</li>
<li>Return time from the crank angles (crank rotates at constant speed): <b>tr = tf × (return angle / forward angle)</b>. For forward 220° the return is 360° − 220° = 140°, so tr = tf × 140/220.</li>
<li>Time per cycle: tc = tf + tr; <b>strokes per minute = 1 / tc</b>.</li>
<li>Number of strokes per pass = width of job / feed per stroke (round up).</li>
<li>Number of passes = height (stock) to be removed / depth of cut per pass (round up).</li>
<li><b>Total time = passes × strokes per pass × tc</b>.</li>
<li>MRR = volume removed per stroke × strokes per minute = f · d · L · (strokes per min), where L is the length of cut.</li>
</ol>
<p>Slide 104, Q1: shaper at 24 000 mm/min, work 250 long × 120 wide, f = 0.6 mm/stroke, d = 3 mm, forward stroke in 220°, height to be reduced = 6 mm: find forward time, return time, total time, strokes per minute. Solved in the answer bank under 2016-17_6d.</p>
<p>Slide 106 (assignment): 11.20 m/min, 300 × 125 mm job, f = 0.6, d = 6 mm, forward in 230°, height to be reduced 15 mm; find the five items and the MRR.</p>`
      }
    ],
    formulas: [
      { name: 'Forward stroke time', expr: 'tf = (L + clearance) / V', vars: 'V = cutting speed (mm/min)', slide: 102 },
      { name: 'Return time (crank angles)', expr: 'tr = tf · (360° − α) / α', vars: 'α = forward-stroke crank angle (e.g. 220°)', slide: 102 },
      { name: 'Strokes per minute', expr: 'n = 1 / (tf + tr)', vars: 'times in minutes', slide: 104 },
      { name: 'Number of strokes per pass', expr: 'Ns = W / f', vars: 'W = job width, f = feed per stroke (round up)', slide: 102 },
      { name: 'Number of passes', expr: 'Np = h / d', vars: 'h = height of stock to remove, d = depth per pass', slide: 102 },
      { name: 'Total machining time', expr: 'Tm = Np · Ns · (tf + tr)', vars: 'minutes', slide: 104 },
      { name: 'MRR (shaping)', expr: 'MRR = f · d · L · n', vars: 'L = length of cut, n = strokes/min', slide: 103 }
    ],
    keyTerms: [
      ['Shaping', 'Tool reciprocates, work fed sideways; flat surfaces, slots, grooves.'],
      ['Planing', 'Work reciprocates, tool fed; for large heavy work.'],
      ['Forward / idle stroke', 'Cutting stroke and non-cutting return stroke of the ram.'],
      ['Quick-return mechanism', 'Mechanism making the return stroke faster than the forward stroke to cut idle time.'],
      ['Bull gear', 'Large gear of the crank-type shaper that carries the crank pin.'],
      ['Clapper box', 'Hinged tool support that lifts the tool on the return stroke so it does not drag or dig in.'],
      ['Feed per stroke', 'Sideways advance after each stroke, mm/stroke.'],
      ['Shaper size', 'Maximum stroke length.'],
      ['Shaper width', 'Maximum width that can be cut, limited by table travel.'],
      ['Hydraulic shaper', 'Ram driven by a hydraulic cylinder: constant cutting speed, smooth reversal.']
    ]
  },

  /* ===================================================================== GRINDING */
  {
    id: 'grinding',
    title: 'Grinding',
    slides: '108–144',
    lead: `Grinding removes material with a rotating wheel of abrasive grains held by a bond; it is the most accurate machining process and works on hard materials. Wheel performance is set by five parameters: abrasive, grit size, bond, grade (hardness) and structure. Operations are surface, cylindrical and centreless grinding; creep-feed grinding does deep cuts in one slow pass. Wheels glaze or load and need dressing and truing. Grinding time uses the approach A and passes = width/crossfeed.`,
    sections: [
      {
        id: 'grinding-intro',
        title: 'Introduction and advantages of grinding',
        slides: [109, 110, 111],
        html: `
<ol>
<li>Grinding removes material from the workpiece by a <b>rotating wheel whose surface is composed of abrasive grains</b>.</li>
<li>It is considered the <b>most accurate</b> of the existing machining processes; used when high accuracy, close tolerances and fine surface finish are needed; hard materials can also be machined.</li>
<li>It is just as much a metal cutting process as milling or turning; the wheel simply has <b>thousands of tiny cutting edges</b> instead of a few large ones.</li>
</ol>
<h4>Advantages</h4>
<ol>
<li>Hardened steel can be cut (part machined in annealed state, then a small allowance ground after hardening).</li>
<li>Extremely smooth finishes; the wheel can be wide, so no feed marks.</li>
<li>Work finished to accurate dimensions in a comparatively short time.</li>
<li>Very little pressure is needed, so thin light work and magnetic chucks can be used.</li>
</ol>`
      },
      {
        id: 'grinding-cond',
        title: 'Cutting conditions and MRR in grinding',
        slides: [112, 113],
        html: `
<ol>
<li>Cutting velocity is very high: <b>V = π D N</b> (D wheel dia, N wheel rpm; V in m/s or m/min).</li>
<li>Depth of cut d is called <b>infeed</b>. The distance the wheel is fed sideways is the <b>cross-feed</b>, which is the <b>width of cut w</b>.</li>
<li>Cross-sectional area of cut: <b>CSA = cross-feed × infeed = w · d</b>.</li>
<li>The work moves past the wheel at a linear velocity called the work feed <b>Vw</b> (m/min).</li>
<li><b>MRR = Vw · w · d</b>.</li>
<li>Length of contact: <b>lc = √(D · d)</b>.</li>
</ol>
<p class="muted small">Why specific energy in grinding is high, and the worked 2017-18 Q7(c) numerical: Answer Note K and the answer bank.</p>`
      },
      {
        id: 'grinding-wheel',
        title: 'The grinding wheel and its five parameters',
        slides: [114, 115],
        html: `
<p>A grinding wheel is a rotary cutting tool consisting of an enormous number of abrasive grains (cutting edges) held together by organic or inorganic bonds. Each grain cuts like a tooth. The large number of points in action at once means the load per point is small, so there is little tendency for the wheel to spring away from the work.</p>
<p>The properties that determine how a wheel acts: kind and size of abrasive, how closely the grains are packed and the amount of bond. The five parameters are:</p>
<ol>
<li><b>Abrasive material</b></li>
<li><b>Grain (grit) size</b></li>
<li><b>Bonding material</b></li>
<li><b>Wheel grade</b> (hardness)</li>
<li><b>Wheel structure</b></li>
</ol>`
      },
      {
        id: 'abrasives',
        title: '1. Abrasive types',
        slides: [116],
        html: `
<p>Abrasives are hard materials with adequate toughness that act as cutting edges long enough. They have <b>friability</b>: the ability to fracture into smaller pieces as force increases, which gives <b>self-sharpening</b>.</p>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Abrasive</th><th>Work materials</th></tr></thead>
<tbody>
<tr><td>Aluminium oxide (Al₂O₃)</td><td>Hardened steels, HSS, steels, cast iron</td></tr>
<tr><td>Silicon carbide (SiC)</td><td>HSS, cemented carbides, aluminium, brass, brittle materials</td></tr>
<tr><td>Cubic boron nitride (CBN)</td><td>Tool steels, aerospace alloys</td></tr>
<tr><td>Diamond</td><td>Ceramics, cemented carbides</td></tr>
</tbody></table></div>`
      },
      {
        id: 'grit',
        title: '2. Grain size',
        slides: [117],
        html: `
<ol>
<li>Grain size is the average physical size of the abrasive grains; important for surface finish and MRR.</li>
<li>Small grains take a very small depth of cut and give a <b>better finish</b>; large grains permit <b>larger MRR</b>.</li>
<li>Classified by a <b>screen mesh</b> procedure: <b>smaller grit sizes have larger numbers</b>. Typical range <b>6 to 600</b>; grit 6 is very coarse, 600 very fine. Up to 1000 for some superfinishing operations.</li>
<li>"20 grit" means grains passed a screen with about <b>20 openings per linear inch</b>: a <b>very coarse</b> wheel, used for fast stock removal (rough grinding), giving a rough surface.</li>
</ol>`
      },
      {
        id: 'bond',
        title: '3. Bond types',
        slides: [118, 119],
        html: `
<p>The bond holds the grains and gives the wheel its shape and structural integrity. Desired bond properties: strength, toughness, hardness and temperature resistance.</p>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Bond</th><th>Material</th><th>Properties</th><th>Uses</th></tr></thead>
<tbody>
<tr><td><b>Vitrified</b></td><td>Chiefly ceramic materials</td><td>Strong and rigid, resists high temperatures, unaffected by cutting fluids; poor shock resistance. Most common bond.</td><td>Most grinding wheels in common use</td></tr>
<tr><td><b>Resinoid</b></td><td>Thermosetting resins</td><td>Very high strength; cost-effective cutting, faster operation, minimum heating, reduced burr.</td><td>Rough grinding, cut-off wheels</td></tr>
<tr><td><b>Rubber</b></td><td>Rubber</td><td>Most flexible bond; precise burr-free cut, no alteration of material characteristics, superior finish.</td><td>Cut-off wheels, driving (regulating) wheels in centreless grinding, extremely fine finishes on bearing surfaces</td></tr>
<tr><td><b>Metallic</b></td><td>Metal, usually bronze</td><td>Abrasive bonded only on the outside rim, conserving costly abrasive; electrically conductive.</td><td>Diamond and CBN wheels; electrolytic grinding</td></tr>
</tbody></table></div>`
      },
      {
        id: 'grade',
        title: '4. Grade (hardness) of the wheel',
        slides: [120],
        html: `
<ol>
<li>Grade (hardness) indicates the ability of the <b>bond to hold the abrasive grains</b> in place; it depends on the kind of bond, structure and amount of abrasive.</li>
<li><b>Soft bond</b> lets grains break away readily: use it when the abrasive dulls rapidly, i.e. when grinding <b>hard materials</b>.</li>
<li><b>Hard bond</b> keeps grains longer: use it when grinding <b>soft materials</b>.</li>
<li>Therefore: <b>hard wheel for soft material and soft wheel for hard material</b>. Reason: on hard work grains blunt fast; a soft wheel releases dulled grains and exposes new sharp ones, avoiding glazing. On soft work grains stay sharp and wear slowly, a hard wheel retains them, whereas a soft wheel would shed useful grains and wear out quickly.</li>
<li>Scale <b>A (soft) to Z (hard)</b>: A–H soft, I–P medium, Q–Z hard.</li>
<li>Grade has no relation to the hardness of the abrasive: a soft-grade wheel can be made of the hardest abrasive.</li>
<li>Grade affects wheel speed, coolant flow, feed rates and grinding depth.</li>
</ol>`
      },
      {
        id: 'structure',
        title: '5. Structure (density)',
        slides: [121],
        html: `
<ol>
<li>Structure is the <b>spacing of the abrasive grains</b> in the wheel, from open to dense, denoted by numbers: <b>1 (densest) to 17 (least dense)</b>.</li>
<li><b>Open structure</b>: more pores, fewer grains per unit volume. The spaces collect chips, avoiding <b>loading</b>; used for <b>high stock removal</b>, deeper or wider cuts, with less coolant. Gives a rough surface; also for soft/ductile materials.</li>
<li><b>Dense structure</b>: used for <b>better surface finish and dimensional precision</b>, hard and brittle materials, light cuts.</li>
<li>Appropriate density: open for rough heavy stock removal and soft gummy metals; dense for finishing; the choice balances chip clearance against number of cutting points.</li>
</ol>`
      },
      {
        id: 'marking',
        title: 'Wheel marking system and shapes',
        slides: [122, 123, 124, 125],
        html: `
<ol>
<li>Grinding wheels are marked with a standard system of letters and numbers specifying the parameters.</li>
<li>Standard marking for Al₂O₃ and SiC: <b>abrasive letter, grit number, grade letter, structure number, bond letter</b>. Example <span class="mono">A 60 K 5 V</span> = aluminium oxide, grit 60 (medium), grade K (medium), structure 5 (medium-dense), vitrified bond.</li>
<li>A separate system exists for CBN and diamond wheels (abrasive, grit, grade, concentration, bond, depth of abrasive).</li>
<li>Wheels come in many shapes and sizes; the nine standard shapes were established by the Grinding Wheel Manufacturers' Association (straight, cylinder, tapered, recessed, cup, flaring cup, dish, saucer and so on).</li>
</ol>`
      },
      {
        id: 'grinding-types',
        title: 'Types of grinding operation',
        slides: [126, 127, 128, 129],
        html: `
<p>Three types of grinding based on the type of surface produced: <b>surface</b>, <b>cylindrical</b> (internal, external) and <b>centreless</b>.</p>
<ol>
<li><b>Surface grinding:</b> the most common; a rotating wheel grinds flat surfaces. Types: <b>horizontal or vertical spindle</b> and <b>rotary or reciprocating table</b>.</li>
<li><b>External cylindrical grinding (centre-type):</b> removes cylindrical surfaces and shoulders. Wheel and work are rotated by separate motors at different speeds; the wheel axis can be adjusted for variety of shapes.</li>
<li><b>Internal cylindrical grinding:</b> grinds the inside diameter; tapered holes can be ground with swivelling internal grinders.</li>
</ol>`
      },
      {
        id: 'centreless',
        title: 'Centreless grinding',
        slides: [130, 131, 132],
        html: `
<ol>
<li>A process for continuously grinding cylindrical surfaces in which the workpiece is supported <b>not by centres or chucks but by a rest blade</b>.</li>
<li>The workpiece is ground between <b>two wheels</b>: the larger <b>grinding wheel</b> does the grinding; the smaller <b>regulating wheel</b> (rubber bond), tilted at angle <b>i</b>, controls the axial feed velocity Vf of the work.</li>
<li>It can be external or internal, <b>traverse-feed (through-feed)</b> or <b>plunge</b> grinding. The most common is external traverse feed.</li>
<li>Parts: roller bearings, piston pins, shafts. Parts of variable diameter (bolts, valve tappets, distributor shafts) by plunge grinding. Sleeves and rings by internal centreless grinding, supported between three rolls.</li>
<li>Advantages: no centre holes, fast loading and high production, good roundness, long thin parts ground without deflection.</li>
</ol>`
      },
      {
        id: 'creep-feed',
        title: 'Creep-feed grinding',
        slides: [133, 134, 135, 136],
        html: `
<ol>
<li>Grinding is traditionally for small removal and finishing, but it can also do large-scale removal like milling, shaping and planing.</li>
<li>In <b>creep-feed grinding</b> the depth of cut (infeed) is as much as <b>6 mm</b> and the workpiece speed is low; the full depth is removed in <b>one slow pass</b>.</li>
<li>Wheels are mostly <b>softer-grade, resin-bonded, open structure</b> to keep temperatures low. Economical for cavities and grooves.</li>
<li>Idle time (stopping the wheel, table reversal) is reduced because the job is finished in one pass. Forces and power requirement increase; continuous dressing of the wheel is necessary.</li>
</ol>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Creep-feed grinding</th><th>Conventional grinding</th></tr></thead>
<tbody>
<tr><td>Depth of cut</td><td>Large, up to about 6 mm</td><td>Small, typically a few hundredths of a mm</td></tr>
<tr><td>Work speed</td><td>Very low</td><td>Relatively high</td></tr>
<tr><td>Passes</td><td>One (deep) pass</td><td>Many shallow passes</td></tr>
<tr><td>Wheel</td><td>Soft, open, resin bonded; continuously dressed</td><td>Harder grade, denser structure, vitrified</td></tr>
<tr><td>Contact length</td><td>Long</td><td>Short</td></tr>
<tr><td>Forces, power</td><td>High (40 to 120 kW)</td><td>Lower</td></tr>
<tr><td>Heat</td><td>Heavy thermal load; large coolant flow needed</td><td>Moderate</td></tr>
<tr><td>Idle time / reversals</td><td>Very few</td><td>Many table reversals</td></tr>
<tr><td>Application</td><td>Deep slots, profiles, difficult alloys</td><td>Finishing of flat/cylindrical surfaces</td></tr>
<tr><td>Machine</td><td>Special, rigid, high power</td><td>Standard grinder</td></tr>
</tbody></table></div>
<h4>Advantages</h4>
<ol>
<li>High MRR (deep profile in one pass, lower cycle time).</li>
<li>Precision on tight tolerances and deep complex shapes.</li>
<li>Good surface finish due to steady contact and low feed.</li>
<li>Reduced machine wear (fewer reversals).</li>
<li>Longer wheel life (forces shared by more grits).</li>
<li>Works on superalloys, ceramics, hardened steels.</li>
</ol>
<h4>Disadvantages</h4>
<ol>
<li>Thermal damage and cracking if cooling is insufficient.</li>
<li>High equipment cost (spindle power 40 to 120 kW, rigid machine).</li>
<li>Extra equipment: rotary dressers, filtration, high-pressure high-flow coolant.</li>
<li>High cutting forces need exceptional static and dynamic rigidity.</li>
</ol>`
      },
      {
        id: 'wheel-defects',
        title: 'Wheel defects: glazing and loading',
        slides: [137],
        html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Glazing</th><th>Loading</th></tr></thead>
<tbody>
<tr><td>Meaning</td><td>Face of the wheel acquires a <b>glass-like appearance</b>: cutting points of the abrasives are dull and worn down to the bond</td><td>Cutting face is clogged: the pores/openings fill with <b>chips of workpiece material</b></td></tr>
<tr><td>Effect</td><td>Wheel face smoother; it stops cutting, rubs, heats the work</td><td>Chips adhere, preventing grinding action</td></tr>
<tr><td>Occurs when</td><td>Wheel is too hard for the work, speed too high, continued use (dull grains not released)</td><td>Grinding <b>soft</b> (ductile) material, wheel structure too dense or too fine, insufficient coolant</td></tr>
<tr><td>Remedy</td><td>Dressing; use a softer-grade wheel</td><td>Dressing; use an open structure / coarser grit, more coolant</td></tr>
</tbody></table></div>
<p>Glazing is called a major and inevitable defect after continuous use.</p>`
      },
      {
        id: 'dressing-truing',
        title: 'Dressing, truing and balancing',
        slides: [138, 139, 140],
        html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Dressing</th><th>Truing</th></tr></thead>
<tbody>
<tr><td>Purpose</td><td>Removes loading and breaks away the glazed surface so that sharp abrasive particles form again</td><td>Regenerates the required geometry of the wheel when it becomes worn or breaks away at different points</td></tr>
<tr><td>Produces</td><td><b>Micro-geometry</b> (cutting ability of the wheel)</td><td><b>Macro-geometry</b> (shape; makes the wheel true and concentric with the bore)</td></tr>
<tr><td>Cures</td><td>Glazing and loading</td><td>Out-of-roundness, wrong profile; also needed on a new wheel for concentricity</td></tr>
<tr><td>Effect on accuracy</td><td>Influences the cutting condition</td><td>Accuracy of the finished work directly relates to the effective wheel geometry</td></tr>
<tr><td>In practice</td><td>Commonly combined with truing for conventional wheels</td><td>Separate operations for superabrasive wheels</td></tr>
</tbody></table></div>
<h4>Balancing</h4>
<ol>
<li>A balanced wheel has its centre of mass coinciding with the axis of rotation.</li>
<li>Out-of-balance wheels (from continuous use) give poor surface quality and strain the machine; balancing cannot be done by truing or dressing.</li>
<li>Done at mounting by moving weights around a recessed flange.</li>
</ol>`
      },
      {
        id: 'grinding-time',
        title: 'Grinding time estimation (horizontal and vertical axis)',
        slides: [141, 142, 143, 144],
        html: `
<h4>Horizontal-axis surface grinding: approach allowance</h4>
<ol class="steps">
<li>The wheel must traverse beyond the work by an approach distance A before it is at full depth (same geometry as slab milling).</li>
<li>Triangle: hypotenuse D/2 (wheel radius), vertical side D/2 − d, horizontal side A.</li>
<li>A² = (D/2)² − (D/2 − d)² = Dd − d², so <b>A = √(d(D − d))</b>.</li>
<li>This is very small since d is small, but to allow for <b>table reversal</b> at each end of the stroke, the wheel radius is taken as the approach allowance in practice: <b>A = D/2</b>.</li>
<li>Time for one pass: <b>t1 = (L + 2A) / (table feed rate)</b>.</li>
<li>Number of passes: <b>n = width of work / cross-feed</b> (round up).</li>
<li>Total grinding time = n × t1.</li>
</ol>
<h4>Vertical-axis surface grinding</h4>
<ol class="steps">
<li>The wheel face (diameter D) grinds the work of width W; A is the approach distance beyond the work.</li>
<li>For W less than D/2 the geometry gives <b>A = √(W(D − W))</b>, where W is the width of cut.</li>
<li>For W greater than or equal to D/2 the approach is the wheel radius: <b>A = D/2</b>.</li>
<li>Time for one pass = (L + 2A)/(table feed rate), with approach allowance as the wheel radius for table reversal.</li>
</ol>
<p class="muted small">Honing and super-finishing (not in the slides): Answer Note L. Slide 171 assignment 1: C65 steel 100 × 250 mm, horizontal grinder, wheel Ø250 × 20, table 10 m/min, wheel 20 m/s: find grinding time.</p>`
      },
      {
        id: 'finishing',
        title: 'Honing and super-finishing (brief, Note L)',
        slides: [144],
        html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Honing</th><th>Super-finishing</th></tr></thead>
<tbody>
<tr><td>Surface</td><td>Internal cylindrical holes (bores)</td><td>External surfaces (bearing races, crankpins)</td></tr>
<tr><td>Motion</td><td>Rotation + long axial reciprocation, giving cross-hatch</td><td>Short rapid oscillation of stone while work rotates</td></tr>
<tr><td>Pressure / grit</td><td>0.5–3 MPa, grit 80–600</td><td>0.1–0.3 MPa, grit 400–1000+</td></tr>
<tr><td>Result</td><td>Corrects size, roundness, taper; Ra 0.1–0.8 µm</td><td>Removes the smear layer; Ra 0.01–0.1 µm</td></tr>
</tbody></table></div>`
      }
    ],
    formulas: [
      { name: 'Wheel cutting speed', expr: 'V = π D N', vars: 'D wheel dia, N wheel rpm', slide: 112 },
      { name: 'Cross-sectional area of cut', expr: 'CSA = w · d', vars: 'w = cross-feed (width), d = infeed', slide: 112 },
      { name: 'MRR (grinding)', expr: 'MRR = Vw · w · d', vars: 'Vw = work (table) speed', slide: 112 },
      { name: 'Contact length', expr: 'lc = √(D · d)', vars: 'D wheel dia, d infeed', slide: 112 },
      { name: 'Approach (horizontal axis)', expr: 'A = √(d (D − d))  ≈  D / 2 in practice', vars: 'wheel radius used for table reversal allowance', slide: 141 },
      { name: 'Time for one pass', expr: 't1 = (L + 2A) / table feed rate', vars: 'L = length of work', slide: 142 },
      { name: 'Number of passes', expr: 'n = width / crossfeed', vars: 'round up', slide: 142 },
      { name: 'Approach (vertical axis)', expr: 'A = √(W (D − W)) for W < D/2 ;  A = D/2 for W ≥ D/2', vars: 'W = width of cut', slide: 143 },
      { name: 'Specific energy', expr: 'U = P / MRR = Fc · v / MRR', vars: 'v = wheel speed', slide: 112 }
    ],
    keyTerms: [
      ['Abrasive', 'Hard friable grain (Al₂O₃, SiC, CBN, diamond) that acts as a cutting edge.'],
      ['Grit size', 'Mesh number of the grain: larger number = finer grain (6 to 600).'],
      ['Grade', 'Hardness of the wheel: bond strength holding grains, A (soft) to Z (hard).'],
      ['Structure', 'Grain spacing, 1 (dense) to 17 (open).'],
      ['Vitrified bond', 'Ceramic bond; most common, rigid, brittle.'],
      ['Infeed', 'Depth of cut in grinding.'],
      ['Cross-feed', 'Sideways feed of the wheel; equals width of cut w.'],
      ['Creep-feed grinding', 'Deep cut (to 6 mm) in a single slow pass with a soft, open wheel.'],
      ['Glazing', 'Dull grains worn flat to the bond; wheel face glassy and stops cutting.'],
      ['Loading', 'Pores of the wheel clogged with metal chips.'],
      ['Dressing', 'Restores sharpness (micro-geometry); cures glazing and loading.'],
      ['Truing', 'Restores shape and concentricity (macro-geometry).'],
      ['Regulating wheel', 'Smaller tilted wheel in centreless grinding that controls work rotation and axial feed.']
    ]
  },

  /* ===================================================================== DRILLING */
  {
    id: 'drilling',
    title: 'Drilling & hole making',
    slides: '145–171',
    lead: `Drilling produces round holes with multi-tooth rotary drills (about 25% of all machining operations). The twist drill has shank, body and point; its two lips cut, the web forms the chisel edge, the flutes carry chips and the margins guide it. Accurate holes need a sequence: centering, drilling, boring/reaming, with countersink, counterbore, spotface and tap as related operations. Time Tm = (depth + A)/fr, A = 0.5·D·tan(90° − θ/2), MRR = πD²fr/4.`,
    sections: [
      {
        id: 'drilling-intro',
        title: 'Introduction to drilling',
        slides: [146, 147],
        html: `
<ol>
<li><b>Drilling</b> produces round holes in solid material or enlarges existing holes using multi-tooth cutting tools called <b>drills</b> or drill bits; the twist drill is the most common.</li>
<li>It is the most common single machining operation: about <b>25% of machining</b>.</li>
<li>At the drill tip four actions take place: (1) a small hole is formed by the <b>web</b> (chips are not cut normally there); (2) chips are formed by the <b>rotating lips</b>; (3) chips are removed by the screw action of the <b>helical flutes</b>; (4) the drill is guided by <b>lands/margins</b> rubbing the hole wall.</li>
<li><b>Drill definition:</b> a rotary end-cutting tool having one or more cutting lips and one or more helical or straight flutes for the passage of chips and the admission of cutting fluid.</li>
</ol>`
      },
      {
        id: 'twist-drill',
        title: 'Twist drill nomenclature and geometry',
        slides: [148, 149, 150, 151],
        html: `
<p>Three main components: <b>shank, body, point</b>.</p>
<ol>
<li><b>Shank:</b> the portion clamped to give the drive. Straight shank for drills up to ½ in (shank diameter equals body diameter). Above ½ in, the shank can be tapered (with a tang) or reduced.</li>
<li><b>Body:</b> <b>Flutes</b> are helical grooves cut around the body that form the cutting edges, allow coolant to reach the cutting edge and chips to be withdrawn. <b>Margin</b> is a narrow raised section of the body giving full body-to-hole support to keep the drill aligned. <b>Body clearance</b> is a reduced section between the flutes and the margin, <b>used to reduce friction between drill and workpiece</b>.</li>
<li><b>Web:</b> thin section at the centre forming the drill's core; increases toward the shank; forms the <b>chisel edge</b>.</li>
<li><b>Helix (spiral) angle:</b> rate of twist controls chip removal. High helix (27°–45°) gives a better chip path, used for softer material and deep holes. Low helix (10°–19°) used for harder, more brittle material.</li>
<li><b>Point angle:</b> depends on the material. Harder materials need a larger point angle; softer a sharper one. For general purpose: <b>118° included angle</b> (59° half angle).</li>
<li><b>Lip clearance angle:</b> gives support to the cutting edge. Too large gives aggressive cutting and binding; too small leads to rubbing, wear and failure. The proper amount is decided by the point angle.</li>
</ol>
<h4>Cutting edges of a twist drill (slide 150)</h4>
<ol>
<li><b>Two main cutting edges (lips)</b> formed by the intersection of flute face and flank (conical surface).</li>
<li><b>Chisel edge (dead centre)</b> at the web where the two flanks meet; it scrapes/extrudes rather than cuts.</li>
<li><b>Margins</b> (secondary cutting/guiding edges) along the body.</li>
</ol>
<p class="muted small">Why body-diameter clearance is needed, and drill sharpening: Answer Note M.</p>`
      },
      {
        id: 'drill-class',
        title: 'Classification of drills',
        slides: [152, 153, 154],
        html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Basis</th><th>Types</th><th>Description</th></tr></thead>
<tbody>
<tr><td rowspan="3">Construction</td><td>Solid</td><td>One piece of material such as HSS</td></tr>
<tr><td>Tipped solid</td><td>Body of one material with cutting lips of another brazed or bonded in place</td></tr>
<tr><td>Composite</td><td>Cutting portions held mechanically in place</td></tr>
<tr><td rowspan="2">Holding / driving</td><td>Straight shank</td><td>Cylindrical shank (same or different diameter than the body), with or without driving flats, tang, grooves or threads</td></tr>
<tr><td>Taper shank</td><td>Conical shank fitting directly into tapered holes in the spindle, sleeves or sockets; generally with a driving tang</td></tr>
<tr><td rowspan="4">Number of flutes</td><td>Two-flute</td><td>Conventional twist drill for <b>originating holes</b></td></tr>
<tr><td>Single-flute</td><td>Also for originating holes</td></tr>
<tr><td>Three-flute (core drill)</td><td>Enlarging and finishing drilled, cast or punched holes; <b>cannot produce original holes</b></td></tr>
<tr><td>Four-flute (core drill)</td><td>Used interchangeably with three-flute drills</td></tr>
<tr><td rowspan="2">Hand of cut</td><td>Right-hand cut</td><td>Rotates counterclockwise viewed from the cutting point to cut (great majority)</td></tr>
<tr><td>Left-hand cut</td><td>Rotates clockwise viewed from the cutting point</td></tr>
</tbody></table></div>`
      },
      {
        id: 'drill-types',
        title: 'Special drills and cutting tools for drilling',
        slides: [155, 156, 157, 158],
        html: `
<ol>
<li><b>Twist drill:</b> most common; two cutting edges and two helical flutes over the body length; neck and shank (straight or tapered). Taper shank is wedged into the spindle socket with a tang for positive drive; straight shank in a drill chuck.</li>
<li><b>Core drill:</b> chamfer, body, neck and shank; <b>three or four flutes</b> and equal number of margins for superior guidance and high accuracy; enlarges existing holes (cored/cast) but cannot start a hole.</li>
<li><b>Spade drill:</b> flat bottom with a sharp tip at the centre; used for large holes (90 mm or more); saves tool cost and weight, easy to grind.</li>
<li><b>Step drill:</b> multiple diameters, one set of lands ground to different diameters, for stepped holes.</li>
<li><b>Gun drill:</b> for deep holes; all gun drills are straight-fluted with a <b>single cutting edge</b>; a hole in the body carries high-pressure coolant to the tip.</li>
<li><b>Centre drill:</b> starting hole for a larger drill, or a conical hole for a lathe centre (the true purpose); a spotting drill is better for the first task.</li>
<li><b>Auger drill:</b> for large holes in wood; Archimedes screw principle; low speed, high torque.</li>
<li><b>Forstner drill:</b> flat-bottom holes in wood; cuts two ways at once; precise.</li>
<li><b>Hole saw:</b> short open cylinder with saw teeth, cuts large holes in thin material, removing only an annular ring and leaving a disc.</li>
<li><b>Reamer:</b> similar geometry to a drill but with 4 to 8 straight or helical flutes (cutting edges) and a very short tip without cutting edges; straight-flute or helical-flute with taper shank.</li>
</ol>`
      },
      {
        id: 'hole-ops',
        title: 'Operations related to drilling and the hole-making sequence',
        slides: [159, 160],
        html: `
<ol>
<li><b>Centering (centre drilling):</b> drills a starting hole to accurately establish its location for subsequent drilling.</li>
<li><b>Drilling:</b> makes the hole.</li>
<li><b>Boring:</b> a single-point boring tool enters the work axially and cuts along the internal surface of an existing hole to enlarge it or obtain more precise dimensions, set with an adjustable boring head.</li>
<li><b>Reaming:</b> slightly enlarges a hole, gives better tolerance and surface finish, using a reamer (usually straight flutes).</li>
<li><b>Counterboring:</b> a stepped hole: a larger diameter follows a smaller diameter partially into the hole; seats bolt heads below the surface.</li>
<li><b>Countersinking:</b> similar, but the step is cone-shaped for flat-head screws and bolts.</li>
<li><b>Spotfacing:</b> like milling; a flat machined surface on a localized area of the part.</li>
<li><b>Tapping:</b> internal screw threads in an existing hole with a tap.</li>
</ol>
<p><b>Typical sequence for an accurate, concentric hole:</b> centre drill, drill (undersize), bore (to correct alignment and position), ream (size and finish) (with countersink/counterbore/tap as required).</p>
<p><b>Why not drill alone:</b> a drill gives only rough tolerance (about IT11–12) and finish, may wander and bell-mouth, the hole axis may be off-position or bent, oversize from unequal lip lengths, has a drilled-in burr and poor straightness; the extra operations fix these.</p>`
      },
      {
        id: 'drill-machines',
        title: 'Drill presses and work holding',
        slides: [161, 162, 163, 164, 165],
        html: `
<ol>
<li><b>Drill press (pillar/vertical):</b> a hand drill is fine for small holes, but a drill press is preferred when location and orientation must be accurate. Parts: <b>base</b>, <b>column</b>, <b>table</b> (height adjusted by a table-lift crank and locked; can swivel aside for tall work), <b>power head</b> with motor, <b>spindle</b> with chuck (variable-speed control). Smaller table-mounted versions are bench drills.</li>
<li><b>Gang drilling machines:</b> independent columns, each doing a different operation; the work slides from one column to the next.</li>
<li><b>NC / CNC turret drills:</b> position holes under program control with indexed multiple tools.</li>
<li><b>Radial drilling machines:</b> for large workpieces; spindle on a radial arm so drilling can be anywhere along the arm.</li>
<li><b>Multiple-spindle machines:</b> one power head drives several spindles, drilling many holes at once.</li>
</ol>
<h4>Work holding</h4>
<ol>
<li><b>Vise:</b> general-purpose holder with two jaws.</li>
<li><b>Fixture:</b> usually custom designed for the part; higher accuracy, higher production rate, operator convenience; <b>no tool guidance</b>.</li>
<li><b>Jig (drill jig):</b> also specially designed; <b>provides a means of guiding the tool</b> (drill bushings), the distinguishing feature from a fixture.</li>
</ol>`
      },
      {
        id: 'drill-cond',
        title: 'Cutting conditions in drilling',
        slides: [166, 167],
        html: `
<ol>
<li>The twist drill has two symmetrical cutting edges, each removing part of the material.</li>
<li><b>Cutting speed V:</b> not constant along the cutting edge; zero at the centre and <b>maximum at the drill corner</b>. Maximum <span class="mono">V = πDN</span> (D drill diameter).</li>
<li><b>Feed per tooth fz</b> (same meaning as other multi-tooth tools; roughly proportional to drill diameter) and <b>feed per minute fm = 2·fz·N</b> (two teeth), used to adjust the feed change gears. Feed per rev f = 2fz, so fr = f·N.</li>
<li><b>Depth of cut</b> in drilling: <span class="mono">d = D/2</span>.</li>
<li><b>Core drilling</b> (enlarging an existing hole of diameter Dhole): <span class="mono">d = (Ddrill − Dhole)/2</span>.</li>
</ol>`
      },
      {
        id: 'drill-time',
        title: 'Drilling time and MRR (derivations)',
        slides: [168, 169, 170, 171],
        html: `
<h4>Blind hole: approach, time and MRR</h4>
<ol class="steps">
<li>Let D = drill diameter, θ = point angle (included), t = depth of the hole, V = cutting speed, f = feed (mm/rev).</li>
<li>Spindle speed N = 1000V/(πD) rpm; feed rate fr = f·N mm/min.</li>
<li>The conical point must enter before the drill cuts at full diameter. Half the point angle is θ/2; the cone height (approach) from the right triangle with base D/2 is <b>A = (D/2) / tan(θ/2) = 0.5·D·tan(90° − θ/2)</b>.</li>
<li>Distance the drill must travel to produce a blind hole of depth t: <b>t + A</b>.</li>
<li><b>Machining time Tm = (t + A) / fr</b> (min).</li>
<li>Once the drill is fully engaged, the removal rate is the area of the hole times the axial feed rate: <b>MRR = (πD²/4) · fr</b>.</li>
</ol>
<h4>Through hole</h4>
<ol class="steps">
<li>Plate thickness t. The drill must travel the thickness plus the approach so that the full-diameter section clears the bottom face: <b>Tm = (t + A [+ over-travel]) / fr</b>.</li>
<li>MRR = (πD²/4) · fr (same).</li>
</ol>
<p>For n identical holes: total time = n × Tm (plus handling time, if given).</p>
<p class="muted small">Slides 168–170 contain the examples used in 2023-24 Q5(b), 2022-23 Q5(b), 2021-22 Q3(c), 2017-18 Q6(c) and 2012-13 Q6(c); see the answer bank. Slide 171 assignment 2: Ø40 HSS drill through a 100 mm grade 55 cast-iron plate, f = 0.35 mm/rev.</p>`
      }
    ],
    formulas: [
      { name: 'Drill cutting speed', expr: 'V = π D N', vars: 'maximum, at the drill corner (V in m/min with D in m, or divide by 1000 with D in mm)', slide: 166 },
      { name: 'Spindle speed', expr: 'N = 1000 V / (π D)', vars: 'V m/min, D mm', slide: 166 },
      { name: 'Feed per minute', expr: 'fr = f · N  (fm = 2 fz N)', vars: 'f = mm/rev, fz = feed per tooth', slide: 167 },
      { name: 'Depth of cut (drilling)', expr: 'd = D / 2', vars: 'solid drilling', slide: 167 },
      { name: 'Depth of cut (core drilling)', expr: 'd = (Ddrill − Dhole) / 2', vars: 'enlarging an existing hole', slide: 167 },
      { name: 'Approach (point allowance)', expr: 'A = 0.5 · D · tan(90° − θ/2)', vars: 'θ = point angle (e.g. 118°)', slide: 168 },
      { name: 'Time, blind hole', expr: 'Tm = (t + A) / fr', vars: 't = hole depth', slide: 168 },
      { name: 'Time, through hole', expr: 'Tm = (t + A [+ over-travel]) / fr', vars: 't = plate thickness', slide: 169 },
      { name: 'MRR (drilling)', expr: 'MRR = π D² · fr / 4', vars: 'mm³/min', slide: 168 }
    ],
    keyTerms: [
      ['Twist drill', 'Rotary end-cutting tool with two lips and two helical flutes.'],
      ['Web', 'Thin central core of the drill; forms the chisel edge.'],
      ['Flute', 'Helical groove that forms cutting edges, carries chips out and coolant in.'],
      ['Margin', 'Narrow raised land that guides the drill in the hole.'],
      ['Body clearance', 'Reduced diameter behind the margin to cut friction.'],
      ['Point angle', 'Included angle between the two lips (118° general purpose).'],
      ['Helix angle', 'Twist of the flutes: high (27–45°) for soft metals, low (10–19°) for hard ones.'],
      ['Core drill', 'Three- or four-flute drill for enlarging existing holes.'],
      ['Gun drill', 'Single-lip straight-fluted drill with coolant hole for deep holes.'],
      ['Reaming', 'Slight enlargement of a hole for size accuracy and finish.'],
      ['Counterbore / countersink', 'Stepped / cone-shaped enlargement to seat bolt or flat-head screw.'],
      ['Jig vs fixture', 'A jig guides the tool; a fixture only locates and holds the work.']
    ]
  }
];
