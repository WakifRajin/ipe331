// IPE 331 Machine Shop Atlas - model answers for Naimul Sir's part (cutting mechanics and finishing).
// Each entry: { ids: [question ids], title, html, numerical }. All numbers were computed with a script.
// Conventions used in numericals: Px = Pxy sin(phi), Py = Pxy cos(phi) (slide 50); a1 = So sin(phi), b1 = t/sin(phi);
// 7-number tool geometry in mm = ORS (lambda, gamma_o, alpha_o, alpha_o', phi_e, phi, r); in inch = ASA (gamma_y, gamma_x, alpha_y, alpha_x, phi_e, phi_s, r).

const BEYOND = '<p class="note">Beyond the slides.</p>';

const CHIPS = `
<h4>Types of chips and conditions</h4>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Type</th><th>Description</th><th>Conditions of formation</th></tr></thead>
<tbody>
<tr><td>Discontinuous</td><td>Small segments loosely adhering; repeated fracture limits deformation</td><td>Brittle work (cast iron, brass, bronze); low speed; large feed/depth; small or negative rake; no fluid</td></tr>
<tr><td>Continuous (ribbon)</td><td>Long coils by continuous plastic deformation; smooth outside, stepped inside</td><td>Ductile work; high speed; small feed/depth; large positive rake; sharp tool; good lubricant</td></tr>
<tr><td>Continuous with BUE</td><td>Like continuous but rough; poor finish</td><td>Ductile work at low-medium speed, high friction, little or no lubricant</td></tr>
<tr><td>Serrated</td><td>Saw-tooth, semi-continuous; cyclic high then low shear strain</td><td>Ti alloys, Ni superalloys, austenitic stainless steel at higher speed; steels at very high speed</td></tr>
</tbody></table></div>
<p><b>Why continuous chips form:</b> the work ahead of the edge deforms plastically along the shear zone without fracture and flows smoothly up the face. <b>Why discontinuous chips form:</b> the brittle material cannot take the shear strain, so it cracks repeatedly ahead of the tool and breaks into segments.</p>
<h4>Built-up edge (BUE)</h4>
<ol>
<li>High pressure and temperature at the tool tip weld a layer of work material to the face.</li>
<li>Strain-hardened layers pile up and form a hard wedge that acts as the cutting edge.</li>
<li>It grows until unstable, then a fragment breaks away with the chip or stays on the machined surface.</li>
<li>The cycle repeats.</li>
</ol>
<p><b>Why BUE is undesirable:</b> poor surface finish, dimensional variation, changed effective geometry, and fragments can tear tool material away. (It does shield the edge from wear, but this does not outweigh the finish problem.) Reduced by higher speed, positive rake, a sharp tool and a cutting fluid.</p>
<p><b>Sketch:</b> four small chip drawings: separate fragments; a smooth coil; a coil with a wedge stuck on the tool tip; a saw-tooth chip.</p>`;

const OBLIQUE = `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Orthogonal (2-D)</th><th>Oblique (3-D)</th></tr></thead>
<tbody>
<tr><td>Edge</td><td>At 90° to feed; inclination λ = 0</td><td>Inclined at λ to the normal to the feed</td></tr>
<tr><td>Chip flow</td><td>Normal to the edge, in the plane of the face</td><td>At the chip flow angle to the normal to the edge</td></tr>
<tr><td>Shear area / stress</td><td>Small area, higher shear stress</td><td>Larger area, lower shear stress</td></tr>
<tr><td>Tool life</td><td>Shorter</td><td>Longer</td></tr>
<tr><td>Forces</td><td>Two perpendicular components</td><td>Three components (Px, Py, Pz)</td></tr>
</tbody></table></div>
<p><b>Sketch:</b> top view of a tool with the edge square to the feed and the chip leaving along the normal; second view with the edge tilted by λ and the chip leaving at an angle to the normal.</p>`;

const SHEAR = `
<ol class="steps">
<li>Orthogonal cutting: shear plane AB at angle β to the cutting direction, rake γ, uncut thickness a1 and chip thickness a2.</li>
<li>a1 = AB sin β and a2 = AB cos(β − γ).</li>
<li>Chip reduction coefficient <b>ξ = a2/a1 = cos(β − γ)/sin β</b>. (ξ &gt; 1 because the chip is compressed: thicker and shorter, ξ = l1/l2.)</li>
<li>Expand: ξ = cos γ cot β + sin γ, so cot β = (ξ − sin γ)/cos γ.</li>
<li><b>tan β = cos γ / (ξ − sin γ)</b>.</li>
</ol>
<p>Larger rake γ gives larger β and smaller ξ; a thicker chip (larger ξ) means smaller β, so more deformation and higher force.</p>
<p><b>Sketch:</b> work and tool, rake face at γ from vertical, shear plane AB at β from the horizontal, a1 (normal to the cutting direction), a2 (normal to the face), the length AB marked.</p>`;

const KRON = `
<p><b>Definition:</b> ξ = a2/a1 (chip thickness / uncut thickness), the index of chip deformation. ξ &gt; 1 because the chip is compressed and sheared: it thickens and shortens (volume constancy with b2 ≈ b1 gives ξ = l1/l2). The result below also shows ξ &gt; 1 since μ &gt; 0 and γ &lt; π/2.</p>
<ol class="steps">
<li>Diagram: chip leaves the shear plane and is bent up the rake face, so its direction turns through the angle (π/2 − γ) while it presses on the face with friction coefficient μ.</li>
<li>Treat the chip as a flexible band over a curved surface. With friction the capstan relation gives the ratio of the compressive forces (before/after) as e<sup>μθ</sup> with θ = π/2 − γ.</li>
<li>The compression ratio of the chip (thickness increase) is this ratio, so <b>ξ = e<sup>μ(π/2 − γ)</sup></b> (Kronenberg).</li>
</ol>
<p>Higher friction raises ξ; higher rake lowers ξ. With ξ known, β follows from tan β = cos γ/(ξ − sin γ).</p>
<p class="note">Beyond the slides: Kronenberg's expression is empirical; the capstan analogy is the usual textbook argument.</p>`;

const ANGLES = `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Angle</th><th>Symbol</th><th>Purpose and effect</th><th>Value</th></tr></thead>
<tbody>
<tr><td>Side cutting edge angle (lead)</td><td>φs</td><td>Sets the entry of the edge; power falls as it rises from 0° to 15°; too large causes vibration; 0° gives shock</td><td>15–30° recommended</td></tr>
<tr><td>End cutting edge angle</td><td>φe</td><td>Prevents the end edge rubbing the finished surface</td><td>8–15° (5–30°)</td></tr>
<tr><td>Side relief</td><td>αx</td><td>Prevents side flank rubbing</td><td>5–15°</td></tr>
<tr><td>End relief</td><td>αy</td><td>Prevents end flank rubbing</td><td>5–15°</td></tr>
<tr><td>Side rake</td><td>γx</td><td>Directs chip flow; positive lowers force and power but weakens the edge</td><td>0–15°</td></tr>
<tr><td>Back rake</td><td>γy</td><td>Same, in the other plane</td><td>0–15°</td></tr>
<tr><td>Nose radius</td><td>r</td><td>Longer life and better finish; too large causes chatter</td><td>small</td></tr>
</tbody></table></div>
<p><b>Sketch:</b> three views of a right-hand turning tool: plan view (SCEA φs and ECEA φe), front view (side rake γx, side relief αx), side view (back rake γy, end relief αy), the cutting direction, principal and auxiliary edges and the nose labelled.</p>
<p><b>Performance:</b> too little relief rubs and wears the flank; too much relief weakens the edge. More positive rake lowers force and power and gives a better finish but a weaker edge and heat is conducted poorly; a large lead angle thins the chip but raises thrust. A suitable nose radius improves finish and life.</p>`;

const FLUIDPROP = `
<h4>Properties of a good cutting fluid</h4>
<ul>
<li>Good cooling capacity and lubricating quality.</li>
<li>Rust resistance and stability (long life); resistant to rancidity and foaming.</li>
<li>Non-toxic and non-flammable; does not smoke excessively.</li>
<li>Transparent, so the operator sees the work.</li>
<li>Relatively low viscosity so chips and dirt settle quickly.</li>
<li>No gummy deposits (sticky slides) and does not clog the circulating system.</li>
<li>Can be disposed of in an environmentally responsible way; low cost.</li>
</ul>`;

