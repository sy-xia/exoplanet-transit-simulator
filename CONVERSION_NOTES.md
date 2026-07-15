# Conversion Notes — Exoplanet Transit Simulator (transitSimulator017)

## Behavior model

The sim models a single extrasolar planet on a (possibly eccentric) orbit around a
main-sequence star. Seven sliders set the system: planet mass (M_jup), planet radius
(R_jup), semimajor axis (AU), eccentricity, star mass (M_sun), inclination (°) and
longitude of the line of sight (°). Star mass alone determines luminosity
(mass-luminosity broken power law), effective temperature (7-segment log-log
polynomial), radius (Stefan-Boltzmann) and spectral type (interpolated lookup
table). From the geometry, the code finds whether/when the planet eclipses the star
by root-finding the projected-separation function over true anomaly (an
inverse-quadratic-interpolation/bisection hybrid), yielding eclipse start / end /
max-depth phases, the orbital period (Kepler's third law, G = 6.673e-11) and the
eclipse duration. The lightcurve panel plots normalized visual flux versus phase,
zoomed on the "eclipse of body 1" window with 15 % margins on each side; flux in
eclipse comes from a circle-overlap (lens area) model weighted by each body's
surface brightness (T^4 with a bolometric correction polynomial). A red draggable
phase cursor selects the phase displayed in the transit-view panel, where the star
(color from a temperature→RGB polynomial, radial highlight shading) sits at center
with the planet positioned by solving Kepler's equation and projecting through the
inclination/longitude rotation at 9e-8 px per meter, an orbit path across the
plotted window, and a small arrow marking planets under 3 px radius. Optional
simulated measurements add Box-Muller Gaussian noise to randomly-phased samples;
their noise and number sliders are enabled only while measurements are shown
(otherwise flux noise is pinned to 0.00001, which also tightens the plot's y-scale
margins). Eleven presets (Options A/B plus nine real systems) can be loaded via a
combo box and "set" button; Reset restores the exact startup state (0.657 M_jup,
1.32 R_jup, 0.047 AU, e 0, 1.09 M_sun, i 86.929°, longitude 0°, noise 0.1,
number 50, phase 0.5, curve shown, measurements hidden).

## AS → HTML5 mapping

| Decompiled source | HTML5 location |
| --- | --- |
| `DefineSprite_214/frame_1/DoAction.as` (star physics, spectral tables) | `simulation.js` — star physics section (verbatim constants) |
| `DefineSprite_214/frame_1/DoAction_2.as` (presetsList) | `simulation.js` — `presetsList` (verbatim) |
| `DefineSprite_214/frame_1/DoAction_3.as` (controller, formatting, reset) | `simulation.js` — main controller (verbatim flow & strings) |
| `Lightcurve Component II.as` | `simulation.js` — `lightcurve` object (verbatim math; canvas draw) |
| `Transit Visualization.as` | `simulation.js` — `visualization` object (verbatim math; canvas draw) |
| `Slider Logic Class v6.as` | `simulation.js` — `SliderLogic` (verbatim port) |
| `Standard Slider v6.as` | `simulation.js` — `SimSlider` custom accessible component (same drag-offset math, bar hold-repeat 500 ms delay / 0.05 ticks-per-ms, arrow keys = 1 value tick, field commit on Enter/blur) |
| `Number Functions.as` (toFixed polyfill, toSigDigits) | `simulation.js` — `asToFixed`, `toSigDigits` (verbatim, so all on-screen numbers match) |
| `Title Bar.as`, `Dialog Window v2.as`, About/Help sprites | Replaced by `<kl-unl-masthead>` per KL-UNL rules (no self-built masthead/dialog/reset) |
| FCheckBox / FPushButton / FComboBox framework | Native `<input type="checkbox">`, `<button>`, `<select>` (observable behavior only) |
| `on(initialize)` clip actions (slider ranges, panel titles, colors) | Slider configs in `buildSliders()`; panel headings in `index.html` (verbatim text) |

Stage geometry preserved: lightcurve plot 400 × 220 px, transit view 350 × 350 px
(scale 9e-8 px/m). Canvases keep these internal coordinates and are scaled by CSS
only; pointer input is mapped back through the current scale. The eclipse-duration
arrow (shape 209) spans 70 % of the plot canvas, centered — its ends land at 15 %
and 85 % of the canvas width, which is exactly where the plotted eclipse begins and
ends (the "eclipse of body 1" view always uses 15 % horizontal margins), so the
arrow lines up with the dip in the curve. It is laid out in the same CSS grid column
as the canvas so this alignment holds at every width and zoom level.

## contents.json

- The foundation's `contents.json` **already contains a `transitsimulator` entry**
  whose Help/About text derives from the original sim's Help (`texts/21.txt`) and
  About (`texts/3/5/8/9.txt`) material, so no new entry was added.
  `index.html` uses `sim-id="transitsimulator"`.
- **Necessary repairs (please review and apply upstream):** the shipped
  `foundation/contents.json` is not valid JSON — strict `JSON.parse` (used by the
  masthead's `fetch().json()`) throws, which breaks the masthead for **every**
  sim. The copy at `html5/foundation/contents.json` received the following
  minimal syntax-only fixes (verified against a browser JSON parser afterwards;
  no entry content was reworded). Line numbers refer to the original file:
  1. `renaissancePtolemaic` (line 1207): unescaped quotes in
     `<a href="../venusphases">` → escaped (`\"`).
  2. `venusphases` (line 1798): unescaped quotes in
     `<a href="../ptolemaic">` → escaped (`\"`).
  3. `ce_hc` (lines 200–201), `eclipsingbinarysim` (lines 439–440),
     `meltednail` (lines 916–917), and `positionsdemonstrator` (lines 1155–1156):
     a help/about string was broken across two physical lines (a raw newline is
     illegal inside a JSON string) → the two lines were joined.
  4. `pulsarPeriodSim001` (line 1220): a literal tab character inside the help
     string → removed.
  The upstream/shared source file needs the same fixes. (Side effect of the
  rewrite: the file's mixed line endings were normalized to CRLF — whitespace
  between JSON tokens only, no effect on any parsed content.)
- All other foundation files are byte-for-byte identical to the originals
  (verified by hash).

## Assets reused vs code-drawn

- **Reused as-is** (copied to `html5/assets/shapes/`):
  - `171.svg` — white "tiny planet" pointer arrow, drawn onto the visualization
    canvas with `drawImage` at the original placement (tip 5 px below the planet).
  - `209.svg` — eclipse-duration double arrow under the lightcurve (as `<img>`).
- The runtime now makes **no third-party requests at all** (MathJax removed); the
  only runtime fetch is the local `foundation/contents.json`.
- **Code-drawn** (as in the original ActionScript): star/planet disks + radial
  shading gradients, orbit path, lightcurve, measurement dots, phase cursor,
  plot background/border/tick marks — all built at runtime via
  `createEmptyMovieClip`/drawing calls in the source, so they are recreated with
  canvas 2D using the same coordinates, radii, colors and alphas.
- Shape `208.svg` (a plain 1 px #cccccc vertical separator before "eclipse depth:")
  is reproduced with a CSS border; `173.svg` (title-bar background) is superseded
  by the masthead. Exported Verdana font subsets were not embedded; text uses the
  foundation's sans-serif stack (per instruction to keep sans-serif fonts).

## Math rendering (no MathJax needed)

This sim contains **no equations** — the only "math" in the UI is the unit
annotations on the sliders (M_jup, R_jup, M_sun, AU, °). The original Flash drew
these as plain text with `<sub>` tags, not as typeset mathematics, and the port
reproduces them the same way: HTML with real `<sub>` subscripts in the page's
sans-serif font. This is the closest match to the original and keeps them visually
consistent with every other UI label (a hard requirement from the supervisor —
MathJax always substitutes its own font and cannot match the page's Arial/Helvetica,
so it was **not** used and the previously-vendored MathJax build was removed).

Consequence for the pipeline's "all math via MathJax / right-click shows the MathJax
menu" rule (8a): with no equations present, there is nothing for MathJax to typeset,
so the unit labels are HTML instead. This is a deliberate, supervisor-directed
deviation. It does **not** regress screen-reader accessibility — the full spoken
unit ("Jupiter masses", "solar masses", "degrees", "astronomical units") is carried
by each slider's `aria-label` and `aria-valuetext`, independent of any visual
rendering (see ACCESSIBILITY.md). The foundation's `kl-unl.js` equation helper is
left in place unused, so any future equation need can still use the pipeline path.

Plain decimal readouts and axis tick numbers (e.g. "0.985", "0.0159") contain no
mathematical notation and are regular HTML text; the y-axis tick labels live in HTML
(not canvas) so they scale with browser zoom. The phrase "1.1 Rsun" in the star
description is kept verbatim as prose, exactly as the original displayed it.

## Deviations from the original (all deliberate)

1. **Chrome**: Flash title bar, About/Help dialogs and Reset link are replaced by
   the KL-UNL masthead component (required). Panel chrome uses KL-UNL classes, not
   the Flash pixel layout/palette.
2. **Colors remapped for WCAG 1.4.11 contrast** (details in ACCESSIBILITY.md):
   theoretical curve 0x6699FF → #5588EE; phase cursor 0xEE9090/0xFF5050 →
   #C05050/#E03030; measurement dots 0x999999 → #767676; orbit-path alpha 50 % → 70 %.
3. **Sliders** gain Page Up/Down (10 ticks) and Home/End keys beyond the original's
   Left/Right — an accessibility requirement; Left/Right still move exactly one
   original value tick.
4. **Slider field blur**: the original reverted a typed value if the pointer was
   over the slider bar when focus left the field; the port always commits on
   Enter/blur (invalid input resyncs the display). Practical behavior is identical.
5. `checkForOvercontact` result was assigned via a misspelled call
   (`checkForOvercontant`) in the source, so `systemIsInOvercontact` was always
   undefined and unused; it is not ported. Likewise `initializeHorizontalScale()`
   is called in the source but never defined (no x-axis tickmarks ever render in
   this sim's "eclipse of body 1" mode) — reproduced by simply having no x ticks.
6. **Measurements with odd counts**: the AS Box-Muller loop wrote noise to a
   nonexistent array slot when `number` was odd (silently ignored by AS1); the port
   guards that index, producing the same visible result without a crash.
7. The original regenerates the random measurement set on every parameter update;
   the port does the same (measurements visibly re-scatter, as in Flash).
8. **Star description line breaks**: the original hard-wrapped the "a main sequence
   star of this mass …" text onto four fixed lines (via `\n`). The port keeps the
   text characters verbatim in the source but renders with `white-space: normal`,
   so it flows and wraps to the panel width instead of using the forced breaks.
   Text content is unchanged; only line wrapping differs.

## Layout vs the screenshot (Goal C)

Panel arrangement, grouping and reading order follow `Capture.PNG`: transit view
(top left) with Presets beneath it, lightcurve with its controls and eclipse-depth
readout (top right), and Planet Properties / Star Properties / System Orientation
and Phase across the bottom. Within the KL-UNL shell, spacing/typography follow the
foundation, and the layout stacks to a single column on narrow screens instead of
preserving the fixed 920 × 650 stage.
