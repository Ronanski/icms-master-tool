# Plant model — Instrument Air at Plant Air (3.2.1-beta.3)

IRENE : PLANT MODEL, 2026-11-04 PHT. Utos ng user (2026-11-04, sa coordinator): "Gawin nio lng ng gawin, basta tama connection, flow,
at plant model, at dapat may communication sya sa logic na ABC DITL." Pinalitan nito ang fixed rates ng 3.2.0-beta.68.
Code: `src/analog/engine/unit.js` `AN_AIR` / `anAirStep`. Test: `tests/regress/air_model.js` (17 PASS).

## Connection (flow diagram K1AU3-PD-023 Rev C, sheet 1/6 plant air, 2/6 instrument air)
- Daloy: air intake / silencer → compressor C-0703A / B / C (PA) o C-0704A / B / C (IA) → dryer D-0703A ~ C / D-0704A ~ C (DITL-45, #B, #C) → common header → air tanks T-0705A / B (PA) o T-0706A / B (IA) → unit 1 (PT-PA1705 / PT-IA1706), unit 2, utility area.
- Ang tanks A at B ay iisang header: pareho ang pressure nila sa model.

## Sources (vendor data sa PC ng user, `document-references/tg-engineer-data/`)
- **Compressor, K1AU3-D1-0-059 R0 (IHI):**
  - Turbo compressor ang lahat: PA "TRE60-600kW TURBO COMPRESSOR" (flow sheet HT225374), IA "T2A TYPE TURBO COMP." (HT225405).
  - May constant pressure control loop (PIC, inlet guide vane), anti-surge loop (blow-off valve), at motor overload loop.
  - Instrument tag listing: PT-1DA discharge 0 ~ 1.5 MPa; TE-1DA H 55 / trip 60 °C; vibration VE-02 40 / 60, VE-03 30 / 45 µm.
  - Hindi nakasulat ang capacity (m3/h) at ang set point ng PIC / unload / reload (Modbus list: may address, walang value).
- **PA motor, TECO 3A057H186-74409 (sa D1-0-059):** 900 HP, 2 pole, 6600 V, 69.9 A sa 100 % load, LRC 560 A, soft start, winding RTD alarm 145 / trip 155 °C, bearing 95 / 100 °C, temp rise limit 80 °C (class F).
- **IA motor, TECO-YASKAWA FELA-8T (order M40328-1, outline P1309238):** 190 kW CONT, 460 V, 2 P (RATINGS table; ang thermal sheet ay may 165 kW); 286 A sa 190 kW; starting current sa reactor 80 % tap = 532 % (torque / current curve).
- **Tanks:** D1-0-059 document index at PD-023: T-0705A / B 10 m3 (PA), T-0706A / B 5 m3 (IA); max working pressure 0.98 MPa.
- **Dryer, K1AU3-D1-0-065 (JMEC):** refrigerated dryer J2E-1500SN (PA), J2E-400SN (IA), may air filter bago at pagkatapos. Walang capacity sa m3/h na nakasulat.
- **Air buffer tank, K1AU3-D1-0-070:** para sa biasing damper (T-1064A/B) at turning gear (T-1128), hindi bahagi ng compressed air header na ito.
- **SOP PR-OPE-5002:** "at least one (1) IA compressor and one (1) PA compressor are running"; "compressed air pressure is up to 7 Kg/cm2"; start ng compressor sa local panel ("Ensure the compressor is in Local Position", "Initiate RUN").
- **HMI snapshot 39.PNG:** IA buffer 7.0 kg/cm2.
- **Alarm list "Alarm List _20160912":** tanks at unit header L 5.0; IA LL 3.5; PSL-IA1706 2.8 (trip), PSL-PA1705 2.8 (alarm).
- **I/O list:** ranges 0 ~ 10 kg/cm2; dryer outlet flow FI-D0703x 0 ~ 5800, FI-D0704x 0 ~ 2700 m3/h; current IT-C0703x 0 ~ 140 A, IT-C0704x 0 ~ 500 A.
- **Logic DITL-113 / 114 (PDF):** M.0300 / M.0310 = 2 sa 3 pressure < 5 kg/cm2 nang 3 s; START COMMAND ng bawat compressor = M.0300 AND NOT RUNNING AND NOT TRIP, pulse 5 s (O.0367 ~ 0369 IA, O.0047 ~ 0049 PA).

## Paano gumagana
- **Compressor:**
  - Tumatakbo kapag binigyan ng START COMMAND ng logic at REMOTE ang local panel nito, o kapag sinimulan ng field operator sa local panel.
  - Humihinto sa TRIP contact (test tool).
  - Ang model ang may-ari ng RUNNING contact (DITL-113 / 114 rows 6 / 13 / 20). Binabasa ito ng logic: auto start, DITL-42 "COMPRESSOR STOPPED".
- **Tanks:** dP/dt = (Q in − Q gamit) × 1.033 / V / 3600 (isothermal, free air m3/h). Sa 7.0 kg/cm2, hawak ng PIC: ang compressor ay nagbibigay lang ng ginagamit. Sa ibaba nito, buong capacity bawat compressor.
- **Gamit (consumption):** proportional sa absolute pressure (fixed openings).
- **Power:** proportional sa flow ng compressor, hindi bababa sa surge flow (ang sobra ay blow-off). 100 % = PA 600 kW, IA 165 kW.
- **Current:** current sa 100 % × kW / kW sa 100 % (PA 69.9 A sa 671 kW; IA 286 A sa 190 kW). Start: PA 3 × 69.9 A nang 10 s, IA 1522 A nang 3 s. Ang IT-C070xx ay hanggang sa range nito (140 / 500 A).
- **Winding temperature (PA, TE-M0703-x1):** 30 °C + 80 °C × (I / 69.9)², time constant 10 min.
- **Unit header:** tank pressure − 0.2 kg/cm2 sa design na gamit (kasama ang square ng gamit).
- **Dryer outlet:** tank pressure + 0.15 kg/cm2 sa design na flow; hinahati ang flow sa mga dryer na in service, sa tatlo kapag walang in service.

## Resulta (cloud test, Start at 150 MW, plant model ON)
- Tumatakbo ang IA-A at PA-A. Tanks 7.0 kg/cm2, unit header 6.8.
- IA-A current 186 A (124 kW), PA-A current 43.8 A (420 kW, blow-off sa surge flow), PA winding 61 °C.
- Trip ng IA-A: bumaba ang tanks sa 4.85, M.0300 ON, START COMMAND sa B at C (ayon sa drawing). B (REMOTE) ang tumakbo, C (LOCAL) hindi. Bumalik sa 7.0.
- Pareho sa PA (M.0310).
- Trip ng lahat ng IA compressor: header 1.2 kg/cm2 pagkatapos ng 5 min. Instrument air MFT rows ng DITL-03G (rows 7, 8, 10, 11, 27) = 1, at PSL-IA1706 LOW.
- Cold: walang compressor, tanks 0. Sinimulan ang IA-A sa local panel: tanks 7.0 pagkatapos ng 6 min.

## Mga kabit sa logic (ABC / DITL)
- Model → logic: PT-IA0706-A / B, PT-IA1706 → DITL-113 rows 1 ~ 3; PT-PA0705-A / B, PT-PA1705 → DITL-114 rows 1 ~ 3; IA pressure → DITL-03G (MFT 2 sa 3 < 3.5); PSL-IA1706 / -NC (2.8) → DITL-03G rows 7 / 27; RUNNING contacts → DITL-113 / 114 rows 6 / 13 / 20.
- Logic → model: START COMMAND (DITL-113 / 114 output rows 56 / 63 / 70); TRIP contacts rows 7 / 14 / 21; dryer RUNNING ng DITL-45 (#B, #C).

## NO-SOURCE (hindi nakita sa docs; nakasulat ang ginamit)
- Capacity ng compressor: PA 5800 m3/h (= range ng dryer flow meter; check: 600 kW ÷ 97 m3/min = 6.2 kW bawat m3/min), IA 1600 m3/h (165 kW sa parehong 6.2 kW bawat m3/min).
- Gamit sa 7.0 kg/cm2: IA 1200, PA 1500 m3/h (pareho sa 3.2.0-beta.68).
- Surge flow 70 % ng capacity.
- Soft start current limit ng PA (3 × FLC, 10 s) at start time ng IA (3 s).
- Line loss 0.2 at dryer ΔP 0.15 kg/cm2.
- REMOTE / LOCAL ng local panel: walang DCS signal. Sa 150 MW: ang tumatakbo at ang susunod na compressor ay REMOTE (standby ng auto start). Sa Cold: lahat LOCAL.

## UNUSUAL (para sa user)
- Sagot na (DATA_ANSWERS.md): ang IA motor ay 190 kW ayon sa RATINGS table ng outline P1309238; 165 kW ay nasa thermal withstand sheet lang. Ang 165 kW ay ginamit lang bilang power ng compressor sa buong flow (NO-SOURCE).
- Ang START COMMAND ng drawing ay napupunta sa LAHAT ng hindi tumatakbo at hindi naka-trip na compressor. Ang local panel (REMOTE / LOCAL) ang pumipili kung alin ang tatakbo.

## Keys (`AN.unit`)
`iaP`, `iaPA`, `iaPB`, `iaPU`, `iaPD`, `iaQ`, `iaUse`, `iaN`, `iaR0..2`, `iaT0..2`, `iaD0..2`, `iaF0..2`, `iaI0..2`, `iaKw0..2`, `iaRun`, `iaRem`; pareho sa `pa…`, at `paW0..2` (winding).

## Hindi pa ginawa
- Ang temperatura at vibration ng compressor (TE-1DA, VE-02 / 03): walang DCS signal.
- Ang start / stop ng compressor mula sa HMI page (local panel): ginagawa pa lang sa Training (field START).
- Hindi pa live-tested sa PC ng user.