const FLUIDFUNC = `
<h4>Functions of cutting fluid</h4>
<ol>
<li>Cool the tool, work and chip, so the tool stays hot-hard (longer tool life).</li>
<li>Lubricate the chip-tool and tool-work contact: lower friction, force, power and BUE.</li>
<li>Flush chips away from the cutting zone.</li>
<li>Reduce thermal deformation of the work, giving better dimensional accuracy and surface finish.</li>
<li>Protect work and machine from rust.</li>
</ol>`;

const FLUIDTYPES = `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Type</th><th>Composition</th><th>Properties</th></tr></thead>
<tbody>
<tr><td>Straight oils</td><td>Undiluted mineral/petroleum oil, often with fats, esters and Cl, S, P extreme-pressure additives</td><td>Best lubrication, poorest cooling</td></tr>
<tr><td>Soluble oils</td><td>Mineral oil with emulsifier; emulsion in water, 3–10 % concentration</td><td>Good lubrication and cooling; cheapest</td></tr>
<tr><td>Semi-synthetic</td><td>Mixture of synthetic and soluble types</td><td>Between the two in cost and cooling</td></tr>
<tr><td>Synthetic</td><td>No mineral oil; alkaline inorganic and organic compounds with corrosion inhibitors, 3–10 %</td><td>Often the best cooling</td></tr>
</tbody></table></div>`;

const FLUIDAPP = `
<h4>Methods and points of application (beyond the slides)</h4>
<ul>
<li><b>Flood</b> over the tool and chip from above (most common).</li>
<li><b>Jet / mist spray</b> aimed at the tool-chip interface, or at the flank from below.</li>
<li><b>Drip or brush</b> application for light work and hand operations.</li>
<li><b>High pressure through the tool</b> or underneath the chip near the rake face.</li>
<li>Applied on the work surface before the cut (rare).</li>
</ul>`;

const WEARMECH = `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Mechanism</th><th>What happens</th><th>Where</th></tr></thead>
<tbody>
<tr><td>Abrasion</td><td>Hard particles in the work gouge small portions off the tool</td><td>Flank and crater; major cause of flank wear</td></tr>
<tr><td>Adhesion</td><td>Metals weld under high pressure and temperature; tool particles are torn off by the flowing chip (attrition)</td><td>Tool-chip interface</td></tr>
<tr><td>Diffusion</td><td>Atoms exchange across the close contact boundary; strongly temperature dependent</td><td>Principal cause of crater wear</td></tr>
<tr><td>Chemical reaction</td><td>Oxidation of the rake face at high temperature; soft oxide sheared away</td><td>High-speed cutting</td></tr>
<tr><td>Plastic deformation</td><td>Edge deforms under force at high temperature</td><td>Mainly flank wear</td></tr>
</tbody></table></div>
<p>Most mechanisms accelerate at higher speed and temperature.</p>`;

const TOOLPROP = `
<h4>Properties a tool material should possess and why</h4>
<ul>
<li><b>Hot hardness:</b> must stay harder than the work at the operating temperature.</li>
<li><b>Wear resistance:</b> to withstand abrasion even when relative hardness changes.</li>
<li><b>Low friction</b> at the chip-tool interface: low wear and good finish.</li>
<li><b>Toughness:</b> to resist shock in interrupted cutting.</li>
<li><b>High thermal conductivity, low expansion:</b> to carry heat away and keep shape; no distortion in heat treatment.</li>
<li>Easy to regrind and to join to the holder; economical.</li>
</ul>`;

const TOOLMAT = `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Material</th><th>Advantages</th><th>Limitations</th><th>Applications</th></tr></thead>
<tbody>
<tr><td>Carbon tool steel</td><td>Cheap, easy to shape</td><td>Poor above 200 °C</td><td>Taps, core drills for soft work, wood tools</td></tr>
<tr><td>HSS</td><td>Hot hard to about 600 °C, wear resistant, good hardenability, tough</td><td>Lower speed than carbide</td><td>Drills, reamers, broaches, milling cutters, taps, lathe tools, hobs</td></tr>
<tr><td>Carbide (PM, inserts)</td><td>Very hard, high speeds, indexable inserts</td><td>Brittle, costlier</td><td>General and high-speed machining</td></tr>
<tr><td>Ceramics</td><td>High abrasion resistance and hot hardness</td><td>Poor for interrupted cuts; need dry or profuse fluid</td><td>High-speed finishing of hard work</td></tr>
</tbody></table></div>`;

const MCD = `
<p><b>Sketch (MCD):</b> draw Pz horizontal (cutting direction) and Pxy vertical from the tool tip; draw the resultant R as the diagonal and a circle with R as diameter. Draw the rake face at γ from the vertical with F along it and N perpendicular. Draw the shear plane at β from the horizontal with Ps along it and Pn perpendicular. The tips of Pz, Pxy, F, N, Ps, Pn lie on the circle; the angle between R and N is η, between R and Pn is (β + η − γ).</p>
<ol class="steps">
<li>Resolve along and across the rake face: <b>F = Pz sin γ + Pxy cos γ</b>, <b>N = Pz cos γ − Pxy sin γ</b>.</li>
<li>Resolve along and across the shear plane: <b>Ps = Pz cos β − Pxy sin β</b>, <b>Pn = Pz sin β + Pxy cos β</b>.</li>
<li>Where Px or Py is given, first find Pxy = √(Px² + Py²), with Px = Pxy sin φ and Py = Pxy cos φ, then use the formulas above.</li>
<li><b>μ = tan η = F/N = (Pxy + Pz tan γ)/(Pz − Pxy tan γ)</b>.</li>
<li>In terms of R: F = R sin η, N = R cos η, Pz = R cos(η − γ), Pxy = R sin(η − γ), Ps = R cos(β + η − γ), Pn = R sin(β + η − γ).</li>
<li>As = So t / sin β (a1 = So sin φ, b1 = t/sin φ); <b>τs = Ps/As</b>.</li>
<li>Ps = τs As and Pz = Ps cos(η − γ)/cos(β + η − γ), so <b>Pz = τs So t cos(η − γ) / (sin β cos(β + η − γ))</b> = τs So t [cot β + tan(β + η − γ)].</li>
</ol>`;

const MASTER = `
<p><b>Master line:</b> the line in which the tool rake face meets (lies in) the reference plane πR. The face is a plane; its steepest slope (maximum rake γm) is perpendicular to the master line, and the slope in any direction u is the component tan γ = tan γm cos θ along u. Let g be the steepest-slope vector, |g| = tan γm; x along the feed (plane πx), y across it (πy), the principal cutting edge at φ to x, so tan γx = gx, tan γy = gy.</p>
<ol class="steps">
<li>Normal to the cutting edge (orthogonal plane πo): u = (sin φ, cos φ), so <b>tan γo = tan γx sin φ + tan γy cos φ</b>.</li>
<li>Along the edge: e = (−cos φ, sin φ), so <b>tan λ = −tan γx cos φ + tan γy sin φ</b>.</li>
<li>(u, e) is the (x, y) frame rotated by φ, so g components transform back by the inverse rotation: <b>tan γx = tan γo sin φ − tan λ cos φ</b> and <b>tan γy = tan γo cos φ + tan λ sin φ</b>.</li>
<li>A rotation keeps the length: tan²γm = tan²γo + tan²λ = tan²γx + tan²γy, so <b>tan γm = √(tan²γo + tan²λ)</b>.</li>
<li>Relief: cot α is the slope of the flank relative to the horizontal and combines like tan γ. The flank contains the cutting edge, so its slope along the edge is tan λ; hence <b>cot αm = √(cot²αo + tan²λ)</b> and, resolving cot αo on the machine axis that pairs with cos φ, <b>cot α = cot αo cos φ + tan λ sin φ</b> (the form asked for αx in the paper).</li>
</ol>
<p><b>Sketch:</b> plan view of the rake face with the master line, the cutting edge at φ, the axes x, y, the orthogonal direction u and the direction of maximum slope; add a section view showing the slope triangle.</p>
<p class="note">The symbol φy in 2020-21 Q8(a)(ii) is not defined in the slides and cannot be reproduced from the standard master-line relations; state your definition of the master-line angle, then use the vector relations above.</p>`;

