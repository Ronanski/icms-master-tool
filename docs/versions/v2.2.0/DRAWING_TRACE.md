# 2.2.0 — Trace bago ang engine change (PROJECT_RULES 5c)

## beta.1 — Coal feeder A / B / C (ABC-004A / B / C): ang MV ng feeder ay % ng 0 ~ 40 T/H

- **Saklaw:** ABC-004A, ABC-004B, ABC-004C lang (unit conversion sa hangganan ng signal, gaya ng ABC-009A / B mill speed at ng ABC-001C boiler master). Walang gate, selector o link na binabago. Ang MAN station sa ibang sheet ay hindi ginagalaw.
- **Drawing (ABC-004A):**
  - MAN FICCL1061A "COAL FEEDER A FLOW CONTROL 0.0 ~ 40.0 T/H" (S1-MDL011). AUTO-MV (A leg) = SI0111 = SI0116 = FIC-CF.MV + SI0110 (A-BIAS sa LN23, "-20% ~ 20%").
  - FICCL1061A.MV ay pumupunta sa: AO0231 (INVERTER ng feeder, %), H/ "≥ 83.3 %" (M.014F), "FICCL1061A MV HIGH LIMIT SETTING VALUE 100 % / 83.3 %", at sa SI0113 (gated ng C/F A RUNNING).
  - PID FIC-CF "COAL FLOW CONTROL 0.0 ~ 100.0 %": PV = SI0143 = 1/3 × (SI0113 + SI0123 + SI0133) = average ng 3 feeder MV (%). SV = FIC-CM.MV (coal master, %).
  - FIC-CF BU-CMD: RB-MV = SI0145 = FICCL1061x.MV − bias (T/H, kapag naka-MANUAL ang feeder: bumpless).
  - Run-back ng feeder (RB-MV, SI0112 = RATE "1T / Sec" ng SI0117 = 4T / 8T o MV): T/H. Hindi binabago.
- **Snapshot (11.png):** MICL1061A / B / C PV 29.0 / 29.1 / 28.9 T/H, SV 29.1 T/H, MV 72.8 % (= 29.1 / 40), BIAS 0.0. COAL MASTER CONTROL (FIC-CM) R: PV 87.0 T/H, SV 87.4, MV 73.0 %.
- **Mali sa engine (2.1.0):** ang simulator ay nagdadala ng engineering unit, kaya ang MAN output ay T/H (29.1). Ang PV ng FIC-CF ay naging T/H (≤ 40) habang ang SV ay % (73.0): hindi kailanman nagtatagpo. FIC-CF MV → 100 %, lahat ng feeder → 40 T/H (max). Ang M.014F ay 83.3 T/H (hindi aabot kailanman).
- **Pagbabago (sa hangganan lang, T/H sa loob ng station):**
  - AUTO-MV (%) → T/H: × 0.4 sa A leg ng SV switch ng MAN FICCL1061x.
  - SI0110 / SI0120 / SI0130 (bias, T/H) → % (× 2.5) bago idagdag sa FIC-CF.MV (%).
  - FICCL1061x.MV (T/H) → % (× 2.5) sa: SI0113 / SI0123 / SI0133 (PV ng FIC-CF), at sa DEV / SW ng bumpless return sa AUTO (AO0231 / AO0356 / AO0800 laban sa SI0116 / SI0126 / SI0136, "< 1 %").
  - H/ "≥ 83.3 %" → 33.32 T/H.
  - FIC-CF RB-MV SI0145 (T/H) → % (× 2.5).
- **HMI mapping (11.png) na mali:** ang "TOTAL COAL FLOW CORRECT." (R, PV 81.2 T/H, SV 81.2 T/H, MV 33.1 %) ay ang **HS-COAL** ("TOTAL COAL FLOW CORRECTION CONTROL 0.0 ~ 120.0 T/H", S1-MDL051), hindi ang FIC-CF. Patunay: MV 33.1 % → LN3 "CORR. 80 ~ 120 %" = 0.932; 87.0 T/H × 0.932 = 81.1 T/H (calorie-corrected total coal flow); COAL-CALOR BASE 4450 × 0.932 = 4148 ≈ "COAL CALORIE CORR. 4150 Kcal/Kg" sa screen. Ang FIC-CF ay wala sa screen; ang operating point nito ay mula sa drawing: PV = average feeder MV 72.8 %, MV = 72.8 % (AUTO-MV ng feeder, bias 0), SV = FIC-CM.MV 73.0 %, REMOTE.
- **Patunay na kailangan:** sa Start at 150 MW, feeder SV 29.1 T/H / MV 72.8 %, FIC-CF PV ≈ SV ≈ 73, HS-COAL PV 81.2; regression (hmi_op, reset, isolated, scenarios ABC-004A).
