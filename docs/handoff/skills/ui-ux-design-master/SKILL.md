---
name: "ui-ux-design-master"
description: "Complete UI/UX design specialist for ANY app, new or existing. Audits every layer down to each screen, control, word and state against real standards; lists must-have/nice/remove/keep/improve; user picks theme, style, layout, fonts, colours."
---

# UI/UX Design Master: everything, down to the core

A senior product designer, UX researcher, UI designer and accessibility auditor in one, for ANY app: website,
dashboard, POS, booking, school or clinic system, phone app, desktop tool, game, admin panel, engineering or
plant/HMI app. Works on an existing app (link, repo, HTML file, screenshots) or a new idea (a description).

"Everything, down to the core" means three things:
1. **Every layer**, from why the app exists down to the pixel (the 12 layers in Step 3).
2. **Every screen, every control, every word and every state** gets its own verdict (Step 4).
3. **Every finding has evidence and a reference.** Evidence is a screenshot or a measured value. The reference is a
   named standard or a reference product. No opinion without proof.

What the user gets:
- **Analysis**: what the app is for and how well each layer serves that.
- **Feature review**: MUST / NICE / REMOVE / KEEP / IMPROVE, for features AND for each control on each screen.
- **Design options**: 3 real directions (layout, style, theme, fonts, colours, spacing), each on the app's own
  screens, each tied to a reference. The user picks with tap cards; one is marked recommended with a reason.
- **Design spec**: exact tokens and rules of the picked direction, and the build if asked.

The user only picks. Claude finds, measures, designs and checks. Never ask the user to find problems or describe
what is wrong.

---
## Step 1: Understand the app (Claude answers; ask at most one card for what cannot be found)
Sources: the running app, its repo/docs (`README`, `CLAUDE.md`, `PROJECT_RULES.md`, `HANDOFF.md`), the prompt.
1. **Category**: dashboard/monitoring · data entry/forms · e-commerce/booking · content/marketing ·
   productivity/tool · admin/CRUD · social/chat · mobile utility · game · industrial HMI/SCADA ·
   engineering/calculator · learning/training.
2. **Users** (1-3 short personas): role, skill, device, environment (glare, night shift, gloves, noise, hurry),
   frequency of use, language.
3. **Top 3-5 tasks** by frequency × importance, each written as "When ___, I want to ___, so I can ___".
4. **Constraints**: brand, existing design system, parts that must not change (logic, data, drawings, APIs),
   lightweight/offline, languages, accessibility, regulations.
5. **Success measures**: task time, taps per task, error rate, learnability, trust.

## Step 2: Inspect and measure (existing app; for a new idea, do it on the first build)
Use Playwright on the running app. Bundled scripts (write them from their spec at the end if missing):
1. **`scripts/ui-check.mjs`**: opens the app at 390x844, 800x1280, 1280x800 and 1440x900, clicks EVERY control
   two levels deep (menus, panels, dialogs, tabs included), screenshots each new state, and flags JS errors,
   dead controls, overflow, text < 11 px, clipped text, overlap, touch targets < 44 px, contrast, unlabeled
   controls and axe-core violations. This gives the full **screen & state inventory** and the control list.
2. **`scripts/style-audit.mjs`**: measures the real design system: number of font families, font sizes,
   weights, line heights, colours, backgrounds, spacing values (and % off the 4 px grid), radii, shadows,
   control heights, low-contrast text.
3. **Task walk**: do each top task yourself on phone and desktop; count taps, screens, typing, waits; note every
   hesitation, wrong turn and unclear word.
4. Add states the sweep cannot reach: empty, loading, error, offline, long text, many rows, signed out,
   permission denied, first run, and (HMI) alarm, trip, forced, bypass.

## Step 3: The 12-layer deep audit (every layer, standard named)
Score each layer **Good / Needs work / Poor** with evidence. Layers 1-5 follow Jesse James Garrett's
*Elements of User Experience* (strategy → scope → structure → skeleton → surface); 6-12 go deeper.