const WEARCURVE = `
<ol>
<li><b>Break-in period:</b> the sharp edge wears rapidly in the first few minutes.</li>
<li><b>Steady-state region:</b> fairly uniform, almost linear wear rate with time.</li>
<li><b>Failure region:</b> wear rate accelerates, temperature rises, efficiency falls, finally temperature failure.</li>
</ol>
<p><b>Sketch:</b> axes: flank wear VB (vertical) against cutting time (horizontal); a steep initial rise, a long straight steady portion, a steep final rise; a horizontal wear-limit line meeting the curve at the tool life T.</p>`;

const ECON = `
<p><b>Cost components per piece:</b> non-productive (handling) cost Co·Th; machining cost Co·Tm; tool change cost Co·Tt·Tm/T; tool cost Ct·Tm/T. (Co = operating rate, Th = handling time, Tm = machining time, Tt = tool change time, Ct = tool cost per edge.)</p>
<ol class="steps">
<li>Cc = Co Th + Co Tm + (Co Tt + Ct) Tm/T.</li>
<li>Tm = K/V with K = πDL/f; Taylor: T = (C/V)<sup>1/n</sup>.</li>
<li>Cc = Co Th + Co K/V + (Co Tt + Ct) K V<sup>(1/n − 1)</sup> / C<sup>1/n</sup>.</li>
<li>dCc/dV = 0: Co K/V² = (Co Tt + Ct) K (1/n − 1) V<sup>(1/n − 2)</sup> / C<sup>1/n</sup>, so V<sup>1/n</sup> = C<sup>1/n</sup> n Co / ((1 − n)(Co Tt + Ct)).</li>
<li><b>V_opt = C [ n Co / ((1 − n)(Co Tt + Ct)) ]<sup>n</sup></b>, and <b>T_opt = ((1 − n)/n)(Tt + Ct/Co)</b>.</li>
</ol>
<p><b>Graph:</b> cost per piece vs cutting speed: handling cost is a horizontal line, machining cost falls as 1/V, tool-change plus tool cost rises with V; the total curve has a minimum at V_opt. The max-production-rate speed (Ct = 0, cost ignored) lies to the right of it.</p>
<p><b>Effect of Taylor's n:</b> T_opt = ((1−n)/n)(Tt + Ct/Co): small n (HSS, 0.08–0.2) gives a long optimum life and V_opt well below C; large n (carbide 0.2–0.5, ceramic 0.5–0.7) gives a short optimum life and V_opt closer to C, so high speeds pay.</p>
${BEYOND}`;

