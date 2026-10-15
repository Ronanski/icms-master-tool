# v1.20.66 (Beta) — R / A / M ay HMI command, SV para sa AUTO lang, bumpless na AUTO -> MAN (ayos sa engine)

**Problem:** (user) gawin ang pulse ng .REM / .LOC / .MAN, ang tamang pamagat, ang berdeng marker; "sa manual mode ... i-enable basta naka-AUTO" (SV ay para sa AUTO).
**Work Done:**
- Ang R / A / M ay nagpa-pulse na (700 ms) ng .REM / .LOC / .MAN input ng drawing kung meron; ginagamit ito ng 1:BYPASS at ng SET rule (hal. M.018D).
- Pamagat: ang paglalarawan ng DCS; kung pareho sa dalawang controller ng sheet, ang nakasulat sa drawing sa tabi ng PID ("PRIMARY AIR FLOW CONTROL").
- Berdeng marker sa bar graph = PL ~ PH (normal na saklaw ng PV, data ng DCS).
- **SV field, − / + at popup ay naka-disable sa MANUAL at sa REMOTE; enabled sa AUTO (A).** (Ayon sa pagkakaintindi ko sa user; itama kung mali.) Nasa loop na walang A/M switch ang SV ay laging enabled.
- **Bug na nahanap ng mas mahigpit na test at inayos (engine, `plant.js`):** ang AUTO -> MAN ay HINDI bumpless sa mga loop na COS ang manual leg. Ang MV ay tumatalon sa lumang halaga ng COS (hal. 51.9 -> 50). Dati ay pumapasa ang test dahil nagkataong malapit ang halaga (tolerance 1.5). Ngayon, habang A leg ang pinili, ang COS (manual MV o SV ng operator) ay sumusunod sa output, kaya tuloy ang halaga sa paglipat sa B. Bumpless din ang REMOTE -> LOCAL ng SV.
- Mas mahigpit ang mga test: bumpless MV tolerance 0.3 (dati 1.5 / 2), dagdag na SV bumpless.
**Na-check:** scenario UAT 160 / 160; generic (ABC-007, 2 controller) 84 / 84; panel_sync 0 FAIL; force_manual 68 / 68; UAT dry run 2458 items, 6808 cases, 0 failing; engine isolated 5128 net pareho; reset 51 sheet.
**Hindi pa:** generic sa lahat ng 68 controller; hindi pa nasusubok sa device.
