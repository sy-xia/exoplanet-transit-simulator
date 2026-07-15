# Exoplanet Transit Simulator (HTML5)

**This simulation must be served over HTTP — it will NOT run from a double-clicked
`index.html` (`file://`) path.**

## Why

The KL-UNL masthead component (`foundation/kl-unl-masthead.js`) loads the
simulation's title, Help, and About text with `fetch('foundation/contents.json')`.
Browsers block `fetch()` of local files under the `file://` protocol for security
(same-origin policy), so opening `index.html` directly shows an empty or broken
masthead. Served over HTTP the fetch succeeds and the sim loads normally.

## How to run locally

From **inside the `html5/` folder**, start any static server:

```
# Python
python3 -m http.server 8123      # then open http://localhost:8123/

# Node
npx serve                        # or: npx http-server

# VS Code
Use the "Live Server" extension (right-click index.html -> "Open with Live Server")
```

Note the sim is at the server **root** when you serve from inside `html5/`, so the
URL is `http://localhost:8123/` — not `.../html5/index.html`.

## Production

When deployed to the cloud host (served over HTTP/HTTPS) it just works; the
`file://` limitation only affects local double-clicking.

## Contents

| Path | Purpose |
| --- | --- |
| `index.html` | KL-UNL scaffold (masthead + panels) |
| `foundation/` | Shared KL-UNL foundation files (masthead, CSS, MathJax helper, contents.json) |
| `styles/styles.css` | Sim-specific styles only |
| `simulation.js` | All simulation logic (verbatim port of the decompiled ActionScript) |
| `assets/shapes/` | Exported vector art reused as-is from the Flash decompilation |
| `CONVERSION_NOTES.md` | Behavior model, AS→HTML5 mapping, deviations |
| `ACCESSIBILITY.md` | WCAG affordances, keyboard map, color remaps |

Everything is local; the only runtime fetch is `foundation/contents.json`.
No requests leave the host. (The sim has no equations, so no MathJax is loaded —
unit labels are plain HTML in the page font; see CONVERSION_NOTES.md.)