export const ANSWERS_NAIMUL = [
  /* ============================================================ TOOL GEOMETRY */
  {
    ids: ['2022-23_5a'],
    title: 'Single-point cutting tool',
    numerical: false,
    html: `
<p>A <b>single-point cutting tool</b> has only one main cutting edge doing the cutting at a time. It may be right-hand or left-hand according to the direction of feed. Its parts: face (rake surface), flank, principal (side) cutting edge, auxiliary (end) cutting edge, corner or nose.</p>
<p><b>Examples:</b> lathe (turning) tools, shaper tools, planer tools, boring bars. (Multi-point tools such as drills, milling cutters, broaches and grinding wheels have more than one edge.)</p>`
  },
  {
    ids: ['2020-21_1a'],
    title: 'Types of cutting tools, with advantages and disadvantages',
    numerical: false,
    html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Type</th><th>Examples</th><th>Advantages</th><th>Disadvantages</th></tr></thead>
<tbody>
<tr><td>Single-point</td><td>Lathe, shaper, planer, boring tools</td><td>Simple, cheap, easy to grind to any shape, flexible</td><td>Only one edge working, lower production rate, one edge wears out</td></tr>
<tr><td>Multi-point</td><td>Drills, milling cutters, broaches, grinding wheels, honing tool</td><td>Many edges share the load, high production rate, good accuracy</td><td>Complicated and expensive, harder to regrind</td></tr>
</tbody></table></div>
<p>By construction: <b>solid</b> tools need regrinding with downtime; <b>brazed-tip</b> tools; <b>inserts</b> are clamped with several indexable edges, no regrinding, quick change, high removal rate and cheap throw-away, but need the right insert shape and holder.</p>
<h4>By tool material</h4>
${TOOLMAT}`
  },
  {
    ids: ['2021-22_6a', '2016-17_2a', '2013-14_4d'],
    title: 'Orthogonal and oblique cutting; why chip flow deviates',
    numerical: false,
    html: `
<p>The tool is wedge-shaped with a straight edge; there are two methods of cutting, depending on the arrangement of the edge relative to the relative work-tool motion.</p>
${OBLIQUE}
<h4>Why the chip flow deviates from the orthogonal plane</h4>
<ol>
<li>The <b>inclination angle λ</b> of the edge: the chip tends to flow at roughly the angle λ to the normal of the edge.</li>
<li>Nose radius and the auxiliary edge, which add side flow.</li>
<li>Friction on the rake face and side flow of the work material.</li>
</ol>
${BEYOND}`
  },
  {
    ids: ['2021-22_6b', '2017-18_4b', '2013-14_4b', '2012-13_2a'],
    title: 'Angles of a single-point tool, purpose and influence on performance',
    numerical: false,
    html: ANGLES
  },
  {
    ids: ['2014-15_4b'],
    title: 'Standard tool angles; why chip and tool tip become hot',
    numerical: false,
    html: `${ANGLES}
<h4>Why the chip and tool tip are hot</h4>
<ol>
<li>Nearly all the cutting work becomes heat. <b>Shear</b> work in the primary zone (largest share).</li>
<li><b>Friction</b> of the chip sliding on the rake face (secondary shear zone), the tip being at the hottest region.</li>
<li>Rubbing of the flank on the machined surface.</li>
</ol>
<p>The chip carries away most of the heat, but because the tool is small and the contact area is tiny, the tip temperature is high and rises with cutting speed.</p>
${BEYOND}`
  },
  {
    ids: ['2018-19_2a'],
    title: 'Draw the tool and its angles; ξ in terms of γ and μ',
    numerical: false,
    html: `${ANGLES}
<h4>Chip reduction coefficient</h4>
${KRON}`
  },
  {
    ids: ['2022-23_6a', '2021-22_7a'],
    title: 'Positive and negative rake angles',
    numerical: false,
    html: `
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Positive rake</th><th>Negative rake</th></tr></thead>
<tbody>
<tr><td>Rake face</td><td>Slopes away from the cutting edge, wedge is thin</td><td>Slopes towards the work, wedge is thick</td></tr>
<tr><td>Edge strength</td><td>Weak</td><td>Strong (carbide and ceramic loaded in compression)</td></tr>
<tr><td>Shear angle</td><td>Larger, thin chip</td><td>Smaller, thick chip</td></tr>
<tr><td>Force and power</td><td>Lower</td><td>Higher</td></tr>
<tr><td>Finish</td><td>Better on soft ductile work</td><td>Needs rigid machine</td></tr>
<tr><td>Use</td><td>Soft materials, finishing, HSS</td><td>Hard materials, interrupted cuts, carbide inserts</td></tr>
</tbody></table></div>
<p><b>Sketch:</b> two wedge-shaped tools cutting a work. In the first the rake face leans back from the vertical (γ positive, measured from the vertical line through the edge, face slopes down away from the work); in the second it leans forward (γ negative). Mark γ, the chip, the shear plane and the cutting direction.</p>`
  },
  {
    ids: ['2015-16_8a'],
    title: 'Significance of rake angles; straight oil vs soluble oil',
    numerical: false,
    html: `
<ul>
<li><b>Positive rake:</b> lower force, power and heat, better finish for soft ductile work, but weak edge.</li>
<li><b>Zero rake:</b> strong edge, moderate force; used for form tools and brass.</li>
<li><b>Negative rake:</b> strongest edge for hard work and interrupted cuts, but high force and power.</li>
</ul>
<h4>Straight oil vs soluble oil</h4>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Straight oil</th><th>Soluble oil</th></tr></thead>
<tbody>
<tr><td>Form</td><td>Non-emulsifiable, used undiluted</td><td>Emulsion in water (3–10 % concentrate)</td></tr>
<tr><td>Lubrication</td><td>Best</td><td>Good</td></tr>
<tr><td>Cooling</td><td>Poorest</td><td>Good heat transfer</td></tr>
<tr><td>Cost</td><td>Higher</td><td>Least expensive</td></tr>
<tr><td>Use</td><td>Low speed, heavy cuts, threading, hard materials</td><td>General purpose, high speed</td></tr>
</tbody></table></div>`
  },
  {
    ids: ['2023-24_1a', '2010-11_3a'],
    title: 'Conversion of rake angles: ASA to ORS and ORS to ASA',
    numerical: false,
    html: `
<p>ASA rake angles are γx (side rake, in plane πx along the feed) and γy (back rake, in πy); ORS angles are γo (orthogonal rake, in πo normal to the edge) and λ (inclination). φ is the principal cutting edge angle. The conversion uses the master-line (plane face) argument.</p>
${MASTER}
<h4>Results</h4>
<p><b>(i) ASA to ORS:</b> tan γo = tan γx sin φ + tan γy cos φ ; tan λ = −tan γx cos φ + tan γy sin φ.</p>
<p><b>(ii) ORS to ASA:</b> tan γx = tan γo sin φ − tan λ cos φ ; tan γy = tan γo cos φ + tan λ sin φ.</p>`
  },
  {
    ids: ['2015-16_5c', '2020-21_8a', '2009-10_3b'],
    title: 'Master-line proofs',
    numerical: false,
    html: `
<p>Proofs required: tan γo, tan λ, tan γx, tan γy, tan γm and cot αm. All follow from the five steps below.</p>
${MASTER}`
  },
  {
    ids: ['2021-22_6c'],
    title: 'Master line; orthogonal rake of the tool 5°, 10°, 7°, 8°, 20°, 30°, 1/32 in',
    numerical: true,
    html: `
<p><b>Master line</b> and proofs of tan γo and tan λ:</p>
${MASTER}
<h4>Numerical</h4>
<p><b>Assumption:</b> inch signature means ASA: γy = 5° (back rake), γx = 10° (side rake), αy = 7°, αx = 8°, φe = 20°, φs = 30°, r = 1/32 in. Principal cutting edge angle φ = 90° − φs = 60° (φs is measured from the tool axis, slide 15).</p>
<ol class="steps">
<li>tan γo = tan 10° sin 60° + tan 5° cos 60° = 0.17633 × 0.86603 + 0.08749 × 0.5 = 0.15271 + 0.04374 = 0.19645.</li>
<li><b>γo = 11.11°</b>.</li>
<li>For reference tan λ = −0.17633 × 0.5 + 0.08749 × 0.86603 = −0.08816 + 0.07577 = −0.01239, so λ = −0.71°; γm = 11.14°.</li>
</ol>
<p class="note">If the paper intends φ = 30° directly, γo = 9.31° (λ = −6.22°).</p>`
  },
  {
    ids: ['2022-23_6c'],
    title: 'Master-line proofs and maximum rake of the tool 10°, −10°, 8°, 6°, 15°, 30°, 0 in',
    numerical: true,
    html: `
<p>Proofs of (i) tan γo, (ii) tan λ and (iii) tan γm:</p>
${MASTER}
<h4>Numerical</h4>
<p><b>Assumption:</b> inch signature = ASA: γy = 10°, γx = −10°, φs = 30°, so φ = 60°.</p>
<ol class="steps">
<li>tan γo = tan(−10°) sin 60° + tan 10° cos 60° = −0.15271 + 0.08816 = −0.06455, so γo = −3.69°.</li>
<li>tan λ = −tan(−10°) cos 60° + tan 10° sin 60° = 0.08816 + 0.15271 = 0.24087, so λ = 13.54°.</li>
<li>tan γm = √(0.06455² + 0.24087²) = √(0.004167 + 0.058019) = 0.24937.</li>
<li><b>γm = 14.0°</b> (check: tan γm = √(2) tan 10° = 0.24937; independent of φ).</li>
</ol>`
  },
  {
    ids: ['2010-11_3b', '2009-10_3c'],
    title: 'Side, back and maximum rake from an ORS signature',
    numerical: true,
    html: `
<p><b>Assumption:</b> a 7-number signature in mm is ORS: (λ, γo, αo, α′o, φe, φ, r). Use tan γx = tan γo sin φ − tan λ cos φ, tan γy = tan γo cos φ + tan λ sin φ, tan γm = √(tan²γo + tan²λ).</p>
<h4>2010-11 Q3(b): 0°, 10°, 8°, 6°, 15°, 60°, 0 mm</h4>
<p>λ = 0, γo = 10°, φ = 60°.</p>
<ol class="steps">
<li>tan γx = tan 10° sin 60° = 0.17633 × 0.86603 = 0.15271, so <b>γx = 8.68°</b>.</li>
<li>tan γy = tan 10° cos 60° = 0.08816, so <b>γy = 5.04°</b>.</li>
<li>tan γm = √(0.17633² + 0) so <b>γm = 10.0°</b>.</li>
</ol>
<h4>2009-10 Q3(c): 0°, 9°, 6°, 6°, 7°, 60°, 1 mm</h4>
<p>λ = 0, γo = 9°, φ = 60°.</p>
<ol class="steps">
<li>tan γx = tan 9° sin 60° = 0.15838 × 0.86603 = 0.13716, so <b>side rake = 7.81°</b>.</li>
<li>tan γy = 0.15838 × 0.5 = 0.07919, so <b>back rake = 4.53°</b>.</li>
<li><b>Maximum rake = 9.0°</b> (λ = 0).</li>
</ol>`
  },
  /* ============================================================ CHIPS */
  {
    ids: ['2012-13_4d', '2009-10_3a', '2017-18_2a'],
    title: 'Types of chips, BUE; orthogonal and oblique cutting',
    numerical: false,
    html: `${CHIPS}<h4>Orthogonal and oblique cutting</h4>${OBLIQUE}`
  },
  {
    ids: ['2021-22_7b'],
    title: 'Chip types and properties of a good cutting fluid',
    numerical: false,
    html: `${CHIPS}${FLUIDPROP}`
  },
  {
    ids: ['2016-17_4b'],
    title: 'Types of chips; shear angle, chip reduction coefficient and rake',
    numerical: false,
    html: `${CHIPS}<h4>Shear angle</h4>${SHEAR}`
  },
  {
    ids: ['2017-18_2b'],
    title: 'Chip reduction coefficient and shear angle in orthogonal cutting',
    numerical: false,
    html: SHEAR
  },
  {
    ids: ['2014-15_2a'],
    title: 'Shear angle for ductile metal; effect of rake and chip thickness',
    numerical: false,
    html: `${SHEAR}
<p><b>Effect:</b> by tan β = cos γ/(ξ − sin γ) with ξ = a2/a1: increasing rake γ raises β (thin chip); for the same a1, a thicker measured chip (larger a2, larger ξ) gives a smaller β. Large β means a short shear plane, less deformation, lower force; small β means the opposite.</p>`
  },
  {
    ids: ['2015-16_5a', '2013-14_2a', '2011-12_3a', '2010-11_3c'],
    title: 'Chip reduction coefficient: ξ = e^{μ(π/2 − γ)} (Kronenberg)',
    numerical: false,
    html: KRON
  },
  /* ============================================================ FLUIDS AND TEMPERATURE */
  {
    ids: ['2022-23_7b'],
    title: 'Functions and properties of cutting fluid',
    numerical: false,
    html: `${FLUIDFUNC}${FLUIDPROP}`
  },
  {
    ids: ['2013-14_2d'],
    title: 'Types of cutting fluids, methods of application, essential characteristics',
    numerical: false,
    html: `${FLUIDTYPES}${FLUIDAPP}${FLUIDPROP}`
  },
  {
    ids: ['2011-12_3d'],
    title: 'Points of application and properties of cutting fluids',
    numerical: false,
    html: `${FLUIDAPP}${FLUIDPROP}`
  },
  {
    ids: ['2012-13_2d'],
    title: 'Characteristics of cutting fluids; tool materials',
    numerical: false,
    html: `${FLUIDPROP}<h4>Cutting tool materials</h4>${TOOLMAT}`
  },
  {
    ids: ['2012-13_4b'],
    title: 'Factors restraining speed, feed and depth; causes and effects of high temperature',
    numerical: false,
    html: `
<h4>Factors restraining increase</h4>
<ul>
<li><b>Cutting speed:</b> temperature rises most with speed; by Taylor (V T<sup>n</sup> = C) a small rise in V cuts tool life sharply; also diffusion/chemical wear, BUE and chatter limits.</li>
<li><b>Feed:</b> force and temperature rise, surface roughness grows (finish ~ f²/8r), chip handling and tool/work deflection.</li>
<li><b>Depth of cut:</b> force and power grow almost in proportion; limited by machine power, rigidity, vibration and tool fracture; temperature rises least.</li>
<li>Also the machine power, workpiece rigidity and specified finish and accuracy.</li>
</ul>
<h4>Causes of high cutting temperature</h4>
<ol>
<li>Plastic deformation (shear) in the primary zone.</li>
<li>Friction of the chip on the rake face (secondary shear).</li>
<li>Rubbing of the flank on the machined surface.</li>
</ol>
<h4>Effects</h4>
<ul>
<li>The tool softens and wears quickly (diffusion, oxidation, plastic deformation): short tool life.</li>
<li>Higher cutting force, dimensional inaccuracy from thermal expansion of work and tool.</li>
<li>Thermal damage and residual stress on the machined surface; BUE.</li>
</ul>
${BEYOND}`
  },
  /* ============================================================ FORCES: DERIVATIONS */
  {
    ids: ['2023-24_1b', '2012-13_2b', '2018-19_2b', '2009-10_4a', '2014-15_2b'],
    title: 'Earnest and Merchant theory: Pz = 2 τs So t cot β',
    numerical: false,
    html: `
<h4>Conditions</h4>
<ul>
<li>Orthogonal cutting of a ductile metal giving a continuous chip, no BUE, sharp tool.</li>
<li>Single shear plane at β with constant shear stress τs; chip in equilibrium under R; constant friction coefficient; plane strain.</li>
<li>The shear angle takes the value that needs the least force (minimum energy).</li>
</ul>
<p><b>Sketch:</b> the MCD of Pz, Pxy, F, N, Ps, Pn with R on the circle diameter; angles γ, η, β marked.</p>
<ol class="steps">
<li>From the MCD, Ps = R cos(β + η − γ), Pz = R cos(η − γ), so Pz = Ps cos(η − γ)/cos(β + η − γ).</li>
<li>As = a1 b1/sin β = So t/sin β and Ps = τs As.</li>
<li>Pz = τs So t cos(η − γ) / (sin β cos(β + η − γ)). For given τs, So, t, η, γ it depends only on β.</li>
<li>Minimum Pz: d/dβ [sin β cos(β + η − γ)] = cos(2β + η − γ) = 0, so <b>2β + η − γ = π/2</b> (Merchant).</li>
<li>Then cos(β + η − γ) = cos(π/2 − β) = sin β and cos(η − γ) = cos(π/2 − 2β) = sin 2β = 2 sin β cos β.</li>
<li>Pz = τs So t · 2 sin β cos β / sin²β = <b>2 τs So t cot β</b>.</li>
</ol>
${BEYOND}`
  },
  {
    ids: ['2010-11_4a'],
    title: 'Pz = τs So t [cot β + tan(β + η − γ)]',
    numerical: false,
    html: `
<p>The expression in the paper, tan(c − β), is tan(β + η − γ) in the usual notation.</p>
<ol class="steps">
<li>From the MCD, Ps = R cos(β + η − γ) and Pz = R cos(η − γ), so Pz = Ps cos(η − γ)/cos(β + η − γ).</li>
<li>Ps = τs As = τs So t / sin β (orthogonal cutting of a ductile metal, continuous chip, single shear plane, constant τs).</li>
<li>Pz = τs So t cos(η − γ) / (sin β cos(β + η − γ)).</li>
<li>Write (η − γ) = (β + η − γ) − β: cos(η − γ) = cos(β + η − γ) cos β + sin(β + η − γ) sin β.</li>
<li>Divide by sin β cos(β + η − γ): <b>Pz = τs So t [cot β + tan(β + η − γ)]</b>.</li>
</ol>
<p>It is minimum when β + η − γ = π/2 − β, giving 2 τs So t cot β.</p>`
  },
  {
    ids: ['2016-17_2b'],
    title: "Shear angle from friction angle and rake: Merchant's relation",
    numerical: false,
    html: `
<ol class="steps">
<li>Using the MCD: Pz = τs So t cos(η − γ) / (sin β cos(β + η − γ)).</li>
<li>For minimum force (least energy) differentiate with respect to β and set to zero: cos(2β + η − γ) = 0.</li>
<li><b>2β + η − γ = π/2</b>, i.e. <b>β = π/4 + γ/2 − η/2</b>.</li>
</ol>
<p>A larger rake γ or a smaller friction angle η gives a larger shear angle β.</p>
<p><b>Sketch:</b> the MCD with β, η and γ marked.</p>`
  },
  {
    ids: ['2017-18_2c', '2013-14_2b', '2011-12_3b'],
    title: "Merchant's circle diagram and the force relations",
    numerical: false,
    html: `
<p>Required: draw the MCD; Ps, Pn as functions of Pz, Pxy (Px, Py), γ and β; F, N as functions of Pz, Pxy, γ; μ as function of Pz, Pxy, γ; Pz as function of τs, So, t, β.</p>
${MCD}
<p>Note: the "Px" or "Py" in the question stands for Pxy, the horizontal-plane thrust resultant in the MCD (Pxy = Px/sin φ = Py/cos φ).</p>`
  },
  {
    ids: ['2014-15_4c'],
    title: 'Purpose of determining cutting forces; blind vs open riser',
    numerical: false,
    html: `
<h4>Purpose of finding cutting forces</h4>
<ul>
<li>To estimate the power required by the machine tool.</li>
<li>To estimate the straining actions on machine components, bearings, jigs and fixtures.</li>
<li>To evaluate the role of the process parameters on the forces.</li>
<li>To evaluate new work materials, tool materials, environments and techniques for machinability.</li>
</ul>
<h4>Blind vs open riser (casting; not Naimul Sir's part)</h4>
<p>A blind riser is wholly inside the mould, so heat is lost only to the sand, not from an open top, and atmospheric or pressure assistance can be provided; it stays molten longer for its size, so a smaller riser is enough. An open riser loses heat from its top and needs a larger volume.</p>
${BEYOND}`
  },
  /* ============================================================ FORCES: NUMERICALS */
  {
    ids: ['2023-24_1c'],
    title: 'Turning steel: rake angles, μ, N and power (λ = 0, γo = 10°, φ = 60°)',
    numerical: true,
    html: `
<p><b>Assumptions:</b> the 7-number geometry in mm is ORS (λ, γo, αo, α′o, φe, φ, r): λ = 0, γo = 10°, φ = 60°. Py = Pxy cos φ.</p>
<ol class="steps">
<li>(i) tan γx = tan 10° sin 60° = 0.15271 → <b>side rake γx = 8.68°</b>; tan γy = tan 10° cos 60° = 0.08816 → <b>back rake γy = 5.04°</b>.</li>
<li>Pxy = Py/cos φ = 200/0.5 = 400 N (Px = 346.4 N).</li>
<li>F = Pz sin γ + Pxy cos γ = 1000 × 0.17365 + 400 × 0.98481 = 173.65 + 393.92 = 567.6 N.</li>
<li>(iii) N = Pz cos γ − Pxy sin γ = 984.81 − 69.46 = <b>915.3 N</b>.</li>
<li>(ii) μ = F/N = 567.6/915.3 = <b>0.620</b> (η = 31.8°).</li>
<li>(iv) Vc = πDN/1000 = π × 200 × 540/1000 = 339.3 m/min; power = Pz Vc/60 = 1000 × 339.3/60 = 5655 W = <b>5.65 kW</b>.</li>
</ol>
<p>Check: a1 = 0.24 sin 60° = 0.2078 mm, ξ = 0.80/0.2078 = 3.85, β = 15.0°.</p>`
  },
  {
    ids: ['2021-22_7c'],
    title: 'MCD relations and shear force for Pz = 900 N, Pxy = 600 N, β = 30°',
    numerical: true,
    html: `
<p>Relations: F = Pz sin γ + Pxy cos γ, N = Pz cos γ − Pxy sin γ, Ps = Pz cos β − Pxy sin β, Pn = Pz sin β + Pxy cos β (derivation in the MCD answer).</p>
${MCD}
<p><b>Numerical:</b> feed force Px = 0, so φ = 90° and Pxy = Py = 600 N. The rake angle is not needed for Ps.</p>
<ol class="steps">
<li>Ps = Pz cos β − Pxy sin β = 900 × 0.86603 − 600 × 0.5 = 779.4 − 300.0.</li>
<li><b>Shear force Ps = 479.4 N</b>. (Pn = 969.6 N.)</li>
</ol>`
  },
  {
    ids: ['2018-19_2c'],
    title: 'SAE 133 steel: μ, Ps and Pn (γ = 6°, φ = 60°, ξ = 1.8)',
    numerical: true,
    html: `
<p><b>Assumption:</b> the axial component is the feed force Px, so Pxy = Px/sin φ.</p>
<ol class="steps">
<li>Pxy = 450/sin 60° = 519.6 N (Py = 259.8 N). Pz = 1050 N.</li>
<li>F = 1050 sin 6° + 519.6 cos 6° = 109.8 + 516.8 = 626.5 N; N = 1050 cos 6° − 519.6 sin 6° = 1044.2 − 54.3 = 989.9 N.</li>
<li><b>μ = 626.5/989.9 = 0.633</b> (η = 32.3°).</li>
<li>tan β = cos 6°/(1.8 − sin 6°) = 0.99452/1.69547 = 0.58656, <b>β = 30.39°</b>.</li>
<li><b>Ps</b> = 1050 cos 30.39° − 519.6 sin 30.39° = 905.9 − 263.1 = <b>642.8 N</b>.</li>
<li><b>Pn</b> = 1050 sin 30.39° + 519.6 cos 30.39° = 531.3 + 448.2 = <b>979.5 N</b>.</li>
</ol>`
  },
  {
    ids: ['2017-18_2d', '2010-11_4c'],
    title: 'Turning at γ = −12°, φ = 60° (Pz = 1000 N, Py = 200 N, a2 = 0.80 mm)',
    numerical: true,
    html: `
<p>Data: D = 150 mm, N = 560 rpm, So = 0.32 mm/rev, t = 4 mm. For 2010-11 Q4(c) the signature 0°, −12°, 8°, 7°, 30°, 60°, 0 mm is ORS: λ = 0, γo = −12°, φ = 60° (the same data as 2017-18 Q2(d)). Py = Pxy cos φ.</p>
<ol class="steps">
<li>Pxy = 200/cos 60° = 400 N.</li>
<li><b>Friction force</b> F = 1000 sin(−12°) + 400 cos(−12°) = −207.9 + 391.3 = <b>183.3 N</b>.</li>
<li><b>Normal force</b> N = 1000 cos(−12°) − 400 sin(−12°) = 978.1 + 83.2 = <b>1061.3 N</b>.</li>
<li><b>μ = F/N = 0.173</b> (η = 9.8°).</li>
<li>a1 = So sin φ = 0.32 × 0.86603 = 0.2771 mm, ξ = 0.80/0.2771 = 2.887; tan β = cos γ/(ξ − sin γ) = 0.97815/(2.887 + 0.2079) = 0.31603, β = 17.54°.</li>
<li><b>Shear force</b> Ps = 1000 cos 17.54° − 400 sin 17.54° = 953.5 − 120.6 = <b>833.0 N</b>.</li>
<li>As = So t/sin β = 0.32 × 4/0.30138 = 4.247 mm²; <b>τs = 833.0/4.247 = 196 N/mm²</b> (MPa).</li>
</ol>`
  },
  {
    ids: ['2017-18_5d'],
    title: 'Rough turning grey cast iron: MRR, power, rpm, torque, time',
    numerical: true,
    html: `
<p>D = 52 mm, K = 915 N/mm², f = 0.4 mm/rev, d = 4.2 mm, V = 75 m/min, L = 152.5 mm, over-travel 2.5 mm. (Cutting speed taken at the outer diameter.)</p>
<ol class="steps">
<li>(i) MRR = V f d = 75 000 mm/min × 0.4 × 4.2 = <b>126 000 mm³/min</b>.</li>
<li>(ii) Power = K × MRR = 915 × 126 000 = 1.1529 × 10⁸ N·mm/min = 1.1529 × 10⁸/60 000 = 1921.5 W = <b>1.92 kW</b>. (Fc = K f d = 1537 N.)</li>
<li>(iii) N = 1000 V/(πD) = 75 000/(π × 52) = <b>459 rpm</b>.</li>
<li>(iv) ω = 2π × 459.1/60 = 48.08 rad/s; torque T = P/ω = 1921.5/48.08 = <b>40.0 N·m</b>.</li>
<li>(v) Tm = (152.5 + 2.5)/(f N) = 155/(0.4 × 459.1) = <b>0.844 min</b> (≈ 50.6 s).</li>
</ol>`
  },
  {
    ids: ['2016-17_2c'],
    title: 'Ductile metal rod: F, N, Ps and τs (γ = 10°, φ = 70°)',
    numerical: true,
    html: `
<p>D = 120 mm, N = 320 rpm, So = 0.24 mm/rev, t = 3 mm; Pz = 750 N, Py = 200 N (transverse), a2 = 0.7 mm.</p>
<ol class="steps">
<li>Pxy = Py/cos 70° = 200/0.34202 = 584.8 N.</li>
<li>(i) F = 750 sin 10° + 584.8 cos 10° = 130.2 + 575.9 = <b>706.1 N</b>.</li>
<li>(ii) N = 750 cos 10° − 584.8 sin 10° = 738.6 − 101.5 = <b>637.1 N</b> (μ = 1.11).</li>
<li>a1 = 0.24 sin 70° = 0.2255 mm, ξ = 0.7/0.2255 = 3.104; tan β = 0.98481/(3.104 − 0.17365) = 0.33607, β = 18.58°.</li>
<li>(iii) Ps = 750 cos 18.58° − 584.8 sin 18.58° = 710.9 − 186.3 = <b>524.6 N</b>.</li>
<li>(iv) As = So t/sin β = 0.24 × 3/0.31872 = 2.260 mm²; <b>τs = 524.6/2.260 = 232 N/mm²</b>.</li>
</ol>`
  },
  {
    ids: ['2015-16_5b'],
    title: 'Steel rod, carbide insert: μ, chip velocity, τs and power',
    numerical: true,
    html: `
<p>D = 160 mm, N = 560 rpm, So = 0.32 mm/rev, t = 4 mm, a2 = 1 mm, Pz = 1600 N, feed force Px = 800 N. <b>Assumptions:</b> the geometry lists only six numbers; λ = 0, γo = −10°, and φ = 75° (the entry before r) are taken. Pxy = Px/sin φ.</p>
<ol class="steps">
<li>Pxy = 800/sin 75° = 828.2 N.</li>
<li>F = 1600 sin(−10°) + 828.2 cos(−10°) = −277.8 + 815.6 = 537.8 N; N = 1600 cos(−10°) − 828.2 sin(−10°) = 1575.7 + 143.8 = 1719.5 N.</li>
<li>(i) <b>μ = 537.8/1719.5 = 0.313</b>.</li>
<li>Vc = π × 0.16 × 560 = 281.5 m/min; a1 = 0.32 sin 75° = 0.3091 mm, ξ = 1/0.3091 = 3.235.</li>
<li>(ii) <b>Chip velocity</b> Vf = Vc/ξ = 281.5/3.235 = <b>87.0 m/min</b>.</li>
<li>tan β = cos(−10°)/(3.235 + 0.17365) = 0.28890, β = 16.11°; Ps = 1600 cos 16.11° − 828.2 sin 16.11° = 1537.6 − 229.8 = 1307.3 N; As = 0.32 × 4/sin 16.11° = 4.612 mm².</li>
<li>(iii) <b>τs = 1307.3/4.612 = 283 N/mm²</b>.</li>
<li>(iv) <b>Power</b> = Pz Vc/60 = 1600 × 281.5/60 = 7506 W = <b>7.51 kW</b>.</li>
</ol>
<p class="note">If the paper means the feed force as Pxy = 800 N: μ = 0.297, τs = 285 MPa; Vf and power are unchanged.</p>`
  },
  {
    ids: ['2014-15_2c'],
    title: 'Mild steel: μ, β, chip velocity, τs (γ = 20°, φ = 60°, ξ = 3.5)',
    numerical: true,
    html: `
<p>D = 150 mm, N = 340 rpm, So = 0.24 mm/rev, t = 2.5 mm; Pz = 800 N, feed force Px = 400 N. Pxy = Px/sin φ.</p>
<ol class="steps">
<li>Pxy = 400/sin 60° = 461.9 N.</li>
<li>F = 800 sin 20° + 461.9 cos 20° = 273.6 + 434.0 = 707.6 N; N = 800 cos 20° − 461.9 sin 20° = 751.8 − 158.0 = 593.8 N; <b>μ = 1.19</b> (η = 50.0°).</li>
<li>tan β = cos 20°/(3.5 − sin 20°) = 0.93969/3.15798 = 0.29757, <b>β = 16.57°</b>.</li>
<li>Vc = π × 0.15 × 340 = 160.2 m/min; <b>chip velocity</b> Vf = 160.2/3.5 = <b>45.8 m/min</b>.</li>
<li>Ps = 800 cos 16.57° − 461.9 sin 16.57° = 766.9 − 131.8 = 635.0 N; As = 0.24 × 2.5/sin 16.57° = 2.104 mm²; <b>τs = 302 N/mm²</b>.</li>
</ol>
<p class="note">If the feed force is taken as Pxy = 400 N: μ = 1.056, τs = 310 MPa.</p>`
  },
  {
    ids: ['2013-14_2c'],
    title: 'Orthogonal turning with Pz = Pxy = Px = F = N and Pn = 2 Ps',
    numerical: true,
    html: `
<ol class="steps">
<li>Pz = Pxy, so R is at 45° to Pz: tan(η − γ) = Pxy/Pz = 1, η − γ = 45°.</li>
<li>F = N, so tan η = 1, η = 45°. Hence <b>γ = 0°</b>.</li>
<li>Px = Pxy sin φ = Pxy, so sin φ = 1, <b>φ = 90°</b> (truly orthogonal; Py = 0).</li>
<li>Pn = 2 Ps: tan(β + η − γ) = Pn/Ps = 2, so β + 45° = 63.43°, <b>β = 18.43°</b>.</li>
</ol>
<p><b>Sketch:</b> MCD with Pz and Pxy equal (R at 45° between them), the rake face vertical (γ = 0), F and N equal (R at 45° to the face), the shear plane at 18.4° to the horizontal with Pn twice Ps; all on one circle with R as diameter.</p>`
  },
  {
    ids: ['2012-13_2c'],
    title: 'SAE 133 steel rod: resultant, β, friction and power (γ = 20°, φ = 60°, ξ = 1.732)',
    numerical: true,
    html: `
<p>D = 200 mm, N = 650 rpm; Pz = 1000 N, axial force Px = 347 N. Pxy = Px/sin φ.</p>
<ol class="steps">
<li>Pxy = 347/sin 60° = 400.7 N (Py = 200.3 N).</li>
<li>(i) R = √(Pz² + Pxy²) = √(1000² + 400.7²) = <b>1077 N</b>, in the plane through Pz and Pxy at tan⁻¹(400.7/1000) = <b>21.8°</b> to the cutting direction (same as √(Pz² + Px² + Py²)).</li>
<li>(ii) tan β = cos 20°/(1.732 − sin 20°) = 0.93969/1.38998 = 0.67606, <b>β = 34.06°</b>.</li>
<li>(iii) F = 1000 sin 20° + 400.7 cos 20° = 342.0 + 376.5 = <b>718.5 N</b>; N = 939.7 − 137.0 = 802.7 N; μ = 0.895, <b>friction angle η = 41.8°</b>.</li>
<li>(iv) Vc = π × 0.2 × 650 = 408.4 m/min; <b>power</b> = 1000 × 408.4/60 = 6807 W = <b>6.81 kW</b>.</li>
</ol>`
  },
  {
    ids: ['2011-12_3c'],
    title: 'Px and Py for Pz = 800 N, ξ = 3.0, γ = 12°, φ = 60°, β + η − γ = 45°',
    numerical: true,
    html: `
<ol class="steps">
<li>tan β = cos 12°/(3.0 − sin 12°) = 0.97815/2.79209 = 0.35033, β = 19.31°.</li>
<li>β + (η − γ) = 45°, so η − γ = 25.69°.</li>
<li>Pxy = Pz tan(η − γ) = 800 × 0.48112 = 384.9 N.</li>
<li><b>Px</b> = Pxy sin 60° = <b>333.3 N</b>.</li>
<li><b>Py</b> = Pxy cos 60° = <b>192.4 N</b>.</li>
</ol>`
  },
  {
    ids: ['2009-10_4b'],
    title: 'Orthogonal test: μ, β and τs (γ = 20°, φ = 60°, t = 3 mm, So = 0.38 mm/rev)',
    numerical: true,
    html: `
<p>Data: a2 = 0.89 mm, feed force Px = 835 N, Pz = 1570 N. Pxy = Px/sin φ.</p>
<ol class="steps">
<li>Pxy = 835/sin 60° = 964.2 N.</li>
<li>F = 1570 sin 20° + 964.2 cos 20° = 537.0 + 906.0 = 1443.0 N; N = 1570 cos 20° − 964.2 sin 20° = 1475.3 − 329.8 = 1145.5 N.</li>
<li>(i) <b>μ = 1443.0/1145.5 = 1.26</b> (η = 51.6°).</li>
<li>a1 = 0.38 sin 60° = 0.3291 mm, ξ = 0.89/0.3291 = 2.704; tan β = 0.93969/(2.704 − 0.34202) = 0.39775.</li>
<li>(ii) <b>β = 21.69°</b>.</li>
<li>Ps = 1570 cos 21.69° − 964.2 sin 21.69° = 1459.2 − 356.5 = 1102.5 N; As = 0.38 × 3/sin 21.69° = 3.084 mm².</li>
<li>(iii) <b>τs = 1102.5/3.084 = 357 N/mm²</b>.</li>
</ol>
<p class="note">If the feed force is taken as Pxy = 835 N: μ = 1.11, τs = 373 MPa.</p>`
  },
  /* ============================================================ TOOL WEAR */
  {
    ids: ['2022-23_6b'],
    title: 'Variables affecting tool life; tool wear curve',
    numerical: false,
    html: `
<h4>(i) Variables affecting tool life</h4>
<ul>
<li>Cutting speed Vc, feed So, depth of cut t.</li>
<li>Work material hardness; tool material.</li>
<li>Shape and angles of the tool.</li>
<li>Type of cutting fluid and its method of application.</li>
</ul>
<h4>(ii) Flank wear vs machining time</h4>
${WEARCURVE}`
  },
  {
    ids: ['2018-19_4b', '2010-11_4b'],
    title: 'Abrasion, adhesion and diffusion wear; wear geometry; tool material properties',
    numerical: false,
    html: `${WEARMECH}
<h4>Geometry of wear</h4>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Crater wear</th><th>Flank wear</th></tr></thead>
<tbody>
<tr><td>Where</td><td>Rake face</td><td>Flank face near the edge</td></tr>
<tr><td>Cause</td><td>Chip sliding on the face</td><td>Rubbing on the new work surface</td></tr>
<tr><td>Mechanism</td><td>Diffusion mainly</td><td>Abrasion, plastic deformation</td></tr>
</tbody></table></div>
<p><b>Sketch:</b> side view of the tool tip: a cavity on the rake face behind the edge (crater, depth KT) and a flat wear land on the flank of width VB, with the cutting edge between.</p>
${TOOLPROP}`
  },
  {
    ids: ['2017-18_4c', '2011-12_4d'],
    title: 'Tool wear mechanisms; properties of a tool material',
    numerical: false,
    html: `${WEARMECH}${TOOLPROP}`
  },
  {
    ids: ['2014-15_2d'],
    title: 'Conditions that indicate tool failure; tool material properties',
    numerical: false,
    html: `
<h4>Tool failure</h4>
<ul>
<li><b>Fracture failure:</b> excessive force makes the tool break suddenly.</li>
<li><b>Temperature failure:</b> too high a temperature softens the tool point, which deforms and loses its edge.</li>
<li><b>Gradual wear:</b> crater and flank wear change the shape, wear accelerates and the tool finally fails.</li>
</ul>
<p>Indications while machining (beyond the slides): poor surface finish, loss of size, rising force and power, vibration or noise, bright wear-land marks, sparks and smoke, overheated chips.</p>
${TOOLPROP}`
  },
  {
    ids: ['2015-16_8c'],
    title: 'Features of wear of a turning tool',
    numerical: false,
    html: `
<p>Wear is gradual and occurs at the rake face (crater wear) and the flank (flank wear).</p>
<ul>
<li><b>Crater wear:</b> cavity on the rake face from the chip sliding on it.</li>
<li><b>Flank wear:</b> wear land on the relief face from rubbing against the machined surface.</li>
</ul>
<p><b>Sketch:</b> (a) side view of a turning tool: rake face with a crater at a distance from the edge, flank with a wear land of width VB; (b) plan view of the nose with the end-flank and side-flank wear lands.</p>
${WEARMECH}
<p>Effects: increased force, reduced accuracy, rougher surface, vibration, possible breakage.</p>`
  },
  {
    ids: ['2022-23_3c'],
    title: 'Machinability rating from two Taylor equations',
    numerical: true,
    html: `
<p>Base: v T<sup>0.28</sup> = 350. Test: v T<sup>0.27</sup> = 440. Compare at T = 60 min.</p>
<ol class="steps">
<li>Base: v60 = 350/60<sup>0.28</sup>. 60<sup>0.28</sup> = e<sup>0.28 × 4.0943</sup> = e<sup>1.1464</sup> = 3.147, so v60 = <b>111.2 m/min</b>.</li>
<li>Test: 60<sup>0.27</sup> = e<sup>0.27 × 4.0943</sup> = e<sup>1.1055</sup> = 3.021, so v60 = 440/3.021 = <b>145.7 m/min</b>.</li>
<li>Machinability rating = v60(test)/v60(base) × 100 = 145.66/111.22 × 100 = <b>131 %</b>.</li>
</ol>
${BEYOND}`
  },
  {
    ids: ['2017-18_8b'],
    title: 'Cost components of machining; cutting speed for minimum cost',
    numerical: false,
    html: ECON
  },
  {
    ids: ['2014-15_8a', '2010-11_8b'],
    title: 'Optimum cutting speed for minimum unit cost; effect of Taylor tool life model',
    numerical: false,
    html: ECON
  },
  {
    ids: ['2013-14_8c'],
    title: 'Effect of speed on cost; optimum cutting speed (worked example)',
    numerical: true,
    html: `${ECON}
<h4>Worked example (assumed data)</h4>
<p>No data are given in the question, so assume n = 0.25, C = 300 m/min, Co = 1 unit/min, Tt = 2 min, Ct = 2 units/edge; D = 50 mm, L = 200 mm, f = 0.2 mm/rev, Th = 3 min.</p>
<ol class="steps">
<li>V_opt = 300 × [0.25 × 1/(0.75 × (1 × 2 + 2))]<sup>0.25</sup> = 300 × (0.08333)<sup>0.25</sup> = 300 × 0.5373 = <b>161.2 m/min</b>.</li>
<li>T_opt = (0.75/0.25)(2 + 2/1) = <b>12 min</b>; check (300/161.2)<sup>4</sup> = 12.0.</li>
<li>Tm = πDL/(1000 f V) = π × 50 × 200/(1000 × 0.2 × 161.2) = 0.975 min.</li>
<li>Cost per piece = 3 + 0.975 + 4 × 0.975/12 = <b>4.30 units</b>.</li>
</ol>`
  },
  /* ============================================================ FINISHING */
  {
    ids: ['2013-14_5d'],
    title: 'Honing operation',
    numerical: false,
    html: `
<ul>
<li>Honing is an abrading operation mostly for finishing <b>round holes</b>.</li>
<li>Stones of common abrasive and bond (80–600 grit; sulfur, resin or wax added to the bond to modify the cutting action) are spaced equally round the tool and <b>expanded</b> by a cone or wedge inside the holder, controlled from the machine.</li>
<li>The tool is <b>rotated and reciprocated simultaneously</b>, which cuts a cross-hatch pattern; coolant is flushed.</li>
<li>Applications: automobile engine cylinders, gear bores, gun barrels, ring gauges.</li>
</ul>
<p><b>Sketch:</b> a bored hole in a work, a honing head with 4–6 stones, a cone expanding them, a rotation arrow and a reciprocation arrow.</p>`
  },
  {
    ids: ['2018-19_7a', '2015-16_4b'],
    title: 'Honing and super-finishing',
    numerical: false,
    html: `
<h4>Honing</h4>
<p>Abrading operation for round holes: stones (80–600 grit, sulfur, resin or wax added to the bond) equally spaced round the tool, expanded by a cone or wedge, tool rotated and reciprocated at the same time. Used for engine cylinders, gear bores, gun barrels and ring gauges.</p>
<h4>Super-finishing</h4>
<p>A variation of honing that uses:</p>
<ol>
<li>very light controlled pressure, 0.07–0.28 MPa;</li>
<li>rapid short strokes, over 400 per min and shorter than 6.35 mm;</li>
<li>a stroke path controlled so that a single grit never travels the same path twice;</li>
<li>copious low-viscosity lubricant-coolant flooded over the work.</li>
</ol>
<p>The film of lubricant separates stone and work once the minute peaks are cut, so the cutting stops (self-limiting); metal removal is under 0.05 mm, and every piece gets the same smoothness for a given pressure, lubricant and stone.</p>
<div class="table-wrap"><table class="cmp">
<thead><tr><th>Point</th><th>Honing</th><th>Super-finishing</th></tr></thead>
<tbody>
<tr><td>Pressure</td><td>Moderate</td><td>Very light (0.07–0.28 MPa)</td></tr>
<tr><td>Motion</td><td>Rotation plus reciprocation</td><td>Rapid short strokes</td></tr>
<tr><td>Fluid</td><td>Honing oil</td><td>Copious low-viscosity</td></tr>
<tr><td>Removal</td><td>Small</td><td>&lt; 0.05 mm, self-limiting</td></tr>
</tbody></table></div>
<p><b>Sketch:</b> honing head in a bore; second sketch: a rotating cylindrical work with a stone pressed on it, oscillating with a short stroke, coolant poured on.</p>`
  },
  {
    ids: ['2011-12_7d'],
    title: 'Super-finishing process in detail',
    numerical: false,
    html: `
<ol>
<li>A variation of honing for a very smooth, uniform surface.</li>
<li>Conditions: very light pressure 0.07–0.28 MPa; rapid short strokes (&gt; 400 per min, &lt; 6.35 mm); stroke path controlled so one grit never travels the same path twice; copious low-viscosity lubricant-coolant.</li>
<li><b>Action:</b> at first the minute peaks are cut at the stone pressure; as they are removed a continuous lubricant film builds up and keeps stone and work apart, so cutting stops by itself.</li>
<li>Metal removal is under 0.05 mm; the lubricant keeps the temperature uniform and washes away chips.</li>
<li>For a given pressure, lubricant and stone, each workpiece is finished to the same smoothness.</li>
</ol>
<p><b>Sketch:</b> a slowly rotating cylinder, a stone held by a spring-loaded holder oscillating along the axis, coolant nozzle.</p>`
  },
  {
    ids: ['2011-12_7c'],
    title: 'Why a plasticizer/modifier is used in the bond of honing sticks',
    numerical: false,
    html: `
<p>Sulfur, resin or wax are added to the bonding agent to <b>modify the cutting action</b> of the stone.</p>
<ul>
<li>They fill the pores of the stone and act as a solid lubricant, reducing friction and heat in the cut.</li>
<li>The stone cuts more smoothly and does not clog (load) or glaze, which gives a finer finish and a longer stone life.</li>
<li>They make the bond less brittle, so the grains are released at a controlled rate.</li>
</ul>
${BEYOND}`
  }
];
