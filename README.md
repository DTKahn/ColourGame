# Hexact

**See a hex code. Find the color.**

A minimal color-matching game. Each round shows a hex code such as `#3A7BD5`;
use the picker to find the color you think it describes. The closer you get,
the more points you earn — up to 1,000 per color.

**Play:** https://dtkahn.github.io/ColourGame/

## How scoring works

Your pick is compared with the target using
[CIEDE2000](https://en.wikipedia.org/wiki/Color_difference#CIEDE2000) (ΔE), a
perceptual color-difference formula: it measures how different two colors
*look* to people, not just how far apart their numbers are.

| ΔE   | Meaning                       | Points |
| ---- | ----------------------------- | ------ |
| < 1  | Invisible difference          | ~1,000 |
| 5    | Noticeable side by side       | ~810   |
| 10   | Clearly different, same family| ~600   |
| 20   | Different shade               | ~285   |
| 40+  | Way off                       | < 50   |

The curve lives in [`js/scoring.js`](js/scoring.js).

## Running locally

No build step — it's plain HTML, CSS and ES modules.

```sh
npm start        # serves on http://localhost:8000 (python3 http.server)
npm test         # unit tests for the color math, scoring and game logic
```

Any static file server works; opening `index.html` directly via `file://`
won't, because browsers block ES modules there.

## Project layout

```
index.html         Views: home, play, results
css/styles.css     All styling (light + dark, mobile-first)
js/main.js         UI wiring and view switching
js/game.js         Game state (pure logic, no DOM)
js/picker.js       Touch-friendly HSV color picker
js/color.js        Conversions (hex/RGB/HSV/HSL/Lab) and CIEDE2000
js/scoring.js      ΔE → points, ratings and end-of-game titles
js/formats.js      Color code formats shown to the player
js/storage.js      localStorage wrapper (best scores, preferences)
tests/             node:test unit tests
```

## Deployment

`.github/workflows/pages.yml` runs the tests and deploys to GitHub Pages on
every push to `main` (or manually from the Actions tab).

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Roadmap

- [ ] **High scores** with user names (currently: personal best per game length, stored locally — see `js/storage.js`)
- [ ] **Time mode** — overall or per-color time limit, with speed as a points factor
- [ ] **Other color codes** — HSL, RGB/RGBA (formatters already in `js/formats.js`)
- [ ] **Reverse mode** — a color is shown and you type the code
- [ ] **About colors** — how hex, RGB and HSL work, and how base 16 maps to color channels
