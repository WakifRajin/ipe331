// MCQs and flashcards for Naimul Sir's part (chapters 'cutting' and 'finishing'). `slide` = lecture page number.

const counters = {};
let total = 0;
function mc(chapter, q, correct, wrong, why, slide) {
  counters[chapter] = (counters[chapter] || 0) + 1;
  const n = ++total;
  const pos = (n * 3 + 2) % 4;
  const options = wrong.slice();
  options.splice(pos, 0, correct);
  return { id: `${chapter}-nmcq-${String(counters[chapter]).padStart(2, '0')}`, chapter, q, options, answer: pos, why, slide };
}

export const MCQ_NAIMUL = [
  mc('cutting', 'In orthogonal cutting the cutting edge is', 'At 90° to the direction of feed', ['Inclined at an acute angle to the feed', 'Parallel to the feed', 'Always rounded'], 'Orthogonal (2-D) cutting has λ = 0; the chip flows normal to the edge.', 7),
  mc('cutting', 'The number of mutually perpendicular force components in oblique cutting is', 'Three', ['One', 'Two', 'Four'], 'Oblique cutting is 3-D: Px, Py, Pz. Orthogonal has two.', 8),
  mc('cutting', 'Compared with orthogonal cutting, tool life in oblique cutting is', 'Higher', ['Lower', 'Identical', 'Zero'], 'The shear force acts on a larger area, so shear stress per unit area is smaller.', 8),
  mc('cutting', 'Which is a multi-point cutting tool?', 'Milling cutter', ['Lathe tool', 'Shaper tool', 'Planer tool'], 'Drills, milling cutters, broaches and grinding wheels have more than one edge.', 10),
  mc('cutting', 'The surface of the tool along which the chip flows is the', 'Face (rake surface)', ['Flank', 'Shank', 'Nose'], 'Flank surfaces face the workpiece.', 13),
  mc('cutting', 'The recommended value of the side cutting edge (lead) angle is', '15° to 30°', ['0° to 5°', '45° to 60°', '75° to 90°'], 'Too large a SCEA causes vibration; 0° gives shock at entry.', 15),
  mc('cutting', 'The end cutting edge angle is provided to', 'Prevent rubbing of the end edge on the machined surface', ['Increase tool life by rubbing', 'Direct the chip', 'Clamp the insert'], 'Typically 8° to 15°.', 16),
  mc('cutting', 'The usual range of side and end relief angles is', '5° to 15°', ['0° to 2°', '20° to 30°', '40° to 50°'], 'Relief prevents flank rubbing; too much weakens the edge.', 17),
  mc('cutting', 'The reference plane πR is perpendicular to', 'The cutting velocity Vc', ['The feed direction only', 'The cutting edge', 'The tool axis'], 'πx and πy are perpendicular to πR; πc contains the principal cutting edge.', 24),
  mc('cutting', 'The plane perpendicular to the principal cutting edge is the', 'Normal plane πn', ['Orthogonal plane πo', 'Reference plane πR', 'Machine transverse plane πy'], 'πo is perpendicular to both πR and πc.', 24),
  mc('cutting', 'In the ASA system the reference planes are chosen from the', 'Machine tool axes', ['Cutting tool geometry', 'Workpiece shape', 'Chip direction'], 'In ORS they are taken with respect to the cutting tool configuration.', 23),
  mc('cutting', 'tan γo = tan γx sin φ + tan γy cos φ converts rake angles from', 'ASA to ORS', ['ORS to ASA', 'ORS to NRS', 'ASA to WRS'], 'The inverse is tan γx = tan γo sin φ − tan λ cos φ.', 24),
  mc('cutting', 'The maximum rake satisfies', 'tan γm = √(tan²γo + tan²λ)', ['tan γm = tan γo + tan λ', 'γm = γo + λ', 'tan γm = tan γo / tan λ'], 'It is the length of the steepest-slope vector and does not depend on φ.', 24),
  mc('cutting', 'Chip reduction coefficient ξ is defined as', 'a2/a1', ['a1/a2', 'β/γ', 'Vc/Vs'], 'ξ > 1; the inverse is the cutting ratio rc.', 41),
  mc('cutting', 'Shear angle in orthogonal cutting is given by', 'tan β = cos γ / (ξ − sin γ)', ['tan β = sin γ / (ξ − cos γ)', 'tan β = ξ cos γ', 'β = γ/ξ'], 'From ξ = cos(β − γ)/sin β.', 42),
  mc('cutting', 'A discontinuous chip is typically formed when machining', 'Brittle materials such as cast iron', ['Ductile aluminium at high speed', 'Titanium at high speed', 'Soft copper with a sharp tool only'], 'Repeated fracture limits deformation.', 38),
  mc('cutting', 'A serrated chip is most associated with', 'Titanium alloys and austenitic stainless steels', ['Cast iron', 'Brass', 'Wood'], 'Cyclic high and low shear strain gives a saw-tooth chip.', 39),
  mc('cutting', 'A built-up edge gives', 'Poor surface finish but some protection of the edge', ['Excellent finish', 'Zero friction', 'Discontinuous chips only'], 'It is generally undesirable.', 39),
  mc('cutting', 'The chip velocity Vf equals', 'Vc / ξ', ['Vc ξ', 'Vc cos γ', 'Vs / ξ'], 'Vf = Vc sin β / cos(β − γ) = Vc/ξ.', 44),
  mc('cutting', 'The shear velocity is', 'Vs = Vc cos γ / cos(β − γ)', ['Vs = Vc sin β', 'Vs = Vc/ξ', 'Vs = Vc tan γ'], 'From the velocity triangle by the sine rule.', 44),
  mc('cutting', 'Kronenberg\'s expression for the chip reduction coefficient is', 'ξ = e^{μ(π/2 − γ)}', ['ξ = μ tan γ', 'ξ = e^{μγ}', 'ξ = cos γ/μ'], 'ξ rises with friction and falls with rake.', 45),
  mc('cutting', 'The force Pz acts', 'In the direction of the cutting velocity', ['Along the feed', 'Perpendicular to the machined surface', 'Along the shear plane'], 'Px is the feed force and Py the thrust force.', 49),
  mc('cutting', 'The resultant of Px and Py is Pxy, and Px equals', 'Pxy sin φ', ['Pxy cos φ', 'Pxy tan φ', 'Pxy/φ'], 'Py = Pxy cos φ.', 50),
  mc('cutting', 'The friction force on the rake face is', 'F = Pz sin γ + Pxy cos γ', ['F = Pz cos γ − Pxy sin γ', 'F = Pz tan γ', 'F = Pxy/Pz'], 'N = Pz cos γ − Pxy sin γ.', 52),
  mc('cutting', 'The shear force along the shear plane is', 'Ps = Pz cos β − Pxy sin β', ['Ps = Pz sin β + Pxy cos β', 'Ps = F cos β', 'Ps = N tan β'], 'The latter expression is Pn.', 52),
  mc('cutting', 'The coefficient of friction in the MCD is', 'μ = tan η = F/N', ['μ = N/F', 'μ = sin η', 'μ = Ps/Pn'], 'η is the mean friction angle on the rake face.', 52),
  mc('cutting', 'The shear plane area in turning is As =', 'So t / sin β', ['So t sin β', 'So t cos β', 'So sin β / t'], 'a1 b1 / sin β with a1 b1 = So t.', 53),
  mc('cutting', 'Merchant\'s relation for the shear angle is', '2β + η − γ = π/2', ['β + η + γ = π/2', 'β = η − γ', 'β + η = π'], 'Obtained by minimising Pz with respect to β.', 54),
  mc('cutting', 'With Merchant\'s relation the cutting force becomes', 'Pz = 2 τs So t cot β', ['Pz = τs So t tan β', 'Pz = τs So t / 2', 'Pz = 2 τs So t tan β'], 'Using cos(η − γ) = 2 sin β cos β and cos(β + η − γ) = sin β.', 54),
  mc('cutting', 'Cutting power in turning (Pz in N, Vc in m/min) in watts is', 'Pz Vc / 60', ['Pz Vc × 60', 'Pz / Vc', 'Px Vc / 60'], 'The feed force does negligible work.', 48),
  mc('cutting', 'Crater wear occurs on the', 'Rake face', ['Flank face', 'Shank', 'Workpiece only'], 'Flank wear occurs on the relief face.', 59),
  mc('cutting', 'Diffusion is believed to be the principal mechanism of', 'Crater wear', ['Flank wear', 'Fracture failure', 'Chip breaking'], 'Diffusion is strongly temperature dependent.', 64),
  mc('cutting', 'Plastic deformation of the edge contributes mainly to', 'Flank wear', ['Crater wear', 'Fracture', 'BUE'], 'Abrasion is also a significant cause of flank wear.', 65),
  mc('cutting', 'High-speed steel retains its cutting ability up to about', '600 °C', ['200 °C', '1000 °C', '100 °C'], 'Carbon tool steel is poor above 200 °C.', 67),
  mc('cutting', 'The typical n for carbide tools in Taylor\'s equation is', '0.2 to 0.5', ['0.08 to 0.2', '0.5 to 0.7', '1.0 to 2.0'], 'HSS: 0.08–0.2; ceramics: 0.5–0.7.', 75),
  mc('cutting', 'In the tool wear curve the region of rapidly accelerating wear is the', 'Failure region', ['Break-in period', 'Steady-state region', 'Initial region'], 'It ends in temperature failure.', 73),
  mc('cutting', 'In V T^n = C the constant C is', 'The cutting speed for T = 1 min', ['The tool life at V = 1', 'The tool cost', 'The slope of the log-log line'], 'The slope of the log-log line is −n.', 75),
  mc('cutting', 'The cutting fluid with the best lubrication but poorest cooling is', 'Straight oil', ['Soluble oil', 'Semi-synthetic fluid', 'Synthetic fluid'], 'Synthetic fluids often give the best cooling.', 79),
  mc('cutting', 'The usual concentration of soluble oil and synthetic fluids in water is', '3 to 10 %', ['30 to 50 %', '0.01 %', '90 %'], 'Soluble oils are the least expensive.', 79),
  mc('cutting', 'Ceramic tools need', 'Dry cutting or constant profuse fluid', ['Frequent interrupted cuts', 'Low hot hardness', 'Only hand grinding'], 'They are poor for interrupted cutting.', 67),
  mc('cutting', 'The speed that minimises cost per piece, compared with the speed for maximum production rate, is', 'Lower', ['Higher', 'The same', 'Always C'], 'Tool cost is included in the cost speed (beyond the slides).', 74),
  mc('finishing', 'Which is a precision finishing process?', 'Lapping', ['Buffing', 'Tumbling', 'Power brushing'], 'Precision: grinding, lapping, honing, super-finishing.', 85),
  mc('finishing', 'Lap material is usually', 'Cast iron or copper, softer than the work', ['Harder than the work', 'Diamond', 'Rubber only'], 'Abrasive is charged into the lap.', 87),
  mc('finishing', 'Material removed in lapping is typically less than', '0.025 mm', ['2.5 mm', '5 mm', '1 mm'], 'Lapping is slow.', 87),
  mc('finishing', 'Honing is mostly used to finish', 'Round holes', ['Flat plates', 'Gear teeth', 'Threads'], 'Stones are expanded by a cone and the tool rotates and reciprocates.', 89),
  mc('finishing', 'Super-finishing uses a pressure of about', '0.07 to 0.28 MPa', ['7 to 28 MPa', '70 to 280 MPa', '0 MPa'], 'Light pressure and over 400 short strokes per min.', 90),
  mc('finishing', 'In super-finishing a single grit', 'Never travels the same path twice', ['Travels in a straight line only', 'Is replaced each stroke', 'Is not used'], 'The stroke path is controlled.', 90),
  mc('finishing', 'Tumbling is carried out by', 'Rotating work with abrasive media in a barrel for 1 to 10 h', ['Cloth wheels at high speed', 'Reciprocating stones in a hole', 'A copper lap'], 'It deburrs and cleans.', 95),
  mc('finishing', 'Buffing uses', 'A cloth wheel charged with very fine abrasive', ['A bonded grinding wheel', 'A copper lap', 'A wire brush only'], 'It removes minute amounts and fine scratches.', 93),
  mc('finishing', 'Which is NOT a non-precision finishing process?', 'Honing', ['Polishing', 'Power brushing', 'Tumbling'], 'Honing is a precision process.', 85),
  mc('finishing', 'Sulfur, resin or wax in honing stones', 'Modify the cutting action', ['Increase hardness only', 'Replace the abrasive', 'Cool the machine'], 'They are added to the bond.', 89)
];

