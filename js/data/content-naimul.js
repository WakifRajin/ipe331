// IPE 331 Machine Shop Atlas - chapter study notes for Naimul Sir's part (Lec 1-5).
// Slide numbers are the page numbers of the lecture PDF (96 pages): Lec 1 = 2-29, Lec 2 = 33-45,
// Lec 3 = 48-54, Lec 4 = 57-80, Lec 5 = 84-95.
// Many slide equations were images; they are filled in with the standard textbook forms in the slide notation.
// All HTML uses only the classes listed in SPEC.md.

export const CHAPTERS_EXTRA = [
  /* ===================================================================== CUTTING MECHANICS */
  {
    id: 'cutting',
    title: 'Cutting mechanics',
    slides: 'Naimul Sir · Lec 1–4',
    lead: `Machining removes unwanted material from a preformed workpiece as <b>chips</b>, using a wedge-shaped tool that is harder than the work. Chip removal needs shearing along at least two surfaces. The cut is <b>orthogonal</b> (edge at 90° to the feed, 2-D, chip flows normal to the edge) or <b>oblique</b> (edge inclined by λ, 3-D). A single-point tool is described by its <b>rake, relief and cutting-edge angles</b> in a designation system (ASA, ORS, NRS, MRS, WRS). The chip is formed by shear on a shear plane at angle <b>β</b>; the chip reduction coefficient is <b>ξ = a2/a1</b> and tan β = cos γ / (ξ − sin γ). <b>Merchant's circle</b> links the measured forces Pz and Pxy to F, N, Ps, Pn and the shear stress τs. Tools fail by fracture, temperature or gradual <b>crater and flank wear</b>; tool life follows <b>Taylor: Vc·T^n = C</b>, and cutting fluids (straight, soluble, semi-synthetic, synthetic) control heat and friction.`,
    sections: [
      {
        id: 'cut-intro',
        title: 'Machining and metal cutting: the basic picture',
        slides: [2, 3, 4, 5],
        html: `
<ol>
<li><b>Manufacturing</b> is a value-adding process: raw or semi-finished material of irregular shape, size and surface is turned into a functional product with specified geometry, dimensions, finish and properties.</li>
<li><b>Machining</b> is a material-removal process for semi-finishing and finishing: unwanted material is removed from a preformed workpiece <b>as chips</b> by a cutting tool. The relative motion between tool and work in a machine tool gives the required shape, size, accuracy and finish.</li>
<li>The tool is <b>harder</b> than the work and has geometric features chosen for the operation.</li>
<li>The tool exerts a <b>compressive force</b> on the work; the sheared material that flows along the tool face is the <b>chip</b>.</li>
<li>To remove a chip you must cut along <b>at least two surfaces</b> (the path of the tool and the shear surface that frees the chip). Cutting along one surface does not guarantee chip removal.</li>
</ol>`
      },
      {
        id: 'cut-ortho-oblique',
        title: 'Orthogonal vs oblique cutting',
        slides: [6, 7, 8, 9],
        html: `
<p>The tool is wedge-shaped with a straight cutting edge. Depending on how the edge is arranged relative to the relative work-tool motion there are two methods of cutting.</p>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Orthogonal (2-D)</th><th>Oblique (3-D)</th></tr></thead>
<tbody>
<tr><td>Cutting edge</td><td>At <b>90°</b> to the direction of feed (cutting velocity)</td><td>Inclined at an acute angle to the feed direction</td></tr>
<tr><td>Inclination angle λ</td><td>Zero (edge has no inclination with the normal to the feed)</td><td>λ ≠ 0, the edge is inclined at λ to the normal to the feed</td></tr>
<tr><td>Chip flow</td><td>Normal to the cutting edge, in the plane of the tool face; makes no angle with the normal to the edge</td><td>Not normal to the edge; at a <b>chip flow angle</b> to the normal to the edge</td></tr>
<tr><td>Shear force area</td><td>Smaller area, so shear force per unit area (stress) is <b>higher</b></td><td>Larger area, so shear stress per unit area is <b>smaller</b></td></tr>
<tr><td>Tool life</td><td>Shorter (same conditions)</td><td>Longer</td></tr>
<tr><td>Force components</td><td>Only <b>two</b> mutually perpendicular components (cutting force Pz and thrust force)</td><td><b>Three</b> mutually perpendicular components (Px, Py, Pz)</td></tr>
<tr><td>Use</td><td>Mostly in theory and in a few real cases (turning the end of a tube, parting-off, broaching, planing with φ = 90°)</td><td>Most real operations (turning with φ &lt; 90°, milling, drilling)</td></tr>
</tbody></table></div>
<p class="note">Beyond the slides: the chip flow deviates from the orthogonal plane mainly because of the <b>inclination angle λ</b> (chip flows roughly at an angle equal to λ), and also because of nose radius, the auxiliary edge and side flow caused by friction on the rake face.</p>`
      },
      {
        id: 'cut-tool-types',
        title: 'Cutting tool: single-point and multi-point, tool elements',
        slides: [10, 11, 12, 13],
        html: `
<p>A cutting tool is a device with which material is cut to size, shape or finish; it must have at least a sharp edge.</p>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Single-point tool</th><th>Multi-point tool</th></tr></thead>
<tbody>
<tr><td>Cutting edges</td><td>Only one</td><td>More than one</td></tr>
<tr><td>Examples</td><td>Shaper, lathe and planer tools</td><td>Drills, milling cutters, broaches, grinding wheel, honing tool</td></tr>
</tbody></table></div>
<p>A single-point tool is <b>right-hand</b> or <b>left-hand</b> depending on the direction of feed.</p>
<h4>Elements of the tool (slides 12–13)</h4>
<ul>
<li><b>Face / rake surface:</b> the surface along which the chips flow out.</li>
<li><b>Flank:</b> surfaces that face the workpiece (principal flank and auxiliary flank).</li>
<li><b>Principal (side) cutting edge:</b> does the major part of cutting; formed by the intersection of the face and the principal flank.</li>
<li><b>Auxiliary (end) cutting edge:</b> intersection of the rake surface and the auxiliary flank.</li>
<li><b>Corner:</b> meeting point of the principal and auxiliary edges; if rounded it is called the <b>nose</b>.</li>
</ul>`
      },
      {
        id: 'cut-angles',
        title: 'Tool nomenclature: the angles of a single-point tool',
        slides: [14, 15, 16, 17, 18, 19, 20],
        html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Angle</th><th>Symbol</th><th>Definition and purpose</th><th>Usual value</th></tr></thead>
<tbody>
<tr><td>Side cutting edge angle (SCEA, lead angle)</td><td>φs</td><td>Angle between the side cutting edge and the longitudinal direction of the tool. Rising from 0° to 15° lowers the power; too large causes vibration; 0° means the whole edge hits at once (shock).</td><td>0–90°; recommended 15–30°</td></tr>
<tr><td>End cutting edge angle (ECEA)</td><td>φe</td><td>Stops the end cutting edge rubbing on the machined surface (better finish).</td><td>5–30°; commonly 8–15°</td></tr>
<tr><td>Side relief (clearance) angle</td><td>αx</td><td>Stops rubbing between the work and the side flank.</td><td>5–15°</td></tr>
<tr><td>End relief (clearance) angle</td><td>αy</td><td>Stops rubbing between the work and the end flank.</td><td>5–15°</td></tr>
<tr><td>Side rake angle</td><td>γx</td><td>Together with back rake, decides the direction in which the chip flows onto the face. Can be positive, negative or zero.</td><td>0–15°</td></tr>
<tr><td>Back rake angle</td><td>γy</td><td>As above (measured in the other reference plane).</td><td>0–15°</td></tr>
<tr><td>Nose radius</td><td>r</td><td>Favours long tool life and good surface finish; finish and permissible cutting speed improve as r increases from zero.</td><td>small positive value</td></tr>
</tbody></table></div>
<h4>Effect of the rake angle (beyond the slides, exam standard)</h4>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Rake</th><th>Effect</th><th>Used for</th></tr></thead>
<tbody>
<tr><td>Positive</td><td>Lower cutting force and power, thinner and cooler chip, better finish; but the wedge is thin and weak</td><td>Soft, ductile materials; light finishing cuts with HSS</td></tr>
<tr><td>Zero</td><td>Strong edge, moderate force, simple to grind</td><td>Form tools, brass, free-cutting material</td></tr>
<tr><td>Negative</td><td>Very strong edge, but high force and power, higher heat; needs a rigid machine</td><td>Hard materials, interrupted cuts, carbide and ceramic inserts</td></tr>
</tbody></table></div>
<p class="muted small">Sketch to remember: top view (SCEA, ECEA measured from the shank axis/feed direction), front view (side rake and side relief) and side view (back rake and end relief), as in slides 18–20.</p>`
      },
      {
        id: 'cut-designation',
        title: 'Tool designation systems and reference planes',
        slides: [22, 23, 24, 25, 26, 27, 28, 29],
        html: `
<p><b>Designation</b> means specifying the shape of the cutting part of the tool. The systems in use are:</p>
<ol>
<li><b>Tool-in-hand system</b> (angles measured on the tool itself).</li>
<li><b>Machine reference system, ASA</b> (American Standard Association): reference planes and axes follow the configuration and axes of the <b>machine tool</b>.</li>
<li><b>Tool reference systems:</b> <b>ORS</b> (orthogonal rake system) and <b>NRS</b> (normal rake system): planes and axes follow the <b>cutting tool</b>.</li>
<li><b>Maximum rake system, MRS.</b></li>
<li><b>Work reference system, WRS.</b></li>
</ol>
<h4>Reference planes (slide 24)</h4>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Plane</th><th>Symbol</th><th>Definition</th></tr></thead>
<tbody>
<tr><td>Reference plane</td><td>πR</td><td>Perpendicular to the cutting velocity Vc</td></tr>
<tr><td>Machine longitudinal plane</td><td>πx</td><td>Perpendicular to πR, taken in the direction of (longitudinal) feed</td></tr>
<tr><td>Machine transverse plane</td><td>πy</td><td>Perpendicular to both πR and πx (direction of cross-feed)</td></tr>
<tr><td>Principal cutting plane</td><td>πc</td><td>Perpendicular to πR and containing the principal cutting edge</td></tr>
<tr><td>Orthogonal plane</td><td>πo</td><td>Perpendicular to both πR and πc</td></tr>
<tr><td>Normal plane</td><td>πn</td><td>Perpendicular to the principal cutting edge</td></tr>
</tbody></table></div>
<h4>ASA vs ORS</h4>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>ASA (machine reference)</th><th>ORS (tool reference)</th></tr></thead>
<tbody>
<tr><td>Planes taken from</td><td>Machine axes: πR, πx, πy</td><td>Tool: πR, πc, πo</td></tr>
<tr><td>Rake angles</td><td>Side rake γx, back rake γy</td><td>Inclination λ, orthogonal rake γo</td></tr>
<tr><td>Signature (beyond slides)</td><td>γy, γx, αy, αx, φe, φs, r</td><td>λ, γo, αo, α′o, φe, φ, r</td></tr>
</tbody></table></div>
<p class="note">Beyond the slides: the 7-number signature order above is the standard textbook one (Ghosh and Mallik). Principal cutting edge angle φ = 90° − φs. NRS gives (λ, γn, αn, α′n, φe, φ, r) in the plane πn; MRS gives the maximum rake γm and its orientation.</p>`
      },
      {
        id: 'cut-conversion',
        title: 'Converting rake angles ASA ⇄ ORS (master line method)',
        slides: [24, 27, 28, 29],
        html: `
<p>The master-line method treats the rake face as a plane. The <b>master line</b> is the line of the face lying in the reference plane (a level line of the face). The slope of the face in any direction is the component of the steepest slope along that direction. The steepest slope is the <b>maximum rake γm</b>, perpendicular to the master line.</p>
<ol class="steps">
<li>Let g be the gradient vector of the rake face (steepest descent). Its magnitude is tan γm. The slope in a direction with unit vector u is tan γ = g·u.</li>
<li>Take axes: x along the feed (plane πx), y across it (plane πy), both in πR. The principal cutting edge makes the angle φ with the x-axis. Then tan γx = gx and tan γy = gy.</li>
<li>The orthogonal direction (normal to the edge, plane πo) is u = (sin φ, cos φ). Hence <b>tan γo = tan γx sin φ + tan γy cos φ</b>.</li>
<li>The direction along the edge is e = (−cos φ, sin φ). The slope along the edge is the inclination angle: <b>tan λ = −tan γx cos φ + tan γy sin φ</b>.</li>
<li>(γo, λ) and (γx, γy) are components of the same vector g in two rotated axes, so the inverse relations are <b>tan γx = tan γo sin φ − tan λ cos φ</b> and <b>tan γy = tan γo cos φ + tan λ sin φ</b>.</li>
<li>Rotation keeps the length: <b>tan γm = √(tan²γo + tan²λ) = √(tan²γx + tan²γy)</b>. It is independent of φ.</li>
</ol>
<p class="muted small">In the same way cot α (slope of the flank relative to the horizontal) combines like tan γ: cot αm = √(cot²αo + tan²λ).</p>
<p class="note">Beyond the slides. Question hint: a 7-number signature in mm usually means ORS (λ, γo, …, φ, r); one in inch means ASA (γy, γx, …, φs, r). Always state which you assume.</p>`
      },
      {
        id: 'cut-chip-formation',
        title: 'Chip formation: notation, parallel-plate model, shear zones',
        slides: [33, 34, 35, 36, 37],
        html: `
<p>Every machining operation forms chips; their nature depends on the operation, the work-material properties and the cutting conditions. As the tool is forced into the material, the chip forms by <b>shear deformation</b>.</p>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Symbol</th><th>Meaning</th></tr></thead>
<tbody>
<tr><td>α</td><td>Clearance (relief) angle</td></tr>
<tr><td>γ</td><td>Rake angle</td></tr>
<tr><td>β</td><td>Shear angle (shear plane to cutting direction)</td></tr>
<tr><td>φ</td><td>Cutting (principal cutting edge) angle</td></tr>
<tr><td>a1</td><td>Uncut chip thickness; a1 = So sin φ</td></tr>
<tr><td>a2</td><td>Chip thickness (after cutting)</td></tr>
<tr><td>So</td><td>Feed (mm/rev)</td></tr>
<tr><td>b1, b2</td><td>Uncut chip width (b1 = t / sin φ) and chip width after cutting</td></tr>
</tbody></table></div>
<h4>Models</h4>
<ul>
<li><b>Parallel-plate model:</b> the chip is formed like a pack of parallel plates sliding relative to each other along the shear plane at angle β.</li>
<li><b>Actual chip formation:</b> shear takes place in a <b>zone</b>, not on a plane (primary shear zone). A <b>secondary shear</b> occurs in the chip after formation because of friction as the chip slides along the rake face. Material properties also influence how chips form.</li>
</ul>`
      },
      {
        id: 'cut-chip-types',
        title: 'Types of chips',
        slides: [38, 39, 40],
        html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Type</th><th>Description (slides)</th><th>Conditions / material</th><th>Effect</th></tr></thead>
<tbody>
<tr><td><b>Discontinuous</b></td><td>Small segments loosely adhering; deformation limited by repeated fracture</td><td>Hard, brittle materials: bronze, brass, cast iron. (Also low speed, large feed and depth, small or negative rake.)</td><td>Good finish on brittle work, easy chip handling; forces fluctuate</td></tr>
<tr><td><b>Continuous (ribbon)</b></td><td>Long coils; plastic deformation without fracture ahead of the edge; smooth flow up the face. Inside shows steps from intermittent slip, outside very smooth</td><td>Ductile material, high speed, small feed, large positive rake, sharp tool, good fluid</td><td>Best finish and steady forces; long chips are hard to handle and may tangle</td></tr>
<tr><td><b>Continuous with BUE</b></td><td>Like continuous but not smooth</td><td>Ductile metals at low-medium speed with high friction</td><td>Poor surface finish, but the BUE protects the edge from wear (tool life can rise)</td></tr>
<tr><td><b>Serrated (segmented)</b></td><td>Semi-continuous, saw-tooth appearance from cyclic high-then-low shear strain</td><td>Titanium alloys, nickel superalloys, austenitic stainless steels at higher speed; steels at very high speed</td><td>Cyclic force, vibration, wear</td></tr>
</tbody></table></div>
<h4>Built-up edge (BUE) stages (beyond the slides)</h4>
<ol>
<li>High pressure and temperature at the tool tip make a layer of work material weld to the tool face.</li>
<li>Further strain-hardened layers build up on it, forming a hard wedge that acts as the cutting edge.</li>
<li>The BUE grows until it is unstable, then a fragment breaks off and is carried away by the chip or stuck on the machined surface.</li>
<li>The cycle repeats. BUE is undesirable: poor finish, dimensional variation, it modifies the effective tool geometry and fragments tear away tool material. Higher speed, positive rake and cutting fluid reduce it.</li>
</ol>`
      },
      {
        id: 'cut-xi-shear',
        title: 'Chip reduction coefficient and the shear angle',
        slides: [41, 42],
        html: `
<p><b>Chip reduction coefficient</b> (chip thickness ratio) <b>ξ = a2 / a1</b> is the ratio of chip thickness to uncut chip thickness. It indexes the degree of deformation: the chip becomes thicker and <b>shorter</b>. In the USA the inverse, 1/ξ = rc, is the <b>cutting ratio</b>. ξ is greater than 1 because the chip is compressed and sheared, and by volume constancy (b2 ≈ b1) the chip is shorter: ξ = l1 / l2.</p>
<h4>Derivation of ξ and the shear angle β (orthogonal cutting)</h4>
<ol class="steps">
<li>Draw the tool with rake γ, the shear plane AB inclined at β to the cutting direction, the uncut thickness a1 and chip thickness a2.</li>
<li>Perpendicular distance from the tool tip to the work surface: a1 = AB · sin β.</li>
<li>The chip thickness is measured normal to the chip flow along the rake face. The shear plane makes the angle (β − γ) with the rake face direction, so a2 = AB · cos(β − γ).</li>
<li>ξ = a2 / a1 = cos(β − γ) / sin β.  …[1]</li>
<li>Expand: ξ = (cos β cos γ + sin β sin γ) / sin β = cos γ cot β + sin γ.</li>
<li>Therefore <b>tan β = cos γ / (ξ − sin γ)</b>.  …[2]</li>
</ol>
<p>Reading the result: a larger rake γ gives a larger β and a smaller ξ (thinner chip, less deformation); a larger measured chip thickness a2 (large ξ) means a smaller shear angle, i.e. more deformation and higher force.</p>`
      },
      {
        id: 'cut-velocity',
        title: 'Velocity relationships',
        slides: [43, 44],
        html: `
<p>Three velocities: <b>Vc</b> cutting velocity (tool relative to work), <b>Vf</b> chip flow velocity (chip relative to tool) and <b>Vs</b> shear velocity (chip relative to work, along the shear plane).</p>
<ol class="steps">
<li>The velocities form a closed triangle: Vf = Vc + Vs (vectors).</li>
<li>The interior angles are β (opposite Vf), 90° − (β − γ) (opposite Vc) and 90° − γ (opposite Vs).</li>
<li>Sine rule: Vc / cos(β − γ) = Vs / cos γ = Vf / sin β.</li>
<li><b>Vf = Vc sin β / cos(β − γ) = Vc / ξ</b>, using [1]. (Check by volume flow: Vc a1 b1 = Vf a2 b2 with b2 ≈ b1.)</li>
<li><b>Vs = Vc cos γ / cos(β − γ)</b>.  …[3]</li>
</ol>`
      },
      {
        id: 'cut-kronenberg',
        title: 'Kronenberg: ξ from rake and friction',
        slides: [45],
        html: `
<p>Kronenberg gave the dependence of the chip reduction coefficient on the rake angle and the coefficient of friction μ at the chip-tool interface:</p>
<p class="formula">ξ = e<sup>μ(π/2 − γ)</sup> …[4]</p>
<ul>
<li>ξ increases with μ and decreases when γ increases. Since μ &gt; 0 and γ &lt; π/2 the exponent is positive, so ξ &gt; 1.</li>
<li>Used to estimate ξ (and then β from [2]) when only γ and μ are known.</li>
</ul>
<p class="note">Beyond the slides. Textbook argument: the chip is turned through the angle (π/2 − γ) as it bends up the rake face, much like a flexible band wrapped round a pulley; with friction the capstan (belt) relation e<sup>μθ</sup>, θ = π/2 − γ, controls the compression of the chip. The expression is empirical (Kronenberg), not an exact result.</p>`
      },
      {
        id: 'cut-forces',
        title: 'Cutting forces: purpose and components',
        slides: [48, 49, 50, 51],
        html: `
<p>Machining needs mechanical energy to separate chips by shear, so forces act on both tool and work. Cutting forces must be known:</p>
<ul>
<li>to estimate the <b>power</b> requirement of the machine tool;</li>
<li>to estimate the straining actions that must be resisted by machine components, bearings, jigs and fixtures;</li>
<li>to evaluate the role of various parameters on the forces;</li>
<li>to evaluate new work materials, tool materials, environments and techniques for <b>machinability</b>.</li>
</ul>
<h4>Force components in turning</h4>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Force</th><th>Direction</th><th>Name</th></tr></thead>
<tbody>
<tr><td><b>Pz</b></td><td>Along the cutting velocity</td><td>Cutting (main, tangential) force</td></tr>
<tr><td><b>Px</b></td><td>Along the tool travel (feed)</td><td>Feed (axial) force</td></tr>
<tr><td><b>Py</b></td><td>Perpendicular to the produced surface</td><td>Thrust (radial) force</td></tr>
</tbody></table></div>
<p>Px and Py lie in the horizontal plane; their resultant is <b>Pxy</b> (normal to the principal cutting edge), with <b>Px = Pxy sin φ</b> …[1] and <b>Py = Pxy cos φ</b> …[2]. Hence Pxy = √(Px² + Py²), and the total resultant is R = √(Pz² + Pxy²).</p>
<h4>Forces on the orthogonal model</h4>
<ul>
<li><b>F</b> = friction force along the rake surface, <b>N</b> = normal force perpendicular to the rake surface;</li>
<li><b>Ps</b> = shear force along the shear plane, <b>Pn</b> = force normal to the shear plane.</li>
</ul>`
      },
      {
        id: 'cut-mcd',
        title: "Merchant's circle diagram (MCD) and shear stress",
        slides: [52, 53, 54],
        html: `
<p>In the MCD the resultant R of Pz and Pxy is the diameter of a circle; the same R is also the resultant of F and N and of Ps and Pn. Notation: <b>μ</b> = kinetic coefficient of friction, <b>η</b> = mean angle of friction at the rake surface, μ = tan η.</p>
<p class="muted small">Sketch: draw a horizontal line for Pz (cutting direction) and a vertical line for Pxy; draw R as the diagonal and a circle with R as diameter through the tool tip; draw the rake face at γ from the vertical; F along the face, N perpendicular to it; draw the shear plane at β from the horizontal, with Ps along it and Pn perpendicular. All four pairs have their tips on the circle.</p>
<ol class="steps">
<li>Resolve Pz and Pxy along and across the rake face: <b>F = Pz sin γ + Pxy cos γ</b> …[3], <b>N = Pz cos γ − Pxy sin γ</b> …[4].</li>
<li>Resolve along and across the shear plane: <b>Ps = Pz cos β − Pxy sin β</b> …[5], <b>Pn = Pz sin β + Pxy cos β</b> …[6].</li>
<li>Friction: <b>μ = tan η = F / N = (Pxy + Pz tan γ) / (Pz − Pxy tan γ)</b> …[7] (from [3] and [4]).</li>
<li>In terms of the resultant: F = R sin η, N = R cos η, Pz = R cos(η − γ), Pxy = R sin(η − γ), Ps = R cos(β + η − γ), Pn = R sin(β + η − γ) …[8]–[10].</li>
<li>From [8]–[10]: Ps = Pz cos(β + η − γ) / cos(η − γ) (i.e. Pz = Ps cos(η − γ) / cos(β + η − γ)) …[11].</li>
<li>Shear plane area: As = a1 b1 / sin β = So t / sin β for turning (a1 = So sin φ, b1 = t / sin φ). Shear stress on the plane: <b>τs = Ps / As</b> …[12].</li>
<li>Combine [11] and [12]: <b>Pz = τs So t cos(η − γ) / (sin β cos(β + η − γ)) = τs So t [cot β + tan(β + η − γ)]</b> …[13], and similarly <b>Pxy = τs So t sin(η − γ) / (sin β cos(β + η − γ))</b> …[14].</li>
</ol>`
      },
      {
        id: 'cut-merchant',
        title: "Merchant's shear-angle relation and Pz = 2 τs So t cot β",
        slides: [52, 53, 54],
        html: `
<p class="note">Beyond the slides, but asked repeatedly (Earnest and Merchant theory).</p>
<h4>Assumptions (relevant machining condition and material)</h4>
<ul>
<li>Orthogonal cutting of a ductile metal giving a continuous chip without BUE; a sharp tool with no rubbing on the flank.</li>
<li>Shear occurs on a single thin plane at β with a constant shear stress τs; the chip is in equilibrium under R; friction coefficient is constant; plane strain (chip width unchanged).</li>
<li>The shear angle takes the value that needs the <b>least cutting force (minimum energy)</b>.</li>
</ul>
<ol class="steps">
<li>Start from [13]: Pz = τs So t cos(η − γ) / (sin β cos(β + η − γ)). For given τs, So, t, η, γ the force depends only on β.</li>
<li>Pz is minimum when the product sin β cos(β + η − γ) is maximum: d/dβ [sin β cos(β + η − γ)] = cos β cos(β + η − γ) − sin β sin(β + η − γ) = cos(2β + η − γ) = 0.</li>
<li>Therefore <b>2β + η − γ = π/2</b>, i.e. β = π/4 + γ/2 − η/2 (Merchant).</li>
<li>With β + η − γ = π/2 − β: cos(β + η − γ) = sin β, and cos(η − γ) = cos(π/2 − 2β) = sin 2β = 2 sin β cos β.</li>
<li>Substitute: Pz = τs So t · 2 sin β cos β / (sin β · sin β) = <b>2 τs So t cot β</b>.</li>
</ol>
<p>Interpretation: higher rake γ or lower friction η raises β (thin chip, lower force).</p>`
      },
      {
        id: 'cut-power',
        title: 'Cutting power',
        slides: [48],
        html: `
<ul>
<li>Power at the tool: <b>Pc = Pz · Vc</b> (Vc in m/s gives W; with Vc in m/min, Pc = Pz Vc / 60 W). The feed force does negligible work because feed velocity is small.</li>
<li>Vc = π D N / 1000 (m/min), D in mm, N in rpm.</li>
<li>Machine power = Pc / efficiency. Alternatively P = K · MRR with K the specific cutting energy (N/mm²).</li>
<li>Specific energy of shear: u = Ps · Vs / (MRR).</li>
</ul>
<p class="muted small">Typical exam steps: (1) V from D and N; (2) Pxy from Px or Py; (3) F, N, μ; (4) β from ξ (or from a2); (5) Ps, As, τs; (6) power.</p>`
      },
      {
        id: 'cut-failure',
        title: 'Tool failure, crater and flank wear, effects',
        slides: [57, 58, 59, 60, 61, 62, 63],
        html: `
<p>High forces and temperatures make machining a harsh environment: excess force fractures the tool, excess temperature softens it, and otherwise gradual wear ends its life. Wear hurts tool life, surface quality, accuracy and economics.</p>
<h4>Three modes of tool failure</h4>
<ol>
<li><b>Fracture failure:</b> cutting force at the tool point is excessive and the tool fails suddenly by brittle fracture.</li>
<li><b>Temperature failure:</b> cutting temperature too high; the tool point softens, deforms plastically and loses its sharp edge.</li>
<li><b>Gradual wear:</b> wear of the edge causes loss of tool shape and cutting efficiency; wear accelerates and finally failure is like temperature failure.</li>
</ol>
<p>Wear rate depends on tool and work materials, tool geometry, process parameters, cutting fluids and the machine tool. It is gradual and occurs at two places:</p>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Crater wear</th><th>Flank wear</th></tr></thead>
<tbody>
<tr><td>Location</td><td>Rake (top) face</td><td>Flank (relief) face next to the cutting edge</td></tr>
<tr><td>Shape</td><td>Cavity (crater) that forms and grows</td><td>Flat wear land (width VB)</td></tr>
<tr><td>Cause</td><td>Chip sliding against the rake face</td><td>Rubbing between the newly generated work surface and the flank</td></tr>
<tr><td>Main mechanisms</td><td>Diffusion (principal), abrasion, adhesion</td><td>Abrasion (significant), plastic deformation</td></tr>
<tr><td>Harmful because</td><td>Weakens the edge, changes effective rake</td><td>Loses dimensional accuracy, raises force, roughens surface</td></tr>
</tbody></table></div>
<h4>Effects of tool wear</h4>
<ul>
<li>Increased cutting force.</li>
<li>Reduced dimensional accuracy.</li>
<li>Higher surface roughness.</li>
<li>Vibration.</li>
<li>The workpiece or tool may be damaged or finally break.</li>
</ul>
<p class="note">Beyond the slides: tool life is usually judged by a flank-wear limit (e.g. VB = 0.3 mm for uniform wear, ISO); other criteria are surface finish, force rise or a chip/sparks sign. Signs that a tool has failed: poor finish, size error, rising force and power, vibration or noise, and sparks/smoke.</p>`
      },
      {
        id: 'cut-wear-mech',
        title: 'Mechanisms of tool wear',
        slides: [64, 65],
        html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Mechanism</th><th>What happens</th><th>Where it is important</th></tr></thead>
<tbody>
<tr><td><b>Abrasion</b></td><td>Mechanical wearing by hard particles of the work gouging small portions off the tool</td><td>Both flank and crater wear; significant cause of flank wear</td></tr>
<tr><td><b>Adhesion</b></td><td>Under high pressure and temperature the metals weld; as the chip flows, small tool particles tear away (attrition)</td><td>Tool-chip interface, BUE regions</td></tr>
<tr><td><b>Diffusion</b></td><td>Exchange of atoms across the close contact boundary of two materials</td><td>Principal mechanism of <b>crater wear</b></td></tr>
<tr><td><b>Chemical reaction</b></td><td>High temperature and clean surfaces cause oxidation of the rake face; the softer oxide is sheared away, exposing new tool material</td><td>High-speed cutting</td></tr>
<tr><td><b>Plastic deformation</b></td><td>Cutting force at high temperature deforms the edge plastically, making it vulnerable to abrasion</td><td>Mainly <b>flank wear</b></td></tr>
</tbody></table></div>
<p>Most mechanisms are accelerated at higher cutting speed and temperature; diffusion and chemical reaction are especially temperature-sensitive.</p>`
      },
      {
        id: 'cut-tool-materials',
        title: 'Cutting tool materials and inserts',
        slides: [66, 67, 68, 69, 70],
        html: `
<h4>Properties wanted in a tool material</h4>
<ul>
<li>Harder than the work, even at the <b>elevated operating temperature</b> (hot hardness).</li>
<li>Resists wear even though the relative hardness changes.</li>
<li>Low friction coefficient at the chip-tool interface (low wear, good finish).</li>
<li>Tough enough for interrupted cuts (otherwise reinforce it).</li>
<li>High thermal conductivity, low thermal expansion, no distortion in heat treatment, easy to regrind and weld to the holder.</li>
</ul>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Material</th><th>Key features</th><th>Uses</th><th>n (Taylor)</th></tr></thead>
<tbody>
<tr><td>Carbon tool steel</td><td>Medium alloy steel, inexpensive; poor properties above 200 °C</td><td>Taps, core drills for soft materials, woodworking tools</td><td>-</td></tr>
<tr><td>High-speed steel (HSS)</td><td>High hot hardness (to about 600 °C), high wear resistance, good hardenability</td><td>Drills, reamers, broaches, milling cutters, taps, lathe tools, gear hobs</td><td>0.08–0.2</td></tr>
<tr><td>Cast alloys</td><td>Between HSS and carbide (beyond slides: cobalt-chromium-tungsten)</td><td>Heavy roughing</td><td>0.1–0.15</td></tr>
<tr><td>Carbides</td><td>Compacted binary compounds of carbon and heavy metals, made by powder metallurgy, usually as inserts</td><td>General high-speed machining</td><td>0.2–0.5</td></tr>
<tr><td>Ceramics</td><td>High abrasion resistance and hot hardness; not good for interrupted cutting; need dry or constant profuse fluid</td><td>High-speed finishing of hard work</td><td>0.5–0.7</td></tr>
</tbody></table></div>
<h4>Inserts (slides 68–70)</h4>
<ul>
<li>Solid tools need regrinding several times a day, with downtime and re-setting. Inserts give an <b>identical new precision edge</b> and eliminate regrinding and cut tool-change and resetting time.</li>
<li>Shapes: square, round, triangular, rhombus, etc. Edge strength depends on the corner angle and shape; the smaller the included angle the weaker the edge.</li>
<li>Clamped on a medium-carbon-steel shank (preferred; each insert has several edges and is <b>indexed</b> when one wears out) or brazed.</li>
<li>Advantages: no regrinding time, less downtime, high metal removal rate, no grinding-wheel cost, throw-away inserts cheaper than brazed tips, high production rate.</li>
</ul>`
      },
      {
        id: 'cut-tool-life',
        title: 'Tool life, wear curve and Taylor equation',
        slides: [71, 72, 73, 74, 75],
        html: `
<p><b>Tool life</b> is the cutting time required for complete failure of the tool, or the time to produce a given amount of flank wear. Variables that affect it: cutting speed Vc, feed So, depth of cut t, work hardness, tool material, shape and angles of tool, type of cutting fluid and its method of application.</p>
<h4>Wear curve (flank wear vs cutting time)</h4>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Region</th><th>Behaviour</th></tr></thead>
<tbody>
<tr><td>1. Break-in (initial) period</td><td>The sharp edge wears rapidly in the first few minutes</td></tr>
<tr><td>2. Steady-state region</td><td>Fairly uniform (almost linear) wear rate</td></tr>
<tr><td>3. Failure region</td><td>Wear rate accelerates, temperature rises, efficiency falls; ends in temperature failure</td></tr>
</tbody></table></div>
<p class="muted small">Sketch: wear (VB) on the vertical axis, cutting time on the horizontal; a steep rise, a long straight line, then a steep upturn; mark the tool-life criterion line.</p>
<h4>Taylor's tool-life equation (1907)</h4>
<p class="formula">Vc · T<sup>n</sup> = C</p>
<p>T = tool life, n = tool life index (depends on tool, work and environment), C = constant = cutting speed for T = 1 min.</p>
<ol class="steps">
<li>Run tests at several speeds and record the tool life T at the same wear criterion.</li>
<li>Plot on log-log paper; the points lie on a straight line: log Vc = log C − n log T.</li>
<li>The slope is −n, so n = −(Δ log Vc) / (Δ log T); the intercept at T = 1 min (log T = 0) gives log C.</li>
<li>Two points: V1 T1<sup>n</sup> = V2 T2<sup>n</sup> so n = log(V1/V2) / log(T2/T1).</li>
</ol>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Tool material</th><th>Range of n</th></tr></thead>
<tbody>
<tr><td>High-speed steel</td><td>0.08 – 0.2</td></tr>
<tr><td>Cast alloys</td><td>0.1 – 0.15</td></tr>
<tr><td>Carbides</td><td>0.2 – 0.5</td></tr>
<tr><td>Ceramics</td><td>0.5 – 0.7</td></tr>
</tbody></table></div>
<p class="note">Beyond the slides: extended Taylor V T^n So^m t^p = C. Machinability rating = (speed for 60-min life of the test material / same speed for the reference material) × 100.</p>`
      },
      {
        id: 'cut-fluids',
        title: 'Cutting fluids: need, properties, types',
        slides: [76, 77, 78, 79, 80],
        html: `
<p>Machining generates heat and high temperature, rising with cutting speed, feed and depth, and with work strength and hardness. A tool that is not hot-hard enough loses form or wears quickly: higher cutting force, dimensional inaccuracy, short life. High-production machining is limited by temperature, so a cutting fluid is essential. It improves tool life, reduces work thermal deformation, improves finish and flushes chips away.</p>
<h4>Properties of a good cutting fluid</h4>
<ul>
<li>Good rust resistance and stability (long life).</li>
<li>Good cooling capacity and lubricating quality.</li>
<li>Resistant to rancidity and foaming; non-toxic.</li>
<li>Transparent (operator sees the work); relatively low viscosity so chips and dirt settle; non-flammable.</li>
<li>Can be disposed of in an environmentally responsible way.</li>
<li>Should not smoke excessively, form gummy deposits that make slides sticky, or clog the circulation system.</li>
</ul>
<h4>Four types</h4>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Type</th><th>Composition</th><th>Properties</th></tr></thead>
<tbody>
<tr><td><b>Straight oils</b></td><td>Non-emulsifiable, used undiluted. Mineral/petroleum oil base, often with polar lubricants (fats, vegetable oils, esters) and extreme-pressure additives (Cl, S, P)</td><td><b>Best lubrication, poorest cooling</b></td></tr>
<tr><td><b>Soluble oils</b></td><td>Mineral oil with emulsifiers; forms an emulsion with water; used diluted (3–10 %)</td><td>Good lubrication and heat transfer; widely used; <b>cheapest</b></td></tr>
<tr><td><b>Semi-synthetic</b></td><td>Combination of synthetic and soluble oil fluids</td><td>Properties, cost and cooling between soluble and synthetic</td></tr>
<tr><td><b>Synthetic</b></td><td>No petroleum or mineral oil; alkaline inorganic and organic compounds with corrosion inhibitors; diluted 3–10 %</td><td>Often the <b>best cooling</b> performance</td></tr>
</tbody></table></div>
<p class="note">Beyond the slides. Functions: cool the tool, work and chip; lubricate the chip-tool and tool-work contacts (lower friction and BUE); flush chips; protect work and machine from corrosion; improve finish and tool life. Methods of application: flood (most common, on the tool and chip from above), jet/mist spray, drip, hand brushing, high-pressure through the tool or from below the chip near the flank, and applying on the work before the cut.</p>`
      },
      {
        id: 'cut-economics',
        title: 'Machining economics: optimum cutting speed',
        slides: [74],
        html: `
<p class="note">Beyond the slides. Standard textbook result, asked in the question bank.</p>
<p><b>Cost components per piece:</b> (1) non-productive (loading, unloading, handling) cost Co Th, (2) machining cost Co Tm, (3) tool-change cost Co Tt Tm / T, (4) tool cost Ct Tm / T, with Co = operating cost rate, Th = handling time, Tm = machining time, Tt = tool change time, Ct = cost per cutting edge, T = tool life.</p>
<ol class="steps">
<li>Cost per piece: Cc = Co Th + Co Tm + (Co Tt + Ct) Tm / T.</li>
<li>For turning, Tm = πDL / (f·V) = K / V and Taylor gives T = (C / V)<sup>1/n</sup>, so Cc = Co Th + Co K / V + (Co Tt + Ct) K V<sup>(1/n − 1)</sup> / C<sup>1/n</sup>.</li>
<li>Set dCc/dV = 0: −Co K / V² + (Co Tt + Ct) K (1/n − 1) V<sup>(1/n − 2)</sup> / C<sup>1/n</sup> = 0.</li>
<li><b>V_opt = C [ (n / (1 − n)) · Co / (Co Tt + Ct) ]<sup>n</sup></b>, with <b>T_opt = ((1 − n) / n)(Tt + Ct / Co)</b>.</li>
<li>For maximum production rate set Ct = 0 and ignore cost: V_max = C [ n / ((1 − n) Tt) ]<sup>n</sup>; speed for max rate is higher than for minimum cost.</li>
</ol>
<p>Effect of n: a small n (HSS) means life falls steeply with speed, so the optimum speed is much lower than C and the tool life at optimum is long; a large n (ceramic) allows speeds near C.</p>`
      }
    ],
    formulas: [
      { name: 'Shear angle from ξ', expr: 'tan β = cos γ / (ξ − sin γ)', vars: 'γ = rake, ξ = chip reduction coefficient', slide: 42 },
      { name: 'Chip reduction coefficient', expr: 'ξ = a2/a1 = cos(β − γ) / sin β', vars: 'a1 = So sin φ (uncut thickness), a2 = chip thickness', slide: 41 },
      { name: 'Uncut thickness and width', expr: 'a1 = So sin φ ; b1 = t / sin φ ; a1 b1 = So t', vars: 'So = feed (mm/rev), t = depth of cut, φ = principal cutting edge angle', slide: 34 },
      { name: 'Chip velocity', expr: 'Vf = Vc / ξ = Vc sin β / cos(β − γ)', vars: 'Vc = cutting velocity', slide: 44 },
      { name: 'Shear velocity', expr: 'Vs = Vc cos γ / cos(β − γ)', vars: 'Relative to the work, along the shear plane', slide: 44 },
      { name: 'Kronenberg', expr: 'ξ = e^{μ(π/2 − γ)}', vars: 'μ = coefficient of friction, γ in radians', slide: 45 },
      { name: 'Resultant of Px and Py', expr: 'Px = Pxy sin φ ; Py = Pxy cos φ', vars: 'Pxy = √(Px² + Py²)', slide: 50 },
      { name: 'Friction and normal force', expr: 'F = Pz sin γ + Pxy cos γ ; N = Pz cos γ − Pxy sin γ', vars: 'On the rake face', slide: 52 },
      { name: 'Shear and normal-to-shear force', expr: 'Ps = Pz cos β − Pxy sin β ; Pn = Pz sin β + Pxy cos β', vars: 'On the shear plane', slide: 52 },
      { name: 'Coefficient of friction', expr: 'μ = tan η = F/N = (Pxy + Pz tan γ) / (Pz − Pxy tan γ)', vars: 'η = friction angle', slide: 52 },
      { name: 'Shear stress', expr: 'τs = Ps / As ; As = a1 b1 / sin β = So t / sin β', vars: 'As = shear plane area', slide: 53 },
      { name: 'Pz from τs', expr: 'Pz = τs So t cos(η − γ) / (sin β cos(β + η − γ)) = τs So t [cot β + tan(β + η − γ)]', vars: 'From the MCD and [12]', slide: 54 },
      { name: "Merchant's shear-angle relation", expr: '2β + η − γ = π/2', vars: 'Minimum-energy shear angle', slide: 54 },
      { name: 'Minimum Pz', expr: 'Pz = 2 τs So t cot β', vars: 'When 2β + η − γ = π/2', slide: 54 },
      { name: 'Cutting power', expr: 'Pc = Pz · Vc / 60 (W, Vc in m/min)', vars: 'Vc = πDN/1000', slide: 48 },
      { name: 'ASA to ORS rake', expr: 'tan γo = tan γx sin φ + tan γy cos φ ; tan λ = −tan γx cos φ + tan γy sin φ', vars: 'φ = principal cutting edge angle', slide: 24 },
      { name: 'ORS to ASA rake', expr: 'tan γx = tan γo sin φ − tan λ cos φ ; tan γy = tan γo cos φ + tan λ sin φ', vars: '', slide: 24 },
      { name: 'Maximum rake', expr: 'tan γm = √(tan²γo + tan²λ) = √(tan²γx + tan²γy)', vars: 'Independent of φ', slide: 24 },
      { name: "Taylor's tool life", expr: 'Vc · T^n = C', vars: 'n = 0.08–0.2 HSS, 0.2–0.5 carbide, 0.5–0.7 ceramic', slide: 74 },
      { name: 'n from two tests', expr: 'n = log(V1/V2) / log(T2/T1)', vars: 'Slope of the log-log line is −n', slide: 75 },
      { name: 'Optimum speed for minimum cost', expr: 'V_opt = C [ n Co / ((1 − n)(Co Tt + Ct)) ]^n', vars: 'Co = operating cost rate, Tt = tool change time, Ct = tool cost per edge', slide: 74 }
    ],
    keyTerms: [
      ['Orthogonal cutting', 'Edge at 90° to the feed, chip flows normal to the edge, 2-D, two force components.'],
      ['Oblique cutting', 'Edge inclined by λ, chip flows at an angle to the normal to the edge, 3-D, three force components.'],
      ['Single-point tool', 'One cutting edge: lathe, shaper, planer tools.'],
      ['Multi-point tool', 'More than one edge: drills, milling cutters, broaches, grinding wheels, honing tool.'],
      ['Face / rake surface', 'Tool surface along which the chip flows.'],
      ['Flank', 'Tool surface facing the workpiece.'],
      ['SCEA φs / ECEA φe', 'Side and end cutting edge angles; recommended 15–30° and 8–15°.'],
      ['Rake angle γ', 'Controls the direction of chip flow; may be positive, negative or zero (0–15° usual).'],
      ['Relief angle α', 'Prevents the flank rubbing the work (5–15°).'],
      ['πR, πx, πy, πc, πo, πn', 'Reference, machine longitudinal, machine transverse, principal cutting, orthogonal and normal planes.'],
      ['ASA / ORS / NRS / MRS / WRS', 'Machine, orthogonal, normal, maximum rake and work reference systems of tool designation.'],
      ['Master line', 'Line of the rake face in the reference plane; steepest slope is perpendicular to it.'],
      ['Shear angle β', 'Angle of the shear plane to the cutting direction; tan β = cos γ/(ξ − sin γ).'],
      ['Chip reduction coefficient ξ', 'a2/a1 > 1; inverse is the cutting ratio rc.'],
      ['Primary / secondary shear zone', 'Shear zone ahead of the tool; secondary shear in the chip due to friction on the rake face.'],
      ['Built-up edge (BUE)', 'Work material welded to the tool tip; poor finish, but protects the edge.'],
      ['Serrated chip', 'Saw-tooth chip from cyclic shear; titanium, nickel alloys, stainless steel at high speed.'],
      ['Pz, Px, Py, Pxy', 'Cutting, feed and thrust forces; Pxy = resultant of Px and Py.'],
      ['F, N, Ps, Pn', 'Friction, normal, shear and normal-to-shear forces of the MCD.'],
      ['μ = tan η', 'Coefficient of friction and mean friction angle on the rake face.'],
      ['τs', 'Shear stress on the shear plane = Ps / As (dynamic yield shear strength).'],
      ['Crater wear / flank wear', 'Cavity on the rake face / wear land on the flank.'],
      ['Abrasion, adhesion, diffusion', 'Mechanical gouging, welding and attrition, atomic exchange; diffusion is the principal cause of crater wear.'],
      ['Tool life T', 'Cutting time to complete failure or to a given flank wear.'],
      ['Taylor equation', 'Vc T^n = C; n is the tool life index; C is the speed for 1 min life.'],
      ['Straight oil vs soluble oil', 'Undiluted oil: best lubrication, poorest cooling vs emulsion in water (3–10 %): good lubrication and cooling, cheapest.']
    ]
  },

  /* ===================================================================== FINISHING PROCESSES */
  {
    id: 'finishing',
    title: 'Finishing processes',
    slides: 'Naimul Sir · Lec 5',
    lead: `<b>Finishing</b> is done after primary machining to improve surface quality, dimensional accuracy, appearance or function. <b>Precision finishing</b> (grinding, lapping, honing, super-finishing) removes a small controlled amount of material to achieve close tolerances, geometric accuracy and fine surface. <b>Non-precision finishing</b> (polishing, buffing, power brushing, tumbling) mainly improves appearance and removes burrs and minor irregularities, with little emphasis on dimensional accuracy.`,
    sections: [
      {
        id: 'fin-intro',
        title: 'Finishing: precision vs non-precision',
        slides: [84, 85],
        html: `
<ol>
<li><b>Finishing:</b> an operation after the primary machining process to improve surface quality, dimensional accuracy, appearance or functional characteristics.</li>
<li><b>Precision finishing:</b> controlled removal of a small amount of material to reach high dimensional and geometric accuracy, close tolerance and high surface finish.</li>
<li><b>Non-precision finishing:</b> to improve appearance, remove burrs and minor irregularities or clean the work, without emphasis on dimensional or geometric accuracy.</li>
</ol>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Precision</th><th>Non-precision</th></tr></thead>
<tbody>
<tr><td>Processes</td><td>Grinding, lapping, honing, super-finishing</td><td>Polishing, buffing, power brushing, tumbling</td></tr>
<tr><td>Aim</td><td>Size, geometry (roundness, flatness) and surface finish</td><td>Appearance, deburring, cleaning, smoothness</td></tr>
<tr><td>Accuracy</td><td>Important; close tolerance</td><td>Not important</td></tr>
<tr><td>Material removal</td><td>Small and controlled</td><td>Small to appreciable, uncontrolled (polishing removes defects)</td></tr>
<tr><td>Tool / medium</td><td>Bonded or loose abrasive on a controlled tool or machine</td><td>Abrasive-coated wheels, cloth wheels, brushes, loose media in a barrel</td></tr>
</tbody></table></div>`
      },
      {
        id: 'fin-lapping',
        title: 'Lapping',
        slides: [87, 88],
        html: `
<ul>
<li>A finishing process, mostly for <b>outside (and flat) surfaces</b>.</li>
<li><b>Lap material:</b> cloth, cast iron or copper, softer than the workpiece.</li>
<li>Abrasives are carried between lap and work in a vehicle (grease, oil or water); grit from 120 to the finest powder; the abrasive is <b>charged (embedded) into the lap</b>.</li>
<li>As the lap is rotated over the surface the abrasive removes a very small amount, less than 0.025 mm.</li>
</ul>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Advantages</th><th>Disadvantages</th><th>Applications</th></tr></thead>
<tbody>
<tr><td>Removes scratches left by grinding; any hardness can be lapped; by hand or machine</td><td>Hard to lap soft material (abrasive embeds in the work); slow metal removal</td><td>Gauge blocks; liquid-tight seals at high pressure</td></tr>
</tbody></table></div>`
      },
      {
        id: 'fin-honing',
        title: 'Honing',
        slides: [89],
        html: `
<ul>
<li>An abrading operation mostly for finishing <b>round holes</b>.</li>
<li><b>Honing stones</b> are made from common abrasives and bond; <b>sulfur, resin or wax</b> are often added to the bond to modify the cutting action. Grain size 80–600 grit.</li>
<li>Stones are spaced equally round the periphery of the tool and <b>expanded</b> by a cone or wedge inside the holder, actuated from the machine control.</li>
<li>The tool is <b>rotated and reciprocated at the same time</b> (gives the cross-hatch pattern).</li>
<li>Applications: automobile engine cylinders, gear bores, gun barrels, ring gauges.</li>
</ul>
<p class="note">Beyond the slides: honing corrects roundness, straightness and taper of a bored or ground hole with stock removal of a few hundredths of a mm; coolant (honing oil) flushes the swarf. Sulfur, resin or wax in the bond fill the pores, act as lubricant and reduce heat and loading, so the cut is smoother and the finish finer.</p>
<p class="muted small">Sketch: a hole with a honing head carrying 4–6 stones, a cone/wedge to expand them, rotation arrow and reciprocation arrow.</p>`
      },
      {
        id: 'fin-superfinish',
        title: 'Super-finishing',
        slides: [90],
        html: `
<p>A variation of honing that uses:</p>
<ol>
<li><b>Very light controlled pressure</b>, 0.07–0.28 MPa.</li>
<li><b>Rapid short strokes</b>: over 400 strokes/min, stroke length under 6.35 mm.</li>
<li>Stroke path controlled so that a <b>single grit never travels the same path twice</b>.</li>
<li><b>Copious low-viscosity lubricant-coolant</b> flooded over the work surface.</li>
</ol>
<ul>
<li>The lubricant film separates stone and work above a certain roughness and pressure; the minute peaks are cut at that pressure.</li>
<li>Once a continuous film is developed the cutting stops (self-limiting), so each workpiece is honed to the same degree of smoothness for a given pressure, lubricant and stone.</li>
<li>Metal removal is less than 0.05 mm; the lubricant keeps a uniform temperature and washes away chips.</li>
</ul>`
      },
      {
        id: 'fin-compare-precision',
        title: 'Lapping vs honing vs super-finishing',
        slides: [87, 89, 90],
        html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Lapping</th><th>Honing</th><th>Super-finishing</th></tr></thead>
<tbody>
<tr><td>Mainly for</td><td>Outside and flat surfaces</td><td>Round holes (bores)</td><td>Fine finish of surfaces (typically cylindrical work); variation of honing</td></tr>
<tr><td>Tool</td><td>Lap of cloth, cast iron or copper, softer than work; loose abrasive charged into it</td><td>Bonded abrasive stones expanded by a cone, with sulfur/resin/wax in the bond</td><td>Fine bonded stone under light pressure</td></tr>
<tr><td>Grit</td><td>120 grit to finest powder</td><td>80–600 grit</td><td>Fine</td></tr>
<tr><td>Motion</td><td>Lap rotated over the surface</td><td>Rotation plus reciprocation</td><td>Rapid short strokes (&gt; 400/min, &lt; 6.35 mm), path never repeats</td></tr>
<tr><td>Pressure</td><td>Light to moderate</td><td>Moderate</td><td>Very light, 0.07–0.28 MPa</td></tr>
<tr><td>Fluid</td><td>Vehicle: grease, oil or water</td><td>Honing oil/coolant</td><td>Copious low-viscosity lubricant-coolant</td></tr>
<tr><td>Removal</td><td>&lt; 0.025 mm</td><td>Small (larger than lapping, beyond slides)</td><td>&lt; 0.05 mm (self-limiting)</td></tr>
<tr><td>Applications</td><td>Gauge blocks, high-pressure seals</td><td>Engine cylinders, gear bores, gun barrels, ring gauges</td><td>Automotive and bearing surfaces needing very smooth finish</td></tr>
</tbody></table></div>`
      },
      {
        id: 'fin-nonprecision',
        title: 'Polishing, buffing, power brushing, tumbling',
        slides: [91, 92, 93, 94, 95],
        html: `
<h4>Polishing</h4>
<ul>
<li>Puts a smooth finish; <b>appreciable metal removal</b> to take out scratches, tool marks, pits and defects; accuracy not important.</li>
<li>Wheel of cloth, felt, rubber, leather or similar material with abrasive glued on, running on the work at its periphery: first remove defects, then give the desired polish.</li>
<li>Improves smoothness and appearance; can give a bright, mirror-like surface.</li>
<li>Semi-automatic machines: (1) carry the work in a line past one or more wheels, (2) revolve the pieces in contact with the wheels.</li>
</ul>
<h4>Buffing</h4>
<ul>
<li>A polishing operation: the work contacts a revolving <b>cloth buffing wheel</b> charged with very fine abrasive in a vehicle.</li>
<li>Removes a minute amount of metal; wheels of linen, cotton, broadcloth or canvas.</li>
<li>Removes very fine scratches, oxide or similar coatings; manual or machine.</li>
</ul>
<h4>Power brushing</h4>
<ul>
<li>High-speed revolving brushes improve the appearance, remove sharp edges, burrs, fins and particles; surface may be refined to about 5 micro-inch.</li>
</ul>
<h4>Tumbling</h4>
<ul>
<li>Work and abrasive particles (sawdust, wood chips, natural stones, cinders, sand, metal slugs) are loaded in a barrel; water with acid detergent, rust preventive or lubricant is added; the barrel rotates slowly for 1 to 10 h, giving a brushing action.</li>
<li><b>Advantages:</b> ferrous and nonferrous metals, plastics, rubbers, wood; cleans castings, forgings, stampings and screw machine products; removes burrs, fins, scale, skin and sharp edges; removes paint; improves finish and appearance; relieves surface strain; economical for medium and large quantity.</li>
<li><b>Disadvantages:</b> size reduction takes time; attention is needed in loading and unloading.</li>
</ul>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Process</th><th>Medium</th><th>Purpose</th></tr></thead>
<tbody>
<tr><td>Polishing</td><td>Abrasive-glued cloth, felt, rubber or leather wheel</td><td>Remove scratches, pits; smooth, bright surface</td></tr>
<tr><td>Buffing</td><td>Cloth wheel with fine abrasive in a vehicle</td><td>Remove fine scratches and oxide; mirror finish</td></tr>
<tr><td>Power brushing</td><td>High-speed brushes</td><td>Remove burrs and fins; clean; improve appearance</td></tr>
<tr><td>Tumbling</td><td>Barrel with abrasive media and water</td><td>Deburr, clean and brighten in bulk</td></tr>
</tbody></table></div>`
      }
    ],
    formulas: [],
    keyTerms: [
      ['Finishing', 'Operation after primary machining to improve surface quality, accuracy, appearance or function.'],
      ['Precision finishing', 'Grinding, lapping, honing, super-finishing: close tolerance and fine surface by small controlled removal.'],
      ['Non-precision finishing', 'Polishing, buffing, power brushing, tumbling: appearance and deburring, accuracy not stressed.'],
      ['Lapping', 'Loose abrasive carried in a vehicle between a soft lap and the work; removes less than 0.025 mm.'],
      ['Honing', 'Rotating and reciprocating bonded stones, expanded by a cone, finish round holes.'],
      ['Super-finishing', 'Honing variant: light pressure, over 400 short strokes/min, flooded lubricant, removal below 0.05 mm.'],
      ['Polishing', 'Abrasive-glued wheel removes scratches and defects to make a smooth, bright surface.'],
      ['Buffing', 'Cloth wheel charged with very fine abrasive; removes fine scratches, gives a mirror finish.'],
      ['Power brushing', 'High-speed brushes remove burrs, fins and sharp edges.'],
      ['Tumbling', 'Barrel rotated slowly 1–10 h with abrasive media and water; bulk deburring and cleaning.']
    ]
  }
];
