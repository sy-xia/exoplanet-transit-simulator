# Accessibility Notes — Exoplanet Transit Simulator

Target: WCAG 2.1 AA (ADA Title II). Built on the KL-UNL foundation
(`kl-unl.css` palette/focus styles, `<kl-unl-masthead>` for title, Reset, Help,
About with managed dialog focus and Escape handling).

> **Human screen-reader QA is still required.** The affordances below were built
> and reasoned against NVDA (Windows / Chrome + Firefox) and VoiceOver
> (macOS / Safari + Chrome) behavior, but nothing replaces a live pass with both.

## Structure & semantics

- One `<h1>` (rendered by the masthead). Panels are `<section>`s with `<h2>`
  headings; visually chrome-less panels (transit view, lightcurve) get `.sr-only`
  headings ("Transit View", "Lightcurve") so the outline stays complete.
- `<main>` landmark wraps the sim; the masthead supplies the header/nav.
- Every input has a real `<label>` (the preset `<select>` uses an `.sr-only`
  label "Preset system"); `<html lang="en">`.

## Keyboard map

| Control | Keys |
| --- | --- |
| All nine sliders (custom component, `role="slider"`) | Tab to focus thumb; ←/↓ −1 value tick, →/↑ +1 tick (identical increments to the Flash slider), PageDown/PageUp ±10 ticks, Home/End min/max. Numeric field: type + Enter (or blur) to commit. |
| Lightcurve phase cursor (draggable red line) | In tab order as `role="slider"` ("Lightcurve phase cursor"); click/tap also focuses it. ←/↓ −0.01, →/↑ +0.01, PageUp/Down ±0.1, Home/End ends of the plotted window. Same state as the "phase:" slider. |
| Checkboxes, preset select, set button, masthead buttons | Native semantics. |

No keyboard traps; Tab always moves away. Focus rings come from the foundation's
`:focus-visible` styles. Pointer paths (thumb drag with original offset math, bar
press-and-hold auto-repeat, cursor drag) mutate the same state as the keyboard.

## Units are always spoken with values

- Slider thumbs carry `aria-valuetext` = formatted value + unit words, e.g.
  "0.657 Jupiter masses", "86.929 degrees", "0.0470 astronomical units";
  `aria-label` names the quantity ("Planet mass in Jupiter masses"). Unit symbols
  shown visually (MathJax M_jup, R_jup, M_sun, °) are `aria-hidden` so screen
  readers get the spelled-out words instead of a mis-read glyph.
- Numeric fields have matching `aria-label`s ("Planet mass in Jupiter masses").
- The phase cursor announces "Phase 0.50".

## Live region

A single `aria-live="polite"` region announces on **commit** (drag release, key
pause, field commit — never per tick):

- Slider commits: "Planet radius 1.35 Jupiter radii. Eclipse takes 3.01 hours of
  3.56 day orbit. Eclipse depth 0.0166."
- Checkbox toggles: "Simulated measurements shown. Noise and number sliders
  enabled."
- Preset: "Preset 6. HD 209458 b applied. Eclipse takes …"
- Reset: "Simulation reset to its initial state. …"

Wording mirrors the on-screen "eclipse takes … of … orbit" text.

## Diagram text equivalents (1.1.1)

- The transit-view canvas has a continuously updated `.sr-only` description
  (star summary — spectral type, temperature in kelvin, radius in solar radii —
  and whether the planet is currently on the star's disk), refreshed from the
  same render pass as the canvas.
- The lightcurve's key readouts are real HTML text (eclipse duration sentence,
  eclipse depth), not canvas pixels. The eclipse-duration arrow image is
  decorative (`alt=""`); its meaning is carried by the adjacent sentence.

## Color & contrast (1.4.1 / 1.4.3 / 1.4.11)

Text uses the foundation palette (≥ 4.5:1). Graphics remapped from the Flash
originals to reach ≥ 3:1 against their backgrounds:

| Element | Original | Shipped | Contrast vs background |
| --- | --- | --- | --- |
| Theoretical curve | #6699FF | #5588EE | ≈ 3.4:1 on white |
| Phase cursor (normal) | #EE9090 | #C05050 | ≈ 4.6:1 on white |
| Phase cursor (hover/drag) | #FF5050 | #E03030 | ≈ 3.9:1 on white |
| Measurement dots | #999999 | #767676 | ≈ 4.3:1 on white |
| Orbit path | #999999 @ 50 % on black | same @ 70 % | ≥ 3:1 on black |

No state is signaled by color alone: the curve and measurements have labeled
checkboxes, the cursor position is mirrored by the "phase:" slider value and the
live region, disabled sliders are also non-focusable with `aria-disabled`, and the
eclipse presence/absence is stated in text ("(no eclipse)").

## Zoom, reflow, touch (1.4.4 / 1.4.10 / 2.5.5)

- Sim body text ≥ 1.125rem, all sizing in rem/%, no fixed-px container widths.
- Canvases keep their original internal coordinates and scale via CSS with
  preserved aspect ratio; y-axis tick labels and axis title are HTML, so they
  grow with browser zoom instead of scaling with the bitmap.
- Layout reflows: two columns → single column below the foundation's 56rem
  breakpoint → compact phone-portrait layout below 34rem (no horizontal scroll).
- Slider tracks are 2.75rem tall (≥ 44 px); `touch-action: none` on draggables
  only (slider tracks, plot cursor), so page scrolling elsewhere is unaffected.
  Pointer Events give mouse/touch/pen one code path (works on iOS Safari).

## Motion (2.2.2 / 2.3.3)

The simulation has **no autonomous animation** — every visual change is a direct,
single-step response to a user action, so no Pause control is required and
`prefers-reduced-motion` needs no special casing. Nothing flashes.

## Unit labels

The sim has no equations. Unit annotations (M_jup, R_jup, M_sun, AU, °) are HTML
with real `<sub>` subscripts in the page font (matching the surrounding UI, as the
original Flash did), and are `aria-hidden` because they are decorative duplicates of
the spoken unit. The **spoken** unit always comes from each slider's `aria-label`
and `aria-valuetext` word forms ("Jupiter masses", "solar masses", "astronomical
units", "degrees") — so a screen-reader user hears the complete quantity + value +
unit regardless of how the glyph is drawn. Plain decimal readouts ("0.0159", axis
ticks like "0.985") are ordinary HTML text with no mathematical notation. The
star-description phrase "1.1 Rsun" is verbatim prose from the original; its spoken
counterpart ("1.1 solar radii") is included in the transit-view description.

(MathJax is intentionally not used — it cannot render in the page's font, and there
is no equation content that needs it. This trades the MathJax right-click menu on
the unit labels for exact visual consistency; screen-reader coverage is unaffected,
per the paragraph above.)
