# Loop check checklist — Circulating Water (seawater), plant model 3.2.1-beta.1

Para sa team (loop check, memory #89): totoong pindot sa HMI page ng Circulating Water, isang tag bawat linya. Isulat ang PASS / FAIL at
screenshot. Ang inaasahan ay galing sa `CW_PLANT_MODEL.md` (vendor curve + SOP). Simula: RUN, plant model ON.

## A. Panimula
1. Start at 150 MW. Inaasahan: 2 SWP RUNNING (B, C sa 30.PNG line-up), PG-SW1501 2.2 ~ 2.4 kg/cm2, condenser inlet PT-SW1110-A1 / B1
   1.0 ~ 1.15, outlet A2 / B2 mga 0.4 kg/cm2 mas mababa, S-1502 DP mga 500 mmH2O, outlet temp TT-SW1110-A2 / B2 33 ~ 36 °C.
2. Current IT-P1501B / C: mga 225 ~ 232 A (vendor). SOP 205 ~ 215 A: itala bilang UNUSUAL, hindi FAIL.
3. SWBP na tumatakbo: suction 1.0 ~ 1.1, discharge PG-SW1503 2.3 ~ 2.4, current mga 90 A.

## B. Seawater pump (bawat isa: A, B, C) — logic DITL-29A / 29B
1. STOP ng isang tumatakbong SWP (faceplate STOP + EXECUTE). Inaasahan: STOPPED (berde), current 0, PG 0; ang kabilang pump ay
   tumataas ang flow, bumababa ang PG nito; condenser inlet bumababa.
2. Lahat ng SWP STOP. Inaasahan: lahat ng flow at pressure 0, current 0; SWBP: "any SWP running" = N sa permissive (DITL-30); vacuum
   bumabagsak (turbine trip sa 150 MW).
3. Itakda ang discharge valve sa 10 % (field), START. Inaasahan: 500 A habang umaakyat (mga 10 s), saka mga 228 A; PG mga 3.9 kg/cm2;
   flow mababa sa 5,000 m3/h (min flow): bilang ng segundo sa shut-off ay tumataas (EBARA: buksan sa loob ng 2 min).
4. Buksan ang discharge valve hanggang PG 2.2 ~ 2.4. Inaasahan: flow tumataas, PG bumababa.
5. Isang SWP lang, valve 100 %: flow lampas 22,680 (run-out, UNUSUAL flag), PG mga 1.1. Ito ang dahilan ng SOP na i-adjust ang valve.
6. Trip interlock DITL-29B: bearing TT-SW1501-x3 / x4 > 100, winding xU / xV / xW > 155, vibration x1 / x2 > 11.9 (B: 16.8), 5 s →
   TRIP INTERLOCK → pump STOP. (Paraan: force ng value sa test tool; walang pindutan ang operator.)
7. Permissive Y / N: Remote, not tripped, not auto (DITL-29A). Y = pula.

## C. Condenser path A / B (field valves)
1. Outlet V-SW1009 / 1010 40 % → 22 %. Inaasahan: inlet pressure tumataas (mga 2.5 ~ 2.6), flow bumababa, outlet temp tumataas.
2. Balik sa 40 %: inlet 1.0 ~ 1.15.
3. Inlet V-SW1007 sarado (path A). Inaasahan: path A flow 0, path B mas mataas na flow.

## D. Debris filter S-1502 / S-1504 — logic DITL-39
1. IN OPERATION (auto start). Inaasahan: kapag DP ≥ 800 mmH2O, backwash 3 min, DP bumababa.
2. NOT IN OPERATION: DP tumataas habang may flow (walang backwash).

## E. Booster pump (A, B, C) — logic DITL-30
1. START na walang SWP running: hindi tatakbo (permissive N).
2. START na may SWP: mga 274 A sa unang 5 s (Y/Δ), saka mga 90 A; discharge 2.3 ~ 2.4 kapag bukas ang valve.
3. Discharge valve 5 % (SOP auto-vent): discharge mga 3.0 ~ 3.1 (malapit sa shut-off 19.9 m), current bumababa.
4. S-1504 DP mga 500 ~ 750 mmH2O sa 2 SWBP.

## F. Hindi sakop ng model na ito
Hypochlorite (field lang), priming air ejector, tube cleaning, tide ng forebay.
