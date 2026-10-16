# v2.2.0 — Mga Beta

Base: Stable v2.1.0 (`main` 0aac342). Bawat Beta ay push sa `claude/logic-sim-app-review-tbmfdr` (PROJECT_RULES 5e, 5f).

## 2.2.0-beta.1 — Coal feeders, coal master at oil sa Start at 150 MW

- **Problem:** Sa Start at 150 MW, ang FIC-CF ay PV 40 / MV 100 %, ang 3 coal feeder ay umaakyat sa 40 T/H (max), at ang coal master (FIC-CM) ay bumababa sa 0 % sa loob ng 300 s. Snapshot 11.png: feeder SV 29.1 T/H / MV 72.8 %, coal master PV 87.0 / SV 87.4 / MV 73.0 %.
- **As Found (trace: `DRAWING_TRACE.md` beta.1):**
  1. Ang MV ng feeder MAN station (FICCL1061A / B / C) ay % ng 0 ~ 40 T/H sa drawing (AO sa inverter, alarm "≥ 83.3 %", PV ng FIC-CF = average ng 3 MV). Ang engine ay T/H, kaya ang PV ng FIC-CF (≤ 40) ay hindi kailanman umaabot sa SV (73 %).
  2. Mali ang HMI mapping: ang "TOTAL COAL FLOW CORRECT." sa 11.png ay ang **HS-COAL** (calorie correction), hindi ang FIC-CF. Tugma ang numero: MV 33.1 % → LN3 0.932; 87.0 T/H × 0.932 = 81.1 T/H; 4450 × 0.932 = 4150 Kcal/Kg ("COAL CALORIE CORR." sa screen).
  3. Ang oil burner flow (FICDO1043A ~ D) ay 0.88 T/H bawat isa kahit sarado ang supply oil valves: ang plant model ay "nag-pin" ng PV net at tinabunan ang gate ng drawing (ABC-003A SI0070 = 0 kapag M.3410 = 1). Kaya ang coal demand ay (81.48 − 6.29 oil) / 0.932 = 81.4 sa halip na 87.4.
  4. Ang feedrate transmitter ng feeder (AI0480 / AI0512 / AI0544) ay hindi sumusunod sa feeder MV (walang plant model), kaya hindi nakikita ng coal master ang sarili nitong MV.
- **Work Done:**
  - ABC-004A / B / C: unit conversion sa hangganan lang (AUTO-MV % → T/H; bias T/H → %; feeder MV T/H → % sa PV ng FIC-CF at sa bumpless return; "≥ 83.3 %" = 33.32 T/H; RB-MV ng FIC-CF T/H → %).
  - 150 MW load: HS-COAL = R, PV 81.2 / SV 81.2 / MV 33.1 % (11.png); FIC-CF = R, PV 72.8 / SV 73.0 / MV 72.8 % (mula sa drawing). `docs/hmi/operating-points.json` naitama.
  - Plant model: kapag ang gate ng drawing ang pumipili ng 0 (isolation sarado), 0 ang flow at hindi tinatabunan ng plant model ang logic.
  - Coal feeder model: ang feedrate = feeder MV (T/H) habang tumatakbo ang feeder (M.0142 / M.0152 / M.0162), 0 kapag huminto.
- **As Left (headless, Start at 150 MW + 300 s):** feeders 28.97 T/H (snapshot 29.0 / 29.1 / 28.9); coal master PV 86.9 / SV 86.9 / MV 72.4 % (87.0 / 87.4 / 73.0); FIC-CF PV 72.4 = SV; HS-COAL PV 81.5 (81.2); oil term 0. Regression: isolated PASS, tests PASS, reset 0 differ, hmi_op 30 / 30, plant_live PASS, scenarios 244 / 0.
- **Hindi pa nasubok:** bilang ng mismatch sa PLANT LIVE (hindi muling binilang); totoong device.
- **Status:** Beta.