// ---------------------------------------------------------------- flashcards
let cardN = 0;
const card = (chapter, front, back, slide) => ({ id: `card-n${String(++cardN).padStart(3, '0')}`, chapter, front, back, slide });

export const CARDS_NAIMUL = [
  card('cutting', 'Orthogonal cutting', 'Edge at 90° to the feed, λ = 0, chip normal to the edge, 2-D, two force components, shorter tool life.', 7),
  card('cutting', 'Oblique cutting', 'Edge inclined by λ, chip at an angle to the normal to the edge, 3-D, three force components, longer tool life.', 8),
  card('cutting', 'Single-point vs multi-point tool', 'One edge: lathe, shaper, planer tools. More than one: drills, milling cutters, broaches, grinding wheels.', 10),
  card('cutting', 'Tool elements', 'Face (rake), flank, principal edge, auxiliary edge, corner or nose.', 13),
  card('cutting', 'SCEA φs', 'Side cutting edge (lead) angle; recommended 15–30°.', 15),
  card('cutting', 'ECEA φe', 'End cutting edge angle stops rubbing of the end edge; 8–15°.', 16),
  card('cutting', 'Relief and rake angles', 'Relief 5–15° prevents flank rubbing; rake 0–15° directs the chip (positive, negative or zero).', 17),
  card('cutting', 'Reference planes', 'πR ⟂ Vc; πx along feed; πy cross-feed; πc contains the edge; πo ⟂ πR and πc; πn ⟂ the edge.', 24),
  card('cutting', 'ASA to ORS', 'tan γo = tan γx sin φ + tan γy cos φ; tan λ = −tan γx cos φ + tan γy sin φ.', 24),
  card('cutting', 'ORS to ASA', 'tan γx = tan γo sin φ − tan λ cos φ; tan γy = tan γo cos φ + tan λ sin φ.', 24),
  card('cutting', 'Maximum rake', 'tan γm = √(tan²γo + tan²λ) = √(tan²γx + tan²γy).', 24),
  card('cutting', 'Notation for chip formation', 'a1 uncut thickness = So sin φ, a2 chip thickness, b1 = t/sin φ, β shear angle, γ rake.', 34),
  card('cutting', 'Actual chip formation', 'Shear in a zone, not a plane; secondary shear in the chip from friction on the rake face.', 36),
  card('cutting', 'Four chip types', 'Discontinuous, continuous, continuous with BUE, serrated.', 38),
  card('cutting', 'Chip reduction coefficient', 'ξ = a2/a1 = cos(β − γ)/sin β; inverse is the cutting ratio rc.', 41),
  card('cutting', 'Shear angle', 'tan β = cos γ / (ξ − sin γ).', 42),
  card('cutting', 'Velocity relations', 'Vf = Vc/ξ = Vc sin β/cos(β − γ); Vs = Vc cos γ/cos(β − γ).', 44),
  card('cutting', 'Kronenberg', 'ξ = e^{μ(π/2 − γ)}.', 45),
  card('cutting', 'Forces in turning', 'Pz cutting, Px feed, Py thrust; Px = Pxy sin φ, Py = Pxy cos φ.', 49),
  card('cutting', 'MCD on the rake face', 'F = Pz sin γ + Pxy cos γ; N = Pz cos γ − Pxy sin γ; μ = tan η = F/N.', 52),
  card('cutting', 'MCD on the shear plane', 'Ps = Pz cos β − Pxy sin β; Pn = Pz sin β + Pxy cos β; τs = Ps/As, As = So t/sin β.', 52),
  card('cutting', 'Merchant relation', '2β + η − γ = π/2, giving Pz = 2 τs So t cot β.', 54),
  card('cutting', 'Three failure modes', 'Fracture, temperature, gradual wear.', 58),
  card('cutting', 'Crater vs flank wear', 'Crater: cavity on the rake face (diffusion). Flank: wear land on the relief face (abrasion, plastic deformation).', 60),
  card('cutting', 'Effects of tool wear', 'Higher force, lower accuracy, rougher surface, vibration, possible breakage.', 63),
  card('cutting', 'Wear mechanisms', 'Abrasion, adhesion, diffusion, chemical reaction, plastic deformation.', 64),
  card('cutting', 'Tool materials', 'Carbon steel to 200 °C; HSS to 600 °C; carbide by powder metallurgy; ceramics high hot hardness, not for interrupted cuts.', 67),
  card('cutting', 'Tool life curve', 'Break-in, steady-state, failure region.', 73),
  card('cutting', 'Taylor equation', 'Vc T^n = C; n: HSS 0.08–0.2, cast alloys 0.1–0.15, carbide 0.2–0.5, ceramic 0.5–0.7.', 75),
  card('cutting', 'Four cutting fluids', 'Straight oil (best lubrication), soluble oil (cheapest), semi-synthetic, synthetic (best cooling).', 78),
  card('cutting', 'Optimum speed for minimum cost', 'V_opt = C [n Co/((1 − n)(Co Tt + Ct))]^n, T_opt = ((1 − n)/n)(Tt + Ct/Co).', 74),
  card('finishing', 'Precision vs non-precision finishing', 'Precision: grinding, lapping, honing, super-finishing. Non-precision: polishing, buffing, power brushing, tumbling.', 85),
  card('finishing', 'Lapping', 'Soft lap charged with abrasive in a vehicle; removes under 0.025 mm; gauge blocks, seals.', 87),
  card('finishing', 'Honing', 'Rotating and reciprocating expanded stones (80–600 grit) finish round holes: cylinders, gun barrels.', 89),
  card('finishing', 'Super-finishing', 'Honing variant: 0.07–0.28 MPa, over 400 strokes/min under 6.35 mm, flooded lubricant, under 0.05 mm removal.', 90),
  card('finishing', 'Polishing vs buffing', 'Polishing removes scratches and defects with an abrasive-glued wheel; buffing removes fine scratches with a cloth wheel and fine abrasive.', 93),
  card('finishing', 'Power brushing and tumbling', 'Brushing: high-speed brushes remove burrs and fins. Tumbling: barrel with media, 1–10 h, bulk deburring and cleaning.', 95)
];
