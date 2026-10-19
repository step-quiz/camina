# Project 1 — Camina la gràfica: living state

Agent-facing memory between sessions. English. Update it in the same commit as any change.
Spec: [`SPEC.md`](SPEC.md). Where they disagree, this file wins.

## Status (2026-10-19): v1 built, not yet published

| Part | Status |
|---|---|
| Engines: `moviment.js`, `puntuacio.js`, `dibuix.js`, `narrador.js` (pure, Node-tested) | DONE |
| Data: 45 challenges (15 per mode × reprodueix / explica / dibuixa, 3 per level N1–N5) | DONE |
| UI: corridor SVG + original character, canvas graph (DPR), 4 modes, projector mode, progress | DONE |
| Tests (`node tests/run-all.js`) | DONE, all green |
| Velocity mode `v(t)` and N6 smooth curves | NOT IN v1 (user, 2026-10-19) |
| Repo bootstrap on GitHub: workflows `unzip-upload.yml`, `tests.yml`, `_uploads/` | PENDING (user, web UI) |
| Cloudflare Pages + `camina.step-quiz.net` | PENDING (user) |
| Card in `ins/index.html`, row in `.github/profile/README.md` | PENDING (after first public release) |

## Decisions approved by the user (2026-10-19)

1. Metaphor: a corridor; `x` = distance to the door (left), window at `x = 10`.
2. `vMax = 2.5 m/s` (`Moviment.CONFIG.vMax`).
3. No velocity mode in v1.

## Technical and pedagogical decisions (agent)

- **"Ten or more challenges per mode for N1–N5"** read as ≥ 10 per mode covering all five levels: shipped 15 per
  mode, 3 per level. Lliure has no challenges.
- **Generated texts.** Dibuixa stories, Explica options and Dibuixa constraints are derived from the challenge's
  vertices (`Narrador.historia`, `Narrador.opcions`, `Dibuix.condicions`), so they cannot disagree with the
  graph. Data files only hold vertices. The spec's `historia` / `restriccions` fields are therefore not stored.
- **Dibuixa constraints:** one point constraint per reference vertex (`x ± 0.5 m` at that `t`) plus one "stay still"
  constraint (`± 0.5 m` over the interval) per flat segment. Stories always state the times and places needed.
  On a polyline, extremes over an interval are at its ends or inner vertices, so checking those points is exact.
- **Explica distractors** (2 of 3 per challenge, seeded by challenge id): `dibuix` (graph as picture of a hill),
  `alcada` (height read as speed: "acceleres", "frenes"), `lectura` (true story with one inner vertex moved
  1.5–2 s, or — for one-segment graphs — the end place moved 3 m). Wrong choices get the misconception named.
- **Extra feedback rule `parat`** (deviation from spec §6.4): if the target moves (`|m| > 0.2`) and the student
  stayed still (`|m̂| ≤ 0.2`), the message is «t'havies de moure i t'has quedat quiet». The spec's rule 1
  compared `sign(m̂)` with `sign(m)`, which reported "you moved the wrong way" for a student who did not move.
  If no rule fires but stars < 3, the worst 1-s window is reported («t'has allunyat massa de la porta»).
- **Durations** 6, 8, 10 or 12 s: a single fast segment (> 1.3 m/s) cannot fit in 10 m in ≥ 8 s.
- **N2** = exactly one moving segment plus at least one stop, never returning (the spec's own `d2-03` example is
  wait–walk–wait).
- **Feasibility test:** every challenge (including Explica ones, which are walked after the choice) is walked by a
  simulated student (irregular ~60 fps frames, speed limiter) and must get 3★ with no message.
- **Messages only after the recording ends** (also checked in the browser run: none during countdown or recording).
  Switching tab during the countdown or the recording cancels it.
- **Stars:** Reprodueix by MAE (0.4 / 0.8 / 1.2 m, `Puntuacio.CONFIG.estrelles`). Explica and Dibuixa: 3★ first
  try, 2★ second, 1★ later. Best stars per challenge in `camina:v1:progres`.
- **SVG `hidden`** does not hide SVG elements: the corridor uses `display="none"` (`passadis.js → mostra`).
- **URL state** in the hash (`#mode=…&repte=…&projector=1`), applied on load and on `hashchange`.
- **CSP** in `_headers`: `connect-src 'none'`, no inline scripts or styles (enforced by `tests/repo.test.js`).

## Acceptance criteria (spec §6.8)

- [x] Works by double-click, with touch, mouse and keyboard only (corridor: tap/drag or ← →; graph: tap/drag or
      arrows + Enter + Backspace).
- [x] Ten or more challenges per mode for N1–N5 (15 each).
- [x] Feedback messages appear only after the recording ends.
- [x] No external requests (static test + browser run).
- [x] Projector mode: graph full width, large axis labels.

## Verification done (2026-10-19)

- `node tests/run-all.js`: motors 68, data 12 suites (45 challenges), repository 13, `?v=` up to date, docs ↔ code.
- Browser (Playwright Chromium, `file://`): Reprodueix walked in real time with the mouse along the target (3★, no
  message) and standing still (0★, «eres massa a prop», «t'havies de moure»); Lliure with the keyboard + reflection
  question; Explica wrong then right, then walk; Dibuixa going back in time rejected, wrong drawing (2 messages,
  highlighted), right drawing, and a keyboard-only drawing; projector 1280 × 720; 360 px phone (no horizontal
  scroll); dark mode; garbage hash; served with the `_headers` CSP: no violations.

## Possible next steps

- Phase 2: velocity mode `v(t)` (smoothed finite differences, window ≈ 0.3 s) and N6 smooth curves.
- More challenges per level if the user wants (data only; tests validate them automatically).