| # | Layer | What to check | Standard / reference |
|---|-------|---------------|---------------------|
| 1 | **Strategy** | Is the purpose clear in 5 s? Does the home screen serve the top task? | Garrett; Jobs-to-be-done |
| 2 | **Scope (features)** | Missing must-haves, unused features, duplicates | Category baseline (catalog); Kano model (basic / performance / delight) |
| 3 | **Structure (IA & navigation)** | Menu grouping, depth (≤ 3 levels), labels users understand, current location shown, back always works, search | Nielsen #2, #6; card-sorting logic; Material navigation; Apple HIG navigation |
| 4 | **Skeleton (layout & flow)** | Layout per size, grid, alignment, primary action placement, taps per task, F/Z reading pattern, thumb zone on phone | Material 3 window classes and layout; Fitts's law; Hoober thumb zone |
| 5 | **Surface (visual)** | Hierarchy, contrast, colour roles, consistency, clutter, brand | Refactoring UI; Gestalt; Material 3 colour; WCAG 1.4.3 / 1.4.11 |
| 6 | **Typography** | Families (≤ 2 + mono), scale (6-8 sizes), body 14-16 px (never < 11), weights ≤ 3, line height 1.4-1.6, 45-75 characters per line, tabular numbers, truncation rules | Material 3 type scale; Apple HIG; Butterick's Practical Typography |
| 7 | **Colour & theme** | Neutral ramp, one accent, status colours with icon/text, dark theme quality (#121212-#1a1d21, not pure black/white), meaning consistent across screens | WCAG 2.2 AA; Material 3 dark theme; ISA-101 for HMI |
| 8 | **Spacing, size & shape** | 4/8 grid, consistent gaps, density fits the user, control heights (32-36 desktop, 44-48 touch), radius scale ≤ 3, elevation ≤ 3 levels | Material 3 spacing; Apple 44 pt; WCAG 2.5.8 (24 px min) |
| 9 | **Components & controls** | Each control: right type (button vs link vs toggle vs select), one primary per screen, states (default, hover, focus, pressed, disabled, loading, selected), consistent across screens | Material 3 components; Apple HIG controls; Nielsen #4 |
| 10 | **Content & microcopy** | Button labels are verbs ("Save", not "OK"), plain words users know, consistent terms, units on every number, helpful empty/error text that says what to do next, no jargon, one language per screen | Nielsen #2, #9; GOV.UK content style; Mailchimp content style guide |
| 11 | **Feedback, states & motion** | Every action gives feedback in < 100 ms, progress for > 1 s, confirm + undo for destructive actions, toasts that do not block, motion 150-300 ms with purpose, reduced motion respected | Nielsen #1, #3, #5; Doherty threshold (< 400 ms); Material motion; WCAG 2.3.3 |
| 12 | **Accessibility, inclusion & trust** | Keyboard path, visible focus, screen-reader names, colour not alone, reflow at 320 px, zoom 200 %, captions, language and RTL readiness, privacy/consent clarity, no dark patterns, error recovery, offline behaviour, perceived speed (skeletons, no layout shift CLS ≤ 0.1) | WCAG 2.2 AA; Apple/Android accessibility guides; deceptive.design; Core Web Vitals |

Extra layers when they apply:
- **Data display / charts**: right chart type, labelled axes and units, no 3D or chart junk, sortable tables,
  number alignment (Tufte; Material data tables).
- **Forms**: labels above fields, inline validation, input types and keyboards on phone, sensible defaults,
  autosave/draft, error summary (Baymard; GOV.UK Design System).
- **Onboarding & help**: first-run guidance, empty states that teach, tooltips, help/about with version (Nielsen #10).
- **Notifications & alarms**: priority, timing, grouping, no spam (Material notifications; ISA-18.2 for HMI).
- **Settings**: grouped, searchable when long, safe defaults, reset.
- **Industrial HMI/SCADA**: grey background, colour only for abnormal states, alarm priority colour + shape, only
  unacknowledged alarms blink, trip/first-out/bypass/forced always visible, overview → area → detail →
  diagnostic, faceplate shows mode (MAN/AUTO/CAS, LOCAL/REMOTE) and PV/SV/MV with units and quality, every
  tag traceable to its drawing (ISA-101, ISA-18.2, High Performance HMI by Hollifield et al.).

## Step 4: Down to the core: screen, control, word and state audits
### 4a. Screen audit (one row per screen, all sizes)
| Screen | Purpose (one line) | Top task served | Layer scores 3-11 | Biggest problem (evidence) | Verdict |
Verdict per screen: KEEP / IMPROVE / MERGE (into another screen) / SPLIT / REMOVE.

### 4b. Control audit (one row per control, from the `ui-check` control list)
| Screen | Control (label/icon) | What it does | Used in top task? | Problems (size, label, place, duplicate, dead, state missing) | Verdict | Reference |
Verdict per control: **KEEP · IMPROVE** (rename, resize, move, regroup, add state) **· MOVE** (to menu/overflow
or elsewhere) **· MERGE** (duplicate) **· REMOVE** (dead, unused, noise) **· ADD** (missing control needed by a task).
Rules: never remove a control that protects safety, data or the core logic. Never remove a control users rely on
without an obvious replacement in the same place or better. Duplicates keep the one in the more expected place.

### 4c. Word audit (microcopy)
List every visible label, title, button, message and tooltip that is unclear, inconsistent (two words for one
thing), too technical, too long, missing a unit, or in the wrong language. Give the better word for each.

### 4d. State audit
For each screen, mark which states exist and look right: default · empty · loading · error · offline · disabled ·
selected · focus · long text · many rows · first run · signed out · (HMI) alarm · trip · forced · bypass.
Missing or broken states are findings.

### 4e. Task audit
For each top task: steps, taps, screens, time, errors before vs the best possible; where it breaks; the fix.

## Step 5: Feature review: MUST / NICE / REMOVE / KEEP / IMPROVE
Combine three sources: **category baseline** (catalog), **2-3 reference products** of the category (what they
all do, users expect: Jakob's law), and **this app's evidence** (Steps 2-4).

| Item | Verdict | Why (evidence) | Reference | Effort |
|------|---------|----------------|-----------|--------|
| e.g. Global search | MUST (missing) | task 2 needs 4 taps today | baseline; Linear, Notion | M |
| e.g. Second "Run" button | REMOVE | duplicate of top-bar Run; confuses | Nielsen #4 | S |
| e.g. Settings menu | IMPROVE | 14 items, no groups | Hick's law | S |
| e.g. Export PDF | NICE | not core | — | M |
| e.g. Event log | KEEP | used in task 3, works | — | — |

**MUST**: needed for a top task, safety/correctness, accessibility, or expected in the category.
**NICE**: real value, not core; listed with effort. **REMOVE**: duplicate, dead, unused, noise. **KEEP**: works;
protect it. **IMPROVE**: right feature, wrong form. Effort S (hours) / M (a day) / L (days).
Order: MUST → IMPROVE → REMOVE → NICE → KEEP. Use the Kano model to sort NICE items (performance vs delight).

## Step 6: Prioritize
Put every finding (layers, screens, controls, words, states, features) in one list with **severity**
(Critical: wrong/unsafe, data loss, blocks a top task · Major: slows or misleads a top task, a11y blocker, broken on
a target size · Minor: polish) and **effort** (S/M/L). Order by impact ÷ effort. The top 10 are the "do first" list.

## Step 7: Design options (the user picks)
Make **3 directions** (2 if the space is narrow, at most 4). They must differ in layout and interaction, not only
colour. Each is built on the app's real screens (top-task screen, the busiest screen, phone view) and already
fixes the "do first" list.

Each option states: **name + one-line idea** · **reference** (products/standards it follows) · **layout**
(navigation pattern: top bar / side rail / bottom tab bar; panels; what each size shows) · **theme** (light /
dark / both; surface levels) · **palette** (neutral ramp, accent, success/warning/danger/info with hex and
contrast) · **typography** (pairing, scale in px, weights) · **spacing & density** (base unit, scale, control
heights) · **shape** (radius, borders vs shadows, icon set) · **motion** (durations, easing) · **fits best for /
trade-off**.

Show them **one option per page/artifact**, never all in one page, images embedded (data URIs or published
assets) so nothing shows blank, rendered at phone and desktop size. Then one tap card: **"Alin ang gusto mo?"**
with one option marked recommended and a one-line reason.

After the main pick, at most 3 fine-tune cards, each with a recommended default: theme (light / dark / both) ·
density (compact / comfortable) · font pairing (2-3 choices). Never ask about what standards already decide
(contrast, minimum sizes, grid).

## Step 8: Design spec of the picked direction
- **Colour tokens**: `--bg, --surface-1..3, --border, --text, --text-muted, --primary, --on-primary, --success,
  --warning, --danger, --info, --focus`, light and dark, each pair's contrast ratio listed.
- **Type tokens**: families, sizes (e.g. 12/14/16/20/24/32), weights, line heights, tabular numbers.
- **Spacing tokens**: 4/8/12/16/24/32/48; control heights (32 desktop, 44 touch).
- **Shape tokens**: radius 4/8/12; elevation 0-3. **Motion tokens**: 150/200/300 ms, standard easing.
- **Components**: every control type with all its states (default, hover, focus, pressed, disabled, loading,
  selected, error); one primary button per screen.
- **Patterns**: navigation, empty/loading/error states, forms, tables, dialogs, toasts, alarms (HMI).
- **Layout per size**: compact < 600 / medium 600-839 / expanded ≥ 840; what collapses where.
- **Microcopy rules**: voice, the word list (one term per thing), units, number formats.
- **Do / don't** (5-10 lines), each with its reference.

## Step 9: Build and prove (when asked)
Apply in slices; never change logic, calculations, data or drawings; keep it lightweight (system fonts or one
webfont with few weights; no heavy UI kit without need). Re-run `ui-check.mjs` and `style-audit.mjs`, and look
at every screenshot again. Show before → after numbers, e.g. "font sizes 11 → 6", "spacing off-grid 82 % → 0 %",
"touch targets under 44 px 41 → 0", "taps for task 1: 6 → 3", "JS errors 20 → 0". Delivery follows the project's
rules: no merge, deploy or release without the user's explicit GO in that same message.

---
## Catalogs
### Category baseline (typical MUST items)
- **Every app**: clear navigation and current location, search when content > 1 screen, empty/loading/error
  states, confirm + undo for destructive actions, settings, help/about with version, responsive layout, keyboard
  and screen-reader basics, works offline or says so.
- **Dashboard/monitoring**: overview first, key numbers with units and trend, time range, alert list, drill-down,
  last-updated time, data quality.
- **Data entry/forms**: labels, validation, save state, autosave/draft, required markers, clear errors.
- **E-commerce/booking**: search + filters, detail, cart/summary, guest checkout, clear price, order status.
- **Admin/CRUD**: list with sort/filter/search, bulk actions, detail/edit, audit trail, roles.
- **Productivity/tool**: quick start, recent items, shortcuts, export/share, undo/redo.
- **Mobile utility**: bottom tab bar (3-5), thumb-reach primary action, offline, pull to refresh.
- **Game**: clear goal, onboarding, pause, sound toggle, progress/score, accessible controls.
- **Learning/training**: progress, step-by-step, feedback per step, score, resume.
- **Industrial HMI/SCADA**: overview → area → detail → diagnostic, alarm summary by priority, faceplate (mode,
  PV/SV/MV), trends, trip/first-out, forced/bypass list, tag → drawing link, event log.

### Reference products by category
Dashboard: Grafana, Datadog · Admin/CRUD: Linear, Stripe Dashboard, Retool · Forms: GOV.UK, Typeform, Stripe
Checkout · E-commerce: Shopify, Amazon, Airbnb · Productivity: Notion, Figma, VS Code · Mobile: Apple
Weather/Health, Google Maps · Game: Duolingo, Monument Valley · Learning: Duolingo, Khan Academy · HMI/SCADA:
ISA-101 High Performance HMI examples, AVEVA, Siemens WinCC Unified, Yokogawa/Fuji DCS screens.

### Style directions (pick 3 that fit)
Clean SaaS (Linear light, Stripe) · Control-room dark (ISA-101, Grafana dark) · Material 3 (Google apps) ·
Apple-like (HIG apps) · Industrial light (ISA-101 light, WinCC Unified) · Editorial (Medium, GOV.UK) ·
Playful (Duolingo).

### Font pairings (free, light)
Inter + JetBrains Mono · IBM Plex Sans + IBM Plex Mono · Roboto + Roboto Mono · Source Sans 3 + Source Code
Pro · Noto Sans + Noto Sans Mono (many languages) · system-ui stack (zero download, best for offline/light apps).

### Colour rules
Neutral ramp 8-10 steps; one accent; status green/amber/red/blue always with icon or text; dark theme
#121212-#1a1d21 background, text about #e6e6e6, desaturated accents; every pair ≥ 4.5:1 (≥ 3:1 large text/UI).

---
## Bundled scripts (write from this spec if missing; both need `npm i -D playwright`)
**`scripts/ui-check.mjs`**: `node ui-check.mjs --url <http|file> [--out dir] [--sizes 390x844,800x1280,1280x800,1440x900] [--routes /,#tab] [--depth 2] [--max-clicks 150] [--wait ms] [--skip regex] [--init setup.js]`.
For each size (touch for widths ≤ 1024), it loads the app, then clicks every visible button, link, tab, menu
item, switch, checkbox, select, `[onclick]` and `[tabindex=0]`. Level 1 = controls that appear only after a click,
reached by replaying the path. It skips risky text (delete/remove/logout/reset all) and new-tab links. After each
click it records a JS error, "no visible change" (no DOM or URL change = maybe dead), or a new state (signature of
visible headings, buttons, dialogs, roles, selected). On each new state: screenshot plus checks for overflow-x,
offscreen text, font < 11 px, clipped text, contrast, control overlap, touch target < 44 px, unlabeled control,
and axe-core critical/serious if axe-core is installed. Output: `report.md` (per size: states, clicks, unique
failures with element and first screenshot), `report.json` (includes the full control list for the control
audit), `shots/`.
**`scripts/style-audit.mjs`**: `node style-audit.mjs --url <http|file> [--out dir] [--sizes 390x844,1440x900] [--routes …] [--wait ms]`.
For each visible element (not svg/canvas) it counts font family, size, weight, line height, text colour,
background, border colour, padding/margin/gap, radius and shadow. It also gives control sizes (under 44 / under
24 px), contrast against the nearest opaque background, and the % of spacing off the 4 px grid. Output:
`style-audit.md` with targets (≤ 2 families + mono, ≤ 6-8 sizes, ≤ 3 weights, 4/8 grid, ≤ 3 radii, ≤ 3 shadows)
and `style-audit.json`.

---
## Rules
- Any app; if a repo exists, read its rules first. Project rules win.
- Design work never changes logic, calculations, data or drawings.
- Every finding: evidence + reference. Never a bare "better" or "PASS".
- Picks on tap cards, one recommended; one option per page; images embedded.
- Lightweight first. Never remove a relied-on control without a visible replacement.
- No merge, deploy or release without the user's explicit GO in that same message.

## Report to the user (plain Taglish, short; long detail in an attached document)
The user may not be a designer or a coder: simple words, explain any term in a few words.
1. **Buod** (2-3 lines): what the app is, the biggest problem, the top recommendation.
2. **Iskor ng 12 layer**: Good / Needs work / Poor, one piece of evidence each (e.g. "Font: 11 iba-ibang laki, dapat 6").
3. **Unahin (top 10)**: severity + what the user will notice after the fix.
4. **Feature review**: MUST, IMPROVE, REMOVE, NICE, KEEP.
5. **Bawat screen at button**: counts (e.g. "142 button: 98 ituloy, 21 ayusin, 9 tanggalin, 6 pagsamahin, 8 idagdag"), full table attached.
6. **Mga pagpipilian**: option pages + the pick card.
7. **Susunod**: "Piliin ang design, tapos gagawin ko".