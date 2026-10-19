# Project 1 — Camina la gràfica: specification

> Copied from `SPEC-step-quiz-9-projects.md` §6 (2026-10-19, approved scope). The shared rules of that document
> apply and are summarised here; decisions taken later are in [`STATE.md`](STATE.md), which overrides this file.
> Where this file and `CLAUDE.md` disagree, `CLAUDE.md` wins.

## Shared rules (summary of the master spec §2–§4)

- Static only (HTML + CSS + vanilla JS), no build step, no backend. **Must work under `file://`** (double click):
  classic scripts with one namespace per file and the dual export wrapper, no ES modules, no `fetch`, no Workers.
- No network at runtime (no CDN, fonts, analytics). Privacy: no personal data; `localStorage` only, every access in
  `try/catch`, fully usable without storage. Keys `camina:v1:<what>`.
- Everything the student sees is in Catalan; identifiers and comments in Catalan; agent docs in English.
- Content CC BY-NC-SA 4.0, code MIT (`LICENSE`, `LLICENCIA.md` from `step-quiz-commons/fitxers/`).
- Never `[skip ci]`, `[ci skip]` or `[cf-pages-skip]` in any commit message.
- Tests before delivery; tests recompute results independently of the code under test. Docs follow code.
- Seeded RNG (FNV-1a → mulberry32, from `prova1eso/assets/js/atzar.js`); never `Math.random` for anything
  reproducible. URL readers tolerate garbage.
- Pedagogy: one action per screen state, ≤ ~40 words of instructions, feedback names the mistake (≤ 2 messages),
  no gamification noise, every route ends in a "beauty moment", hints never give the answer.
- Interaction triad (drag, tap-then-tap, keyboard); Pointer Events with `setPointerCapture`; `touch-action: none`
  only on the board; targets ≥ 44 px touch / ≥ 24 px mouse; `aria-live` feedback; colour never the only carrier;
  animations ≤ 300 ms and off under `prefers-reduced-motion`; dark mode via tokens; print black on white, A4 15 mm.
- Cache busting with `?v=<content hash>` (`tools/versio.py`), checked by a test.
- Catalan maths typography: decimal comma (inputs accept `,` and `.`), `·` and `:`, `«…»`, typographic `’`.

## Project 1: Camina la gràfica

**Repo:** `camina`. **Curriculum:** 2n ESO functions (reading and drawing graphs), 3r ESO linear functions (slope = speed), 4t ESO optional velocity–time.

### 6.1 Pedagogical intent

- **The misconception it targets** is the most documented error in early function work: reading a distance–time graph as a *picture of the path* ("graph-as-picture"), and confusing height with steepness (Leinhardt, Zaslavsky & Stein 1990; Clement 1989).
- **How it does so.** The student produces the graph with their own (simulated) motion, then the reverse.
- **What must not be lost:** the student acts first; feedback is in words about *what the body did* («entre 2 s i 4 s anaves massa de pressa»), not a number.

### 6.2 World model

- A straight corridor of length `L = 10 m`. Position `x` is the **distance to the door** (`porta`) at the left, in metres. The window (`finestra`) is at `x = 10`.
- A recording lasts `T` seconds (default 10, set per challenge).
- **Input.** The pointer's x on the corridor sets a *target* position `x*`. The character follows with a speed limit:
  `x_{k+1} = x_k + clamp(x* − x_k, −v_max·Δt, v_max·Δt)`, with `v_max = 2.5 m/s` (configurable).
  This keeps slopes physically meaningful and makes teleporting impossible.
- **Keyboard.** Holding ←/→ moves at 1 m/s; with Shift, at 2 m/s.
- **Sampling.** Use `requestAnimationFrame` with `performance.now()` timestamps and store raw `(t, x)`. For drawing and scoring, resample to a uniform grid `dt = 0.05 s` by linear interpolation.
- **Recording protocol.**
  1. «Preparat?» The character is auto-placed at the challenge's `x(0)`, with a ghost marker.
  2. A visual 3-2-1 countdown (sound off by default).
  3. Record for `T` s.
  4. Stop automatically.

  Space starts the recording.

### 6.3 Modes (in this order of introduction)

| Mode | Student does | System does |
|---|---|---|
| **Lliure** | Walks freely | Draws `d(t)` live; afterwards asks one reflection question («Què vol dir que la línia sigui plana?») |
| **Reprodueix** | Walks to match a dashed target graph | Scores and gives segment feedback (§6.4) |
| **Explica** | Sees a target graph and picks the matching story from 3 | Distractors are built from misconceptions: graph-as-picture («puja una muntanya»), height-vs-speed («quan la línia és més alta, va més de pressa»), wrong interval. Then the student walks it to confirm |
| **Dibuixa** | Reads a story and draws the graph on the axes | Vertices snap to 0,5 s / 0,5 m. Reject strokes that go back in time or are vertical, with an explanation («no pots ser a dos llocs alhora»). Then «Mira-ho»: the character walks the drawn graph, and story constraints are checked automatically |
| *(phase 2)* **Velocitat** | Walks; sees `v(t)` | Smoothed derivative (finite differences on the resampled series + centred moving average, window ≈ 0,3 s); challenges on `v(t)` for 4t ESO |

### 6.4 Scoring and feedback

- **Score.**
  - On the common grid, `e_i = |x_s(t_i) − x_target(t_i)|` and `MAE = mean(e_i)`.
  - Stars: MAE ≤ 0,4 m → 3★; ≤ 0,8 → 2★; ≤ 1,2 → 1★; otherwise «torna-ho a provar».
  - Keep the thresholds in one config object.
- **Segment feedback.** The target is a polyline with vertices `(t_j, x_j)`, and segment `k` has slope `m_k`. For each segment:
  - trim 0,2 s at each end and fit the student's slope `m̂_k` by least squares;
  - compute the mean signed offset `o_k`.
- **Classification rules** (order = priority):
  1. Direction wrong: `sign(m̂_k) ≠ sign(m_k)` with `|m_k| > 0,2` → «t'havies d'allunyar de la porta i t'hi has acostat».
  2. Stop expected: `|m_k| ≤ 0,05` but `|m̂_k| > 0,2` → «aquí havies d'estar quiet».
  3. Speed: `m̂_k/m_k > 1,4` → «massa de pressa»; `< 0,6` → «massa a poc a poc».
  4. Offset with good slope: `|o_k| > 0,8` → «has començat massa a prop / lluny».
- **Show at most two messages**: those with the largest `error × duration`, each with its time interval («entre 2 s i 4 s»). Highlight that interval on the graph.

### 6.5 Data

```js
window.CAMINA_REPTES = [
  { id: 'n1-01', nivell: 1, mode: 'reprodueix', durada: 10,
    vertexs: [[0, 0], [10, 8]],                 // [t (s), x (m)], t strictly increasing
    historia: 'Surts de la porta i camines a poc a poc cap a la finestra.',
    pistes: ['Mira on comença la línia: a quina distància de la porta has de ser al principi?'] },
  { id: 'd2-03', nivell: 2, mode: 'dibuixa', durada: 10,
    historia: 'Esperes 2 segons a la porta, camines fins al mig i hi esperes fins al final.',
    restriccions: [ { t: [0, 2], x: [0, 0.3] }, { t: [4, 10], x: [4.5, 5.5] } ] }
];
```

Levels:
- N1: one segment at constant speed.
- N2: walk then stop.
- N3: walk, stop, return.
- N4: two different speeds.
- N5: starting away from the door.
- N6 (phase 2): smooth curves (speeding up and slowing down).

### 6.6 Rendering

- One `<canvas>` for the graph, scaled by `devicePixelRatio`. One SVG for the corridor and character.
- The character is an **original** simple figure; never a known character.
- Axes: `t (s)` from 0 to `T`, `d (m)` from 0 to 10, with gridlines every 1 s / 1 m and labels with decimal commas.

### 6.7 Tests

- Speed limiter maths.
- Resampling.
- Scoring: a perfect walk gives MAE ≈ 0; a 1 m offset gives MAE ≈ 1.
- Each classification rule, with crafted sample series.
- Data validation:
  - `t` increasing and starting at 0, last `t = durada`;
  - `0 ≤ x ≤ 10`;
  - every segment slope `≤ 0,8·v_max` (achievable);
  - every *dibuixa* challenge's constraints are satisfiable: ship a reference polyline per challenge and check it.

### 6.8 Acceptance criteria

- [ ] Works by double-click, with touch, mouse and keyboard only.
- [ ] Ten or more challenges per mode for N1–N5.
- [ ] Feedback messages appear only after the recording ends.
- [ ] No external requests.
- [ ] Projector mode: graph full width, large axes labels.

**Open questions for the user:**
- Is the corridor the right metaphor (alternatives: a pool lane, a bus stop line)?
- Should the default `v_max` be 2,5 m/s?
- Should the velocity mode be in v1?
