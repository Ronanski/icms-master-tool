# OPERATOR GUIDE — Manu-manong cold start-up hanggang 150 MW, at normal shutdown (Taglish)

Para sa DCS engineer na natututong mag-operate. Ang app (Logic Simulator 2.2.0-beta.21) ay sumusunod sa drawing (ABC analog logic) at sa procedure ng planta PR-OPE-5002-02 (cold start-up). Ang bawat hakbang dito ay ang **ginagawa ng CHECK scenario nang awtomatiko** (CHECK → M4 · Cold start-up (buo)); dito ikaw mismo ang pipindot.

**Paano basahin:** `Sheet · Tag` = saan ang faceplate (ABC page → sheet → click ang controller, o OPERATOR tab). **M** = MANUAL, **A** = AUTO, **L** = LOCAL (SV mo), **R** = REMOTE (SV mula sa logic). "Permissive" = kondisyon ng drawing bago tanggapin ang pindot mo; kapag hindi pa tama, babalik sa M / L ang station (force manual = BU-CMD, nananatili hanggang pindutin mo ulit ang A).

**Bilis ng oras:** sa app ang 1 s real ≈ 100 s plant kapag "mabilis" ang Simulate. Ang totoong cold start-up ay ~14 h (boiler manual Fig 2); sa app ~7 h plant time.

---

## 0. Bago magsimula — Start cold

⚙ → **Start cold**. Estado: drum 0 kg/cm2, tubig at bed 30 °C, walang coal, turbine sarado, lahat ng controller L + M 0 %.

Tingnan sa PLANT → UNIT: MSP 0, drum level ≈ 0 mm, MW 0.

**Alarm / trip limits na babantayan sa buong start-up** (drawing + DITL):

| Signal | Alarm | Trip (MFT) | Saan |
|---|---|---|---|
| Drum level | ±150 mm (HIGH / LOW) | **+254 mm HH** (M.0173 / M.0175), **−254 mm LL** (M.0170 / M.0172) | ABC-010 |
| Furnace pressure | +30 mmH2O HIGH (M.3107), −50 LOW | **+300 mmH2O HH** → MFT, PAF / SAF trip | ABC-008 |
| Main steam pressure | — | **72.9 kg/cm2 LOW LOW** (M.310D → DITL-40) kapag nakakarga; **150 blow-off** | ABC-001C / 013 |
| Main steam temperature | ≤ 535 °C (TAB_9); 541 normal | — | ABC-012 |
| Saturation temp. rate | **≤ 110 °C/h** (Fig 1, drum stress) | — | UNIT screen "sat °C/h" |
| Bed temperature | coal batch 400 ~ 600; tuluy-tuloy > 600; feeder C > 650; retract burner > 700 ~ 750 | — | UNIT / ABC-004A |
| Main steam flow | **< 220 T/H → BU-CMD**: HIC-BM, O2 trim force MANUAL; AUTO ulit > 230 | — | ABC-001C M.2013, ABC-002 M.0102 |
| Feedwater flow | **< 100 T/H → FICFW1007 force MANUAL** (M.022C → M.0228); 3-element > 100 | — | ABC-010 |
| Total air | LN40 cross limit: 414 T/H → 0 fuel, 446 → 35 % (minimum air) | — | ABC-002 |

---

## 1. Purge at light-off (hakbang 1 ng PR-OPE-5002)

| # | Gawin | Permissive / dahilan (drawing) | Inaasahan |
|---|---|---|---|
| 1.1 | Start **PAF, SAF, IDF** (DITL / Logic flags: M.3302, M.3303, M.3304 = 1). | PA / SA / furnace loops ay force MANUAL habang hindi tumatakbo ang fan (ABC-007 M.0180 / M.0190, ABC-008 M.0205). | Fan running sa UNIT. |
| 1.2 | **ABC-007 FICFA1071 at FICFA1081: M**, MV paakyat hanggang total air > 150 T/H (> 25 % MCR). **ABC-008 PICFG108 M** ≈ 10 ~ 16 %: furnace −15 mmH2O. | Purge 5 min (procedure). PICFG108 ay force manual sa MV < 14 % (M.0205): sa start-up mano-mano ang hydraulic coupling. | Air > 150 T/H sa 5 min; furnace −50 ~ +30 mmH2O. |
| 1.3 | **Burner A at B**: supply oil valve (1)(2) bukas (ABC-004A M.3410 / M.3411 inputs), BURNER IN SERVICE (M.3412 / M.3413). **ABC-003A / 003B FICDO1043A / B: M 60 %.** Bawasan ang hangin sa minimum. | Oil ≥ 0.61 T/H minimum bawat burner, max 3.08. | Oil A, B > 0.5 T/H; bed at tubig umiinit. |
| 1.4 | Bantayan ang **saturation temp. rate** (UNIT). +5 % oil kapag < 85 °C/h at > 5 kg/cm2; −5 % kapag > 100 °C/h. | Fig 1: ≤ 110 °C/h. | Tubig 30 → 100 °C bago tumaas ang pressure; drum 0 → 30 kg/cm2 sa ~4 h. |
| 1.5 | Sa 15 kg/cm2: **burner C at D** (ABC-003C / 003D), parehong paraan. | — | 4 burner, bed ≥ 400 °C sa 30 kg/cm2 (coal permissive). |
| 1.6 | Vents sarado sa 2 kg/cm2; MBD / CBD sa > 10; aux steam warming > 12 kg/cm2 (PCV-AS1010 → 10). | PR-OPE-5002. | — |

**Drum level sa hakbang 1:** **ABC-010 LICBR1001B (start-up valve) A, SV 0 mm** — ito lang ang pinapayagan ng drawing habang FICFW1007 at LICBR1001A ay M (M.0226 = NOT FICFW1007.MAN OR NOT LICBR1001A.MAN). Kapag bumababa ang level sa −60 habang tumataas ang steam: **LICBR1001B M, +5 % kada minuto**, ibalik sa A (SV 0) kapag tumigil ang pagbaba (huwag +10 at hintayin ang −20: +243 mm ang resulta).

---

## 2. Coal transfer (hakbang 2)

| # | Gawin | Permissive | Inaasahan |
|---|---|---|---|
| 2.1 | **ABC-013 PICMS1002 (MS blow-off) A, SV 35 kg/cm2** — hawak ang pressure habang wala pang bypass. | — | MSP ≈ 35. |
| 2.2 | **ABC-004A FIC-CF M 10 %** (≈ 4 T/H bawat feeder, minimum). | Coal master FIC-CM ay force MANUAL (M.0130) hanggang hakbang 5. | — |
| 2.3 | **Bed 400 ~ 450 °C: batch ng feeder A** — M.3400 ON 10 s / OFF 60 s (PR-OPE-5002). | Coal nasusunog lang sa mainit na bed. | Bed tumataas. |
| 2.4 | **Bed > 600 °C: feeder A tuluy-tuloy** (M.3400 = 1), tapos **FICCL1061A A** (AUTO). Bawas oil 5 % kada minuto. | Drawing: feeder ay force MANUAL habang nakatigil (M.0141); AUTO lang kapag RUNNING (TON). | Feeder A sumusunod sa FIC-CF. |
| 2.5 | **Feeder B** (M.3401) kapag stable; **feeder C** (M.3402) sa bed > 650 °C. FIC-CF paakyat sa 15 % (6 T/H bawat feeder). | Saturation ≤ 110 °C/h. | 3 feeder AUTO, ~18 T/H. |
| 2.6 | **Bed > 700 °C: retract ng burner** A, D, B, C isa-isa (supply valve sarado, BURNER IN SERVICE = 0) hanggang > 750 °C. | — | Oil 0; lahat ng burner out. |
| 2.7 | O2 3.5 ~ 5.5 %: PA / SA MV ±2 % kada minuto. | — | O2 3 ~ 10 %. |

**Limestone:** sa full coal (procedure); hindi pa kasama sa scenario.

---

## 3. Bypass system at pressure raise (hakbang 3)

| # | Gawin | Permissive | Inaasahan |
|---|---|---|---|
| 3.1 | **ABC-050 PICMS1006 (HP bypass) A, LOCAL, SV = kasalukuyang MSP** (hal. 80). **ABC-013 PICMS1002 A, SV = HP SV + 5.** **ABC-052 PICHR1003 (LP bypass) A SV 7.6.** **ABC-054 PICHR1391 (RH blow-off) M 20 %** (bukas sa warming). | Bumpless: SV = PV bago AUTO (PR-OPE-5002 7150). Kung SV 50 habang 80 ang PV: bubukas nang todo ang bypass → drum −148 / +243 mm, RH 12 kg/cm2. | HP bypass 1 ~ 3 % warming; RH 1 ~ 2 kg/cm2 → 4 → 7.6. |
| 3.2 | Apoy: **FIC-CF +1 % kada 5 min** habang ≤ 90 °C/h at MSP < SV − 1; **−1 (o −2) kapag MSF > 65 T/H o MSP > SV + 0.5**. | Fig 1. Minimum 10 % (3 feeder). | MSF 40 ~ 55 T/H. |
| 3.3 | **Bypass servicing sa MSP ≥ 48 at MSF ≥ 40 T/H:** HP bypass **SV +1 kg/cm2 kada minuto hanggang 123** (kapag MSP ≥ SV − 1); blow-off SV = HP SV + 5 (sasara); **RH blow-off −5 % kada minuto hanggang sarado** kapag RH < 8.2. | PR-OPE-5002 BYPASS SYSTEM SERVICING: HPBV 5 %, LPBV 1 %, RH blow-off sarado, LPBV AUTO 7.5 ksc, MS blow-off sarado. | 50 → 123 sa ~2 h; HP bypass ang kumukuha ng steam. |
| 3.4 | **RH pressure > 8.5:** RH blow-off +10 % kada minuto (+5 sa > 8.2). | LP bypass PID nahuhuli ~5 min kapag bumubukas ang HP bypass. | RH 7.5 ± 1.5 (sa app umaabot sa 9.0 nang ilang minuto: kilala, marginal). |
| 3.5 | Furnace −15 mmH2O sa **PICFG108 M** (±1 % kada minuto). O2 3.5 ~ 8 sa PA / SA. | — | Furnace −55 ~ +25. |
| 3.6 | Drum level: LICBR1001B A SV 0; kamay gaya ng 1.x kapag < −60 mm. | FICFW1007 force MANUAL (M.0228: FW < 100 T/H) — tama ayon sa drawing; 3-element sa hakbang 4. | ±150 mm. |

**Admission permissive bago ang roll (procedure):** HP steam > 57 kg/cm2 at > 345 °C; IP > 7 kg/cm2 at > 201 °C; MST ≤ 535 °C.

---

## 4. Turbine roll, sync, load up 45 MW (hakbang 4)

| # | Gawin | Permissive | Inaasahan |
|---|---|---|---|
| 4.1 | TCS panel (⚙): **ROLL** (120 rpm/min, IP start mode: steam mula sa reheat sa ICV). | 123 kg/cm2 sa HP bypass AUTO, LP bypass AUTO 7.6, bed 750, burners out. | 0 → 3600 rpm sa 30 min. |
| 4.2 | Sa roll: steam flow 23 → 86 T/H. **Kapag MSF > 60 T/H (o start-up valve > 30 %): LICBR1001B M (hawak), ABC-010 LICBR1001A A SV 0 (single-element sa main valve), LICBR1001B pasara 5 % kada minuto.** | M.0227 = NOT LICBR1001B.MAN: isa lang ang level controller; M.0222 = 1: FICFW1007.MV = LICBR1001A.MV. Kung hihintayin ang level −148 bago lumipat: 252 T/H → +236 mm. | Level ±100 mm. |
| 4.3 | Sa 3600 rpm: **SYNC** (GCB 52G1 sarado: ABC-050 I.0931 = 1 / I.0932 = 0). Initial load 4.5 MW. **ABC-052 PICHR1003 R** (REMOTE SV = first stage + 5.1). 5 min hold. | Sync pulse M.070D: HP bypass SV → REMOTE (PV + 2) ng drawing, kaya sumasara. Kung hindi lumipat: pindutin ang R. | GCB sarado, 4.5 ± 1 MW. |
| 4.4 | **LOAD UP 45 MW** (5 %/min = 7.5 MW/min). Coal: **FIC-CF +2 ~ 3 % kada minuto** paakyat (+3 kapag MSP < 118), ±1 pagkatapos para hawak ang 123. | HIC-BM MANUAL (BU-CMD: MSF < 220). | 4.5 → 45 MW sa 5 ~ 12 min; MSP 123 ± 8. |
| 4.5 | Sa 15 ~ 22 MW o ICV full open: **ICV → CV transfer** (I.0418 = 1). LP bypass: preset 33 % ng drawing (M.070F) — **isara mo sa M, −10 % kada minuto hanggang 0** (M.071D nagre-reset ng FF), tapos **R + A** ulit. | Drawing ABC-050 / 052. | HP at LP bypass sarado sa 45 MW (M.0709 = 0). |
| 4.6 | **FW > 110 T/H at M.0228 = 0** (FW > 100 sa loob ng 60 s): **FICFW1007 R** (SV = steam flow + level master), **LICBR1001 (level master) A SV 0**, pindutin ang **3-ELEMENT pushbutton (M.054E)**. | Ilagay muna ang LICBR1001 sa M 0 % bago ito (kung nag-wind up sa 100 %: SV 156 + 100 → FW 252). Kapag bumalik ang force manual (FW dip < 100): **FICFW1007 R + A ulit at 3-ELEMENT ulit** — hindi kusang babalik (BU-CMD latch). | M.0228 = 0, M.0222 = 0, FICFW1007 R + A, LICBR1001B 0 %. |
| 4.7 | O2 3.5 ~ 8 (PA / SA); furnace −15 (PICFG108 M). | — | MW ≥ 44.5, I.0081 = 1 (NORMAL OPERATION). |

---

## 5. 45 → 150 MW: coal master REMOTE, boiler master AUTO, CCS (hakbang 5)

| # | Gawin | Permissive | Inaasahan |
|---|---|---|---|
| 5.1 | **ABC-004A HS-COAL M 33.1 %** (COAL CALORIE CORR. 4150 kcal/kg, 11.png). | LN3: 0.932 corr. | — |
| 5.2 | **FIC-CF A (LOCAL) sa SV = PV** muna. | Habang LOCAL ang FIC-CF, ang COS ng FIC-CM ay tumutunton sa SV ng FIC-CF: bumpless ang REMOTE. SV 0 = coal 0! | Coal walang galaw. |
| 5.3 | **ABC-002 HIC-TADBS (PA FLOW BIAS) M 0.** | Ang −30 T/H ng 7.PNG ay trim sa 150 MW; sa minimum air 446 binabawas nito ang kabuuang hangin sa 416 → LN40 pumuputol ng coal demand. | PA 285 + SA 161 = 446 T/H. |
| 5.4 | **ABC-007 FICFA1071 at FICFA1081 R** (REMOTE: air demand ng ABC-006 LN5, minimum 446). | PAF / SAF running. | Air ≥ 446 T/H; O2 trim (ABC-002 AICFG112) force MANUAL < 220 T/H: **ilagay sa 50 %** (neutral). |
| 5.5 | **FIC-CF R.** Hintayin na pumantay ang **SV ng FIC-CM (SI0141) sa coal** (UNIT: ilipat ang HIC-BM M nang kaunti kung kailangan), tapos **FIC-CM R + A**. | M.0130 = 0: FIC-CF, PA, SA REMOTE. | FIC-CM R + A, SV = PV. |
| 5.6 | **Boiler follow by hand:** ⚙ TCS TARGET MW paakyat **0.5 ~ 3 MW/min ayon sa MSP** (3 sa ≥ 124, 1.5 sa ≥ 121, 0.5 sa ≥ 118, tigil sa ilalim); **HIC-BM M dinadagdagan lang** habang MSP < 123 (huwag ibaba: malapit sa minimum air ang pagbaba ay pumuputol ng fuel demand sa LN40). | HIC-BM MANUAL hanggang 230 T/H. | MSP 118 ~ 127. |
| 5.7 | **SH spray:** ABC-011 **TICBR1130 A sa 394 °C** kapag ≤ 5 °C na lang ang PV sa SV, **TICBR1140 A 462**, tapos **TICBR1130 R**; ABC-012 **TICBR1150 A 418 → TICMS1004 A 541 → TICBR1150 R**. | PR-OPE-5002: desuperheater AUTO ayon sa start-up curve; steam temp. controls AUTO > 60 % load. 4.PNG: inner R, outer A. | MST 541 sa 150 MW; MV ≈ 58 / 30 %. |
| 5.8 | **Sa MSF > 230 T/H at M.2013 = 0:** **PIC-COBM A SV 123**, **HS-COAL A**, **HIC-BM A**. | PR-OPE-5002 "At 230 T/H MSF put Boiler Master to Auto (Boiler Follow)". Kung bumalik ang BU-CMD (MSF < 220): HIC-BM mananatiling M — pindutin ulit ang A kapag > 230. | ABC-001C: O.0178 pulse → TCS → **I.0082 = 1 (DCS CONTROL MODE ON) sa 2 ~ 3 s.** |
| 5.9 | **EIC-TM A** kapag **AO0359 TO TCS (SI0236) = TCS target** (bumpless). | M.2016 = 0 (boiler master AUTO, I.0082 = 1). Kung A bago pumantay: target bababa, MSF < 220, HIC-BM balik M (deadlock). | EIC-TM A. |
| 5.10 | **HIC-ULD A, TARGET 150 MW** (HIC-MWRL 3 MW/min). | CCS. | 150 MW sa ~31 min. |
| 5.11 | **ABC-002 AICFG112 (O2 trim) A** sa > 220 T/H kapag malapit sa SV ang O2; **ABC-008 PICFG108 A** kapag MV ≥ 16 %. | M.0102 / M.0205. | O2 4.3 %, furnace −15. |

**Sa 150 MW dapat tugma sa 4.PNG / 03.png:** MW 148.8 ~ 150, MSF 472.7 T/H, MSP 122.9, coal 87 (3 × 29), FIC-CF 72.8 %, HIC-BM 68.3 %, MST 540 / RHT 541, RHP 33.6, spray 57.6 / 30.2 %, O2 4.3, PA ≈ 355 ~ 380, drum ±50 mm, EIC-TM / HIC-BM / PIC-COBM A, FIC-CM R.

---

## 6. Kung may mali — mabilis na pagbasa

| Nakikita | Dahilan (drawing) | Gawin |
|---|---|---|
| HIC-BM bumalik sa M | BU-CMD M.2013: MSF < 220, HP bypass > 5 %, turbine trip | Itaas ang load > 230, pindutin ulit ang A |
| FIC-CM hindi tumatanggap ng A / R | M.0130: FIC-CF / PA / SA hindi REMOTE | Gawin ang 5.2 ~ 5.5 |
| Coal demand bumababa sa 0 habang sapat ang HIC-BM | LN40 cross limit: total air < 446 | Itaas ang hangin (TADBS 0, PA / SA R), huwag ibaba ang HIC-BM |
| FICFW1007 M / L kahit FW > 100 | force manual latch pagkatapos ng dip < 100 | R + A ulit, 3-ELEMENT ulit |
| O2 trim nananatiling M | M.0103 / M.0102: < 220 T/H o cross limit aktibo | 50 % muna; A sa > 220 |
| PICFG108 hindi tumatanggap ng A | M.0205: MV < 14 % | Itaas ang MV ≥ 16 % |
| Drum level bumagsak sa roll / load up | start-up valve nahuhuli (MSF 23 → 157 T/H) | 4.2: main valve maaga, LICBR1001A A |
| RH pressure > 9 sa bypass | LP bypass PID nahuhuli | RH blow-off M +10 % kada minuto; isara sa < 8.2 |

---

## 7. Normal shutdown: 150 → 30 MW, turbine trip, bypass, SUB out, purge, fans at BFP stop (PR-OPE-5003)

Ito ang ginagawa ng **CHECK → M5 · Normal shutdown (buo)** (~4 min real, 3 h 18 min plant time; "M5 · Load down 150 → 30 MW" = unang bahagi lang, ~1.5 min). Simula: ⚙ → **Start live (150 MW, start-up / shutdown physics ON)**, speed 300x. Ang HIC-ULD TARGET MW ang bumababa (CCS), ang boiler ang sumusunod; sa ilalim ng 220 T/H ikaw na ang humahawak ng firing.

| # | Gawin | Permissive / drawing | Inaasahan |
|---|---|---|---|
| 7.1 | **ABC-001A HIC-ULD TARGET 100 MW** (3 MW/min), hintayin; tapos **75 MW**. | CCS: EIC-TM A, HIC-BM A, PIC-COBM A 123. | MSP 117 ~ 127 kg/cm2, drum ±80 mm. |
| 7.2 | **Sa MSF < 220 T/H:** HIC-BM at EIC-TM ay **M nang kusa** (ABC-001C M.2013 BU-CMD, M.2016). Hawakan mo ang **HIC-BM M** (firing): −1 % kada minuto kapag MSP > SV + 1, +1 kapag < SV − 1. | BU-CMD = protection (CLAUDE.md 10): hindi babalik sa A nang kusa. | DCS control mode I.0082 = 0; MSP hawak sa 117 ~ 125. |
| 7.3 | **Sa MSF ≈ 230 T/H: ABC-010 1-ELEMENT** (Buttons: M.054F pulse) → M.0222 = 1. **FICFW1007 at LICBR1001A: LICBR1001A A** (single element: level controller → main valve). | M.0222: FICFW1007 SV = LICBR1001A.MV. | Drum −80 ~ +90 mm; ang main valve ay umuugoy 0 ~ 40 % sa mababang load (PID ng 1-element; level nananatili ±30 mm). |
| 7.4 | **Sa MSF < 120 T/H (2 min): start-up valve.** **FICFW1007 M at LICBR1001A M 10 %** (main valve by hand), tapos **LICBR1001B A SV 0**. Buksan ang main valve +5 % kapag level < −80, isara −3 ~ −5 % kapag > 0 ~ 60 mm. | M.0226 = OR(NOT FICFW1007.MAN, NOT LICBR1001A.MAN): AUTO ang LICBR1001B kapag MANUAL ang dalawa. | FW ≈ MSF; drum −80 ~ +90 mm. |
| 7.5 | **TARGET 60 MW**, tapos **45**, tapos **30 MW**. Sa **60 MW (bed ≈ 720 °C): SUB (oil) in service**: ABC-004A oil valves M.3410 / 3411 (burner A / B) at ABC-004B M.3416 / 3417 (C / D) = 0 (bukas), M.3412 / 3413 / 3418 / 3419 = 1, **FICDO1043A ~ D M 30 ~ 40 %** (oil muna bago bawasan ang coal, para hindi bumagsak ang pressure). | PR-OPE-5003: "At 60 MW put SUB in service". | Oil 9 ~ 14 T/H, MSP hawak. |
| 7.6 | **Coal out, isa-isa (mula ~54 MW, 5 min pagitan):** **FIC-CM M** ibaba −1 ~ −2 % kada minuto hanggang 10 %, tapos **feeder A off (M.3400 = 0)**, B (M.3401), C (M.3402, M.3405 = 0). Ang demand ng coal master ay KABUUAN: kapag may pinahinto, ang bahagi nito ay napupunta sa natitira, kaya ibaba muna ang FIC-CM. Sa huling feeder: oil +30 %. | Feeder running bits sa ABC-004A ~ C. | Coal 0 sa 30 MW; MSP ≥ SV − 2 bago ang bawat stop; bed ≤ 700 °C. |
| 7.7 | **O2 / hangin:** PAF 20 %, **SAF (FICFA1081 M) −2 % / min habang O2 > 10 %** (minimum 15 %). | O2 trim M.0102 force manual < 220 T/H. | O2 < 12 %. |
| 7.8 | **Sa 30 MW: turbine trip** (ABC-050 Buttons `S2 I.0400` ON). | Procedure: turbine trip → MFT bypassed (boiler tumatakbo pa). | I.0932 = 1 (52G bukas), M.3200 = 1, MW 0 sa 60 s; **HP bypass BU-CMD M.0705 bumukas 100 %**, pulse M.0124; LP bypass A SV 7.6. |
| 7.9 | **HP bypass PICMS1006 A sa pressure**, SV −1 / min hanggang ~111, tapos **M 12 %** (minimum ng procedure). **Oil 20 %**, retract C / D. | Saturation ≤ 85 °C/h. | MSP max ≤ 150, RHP 4 ~ 9 kg/cm2, MSF 20 ~ 60 T/H sa bypass. |
| 7.10 | **ABC-020 biasing damper M: HICHR1002A (RH) 10 %, HICHR1002B (MS) 90 %.** | MAN parameter: ML 10 % (minimum 10). Bago ang beta.21 hindi makababa sa 19 % (bug, naayos). | 10 / 90 %. |
| 7.11 | **Bed (gas) < 535 °C: SUB out** (FICDO 0 %, valves sarado M.3410 / 3411 / 3416 / 3417 = 1, in-service bits 0), **HP / LP bypass at MS blow-off sarado**. | PR-OPE-5003: SUB out sa gas temp < 535 °C. | Oil 0, bypass 0 %. |
| 7.12 | **Purge:** PAF / SAF M para sa > 150 T/H hangin (dahan-dahan: furnace pressure ±30 mmH2O), 5 min, tapos **PAF / SAF / IDF off** (M.3302 / 3303 / 3304 = 0). | Furnace −60 ~ +30 mmH2O. | Hangin 0 T/H; bed lumalamig (≈ 310 °C). |
| 7.13 | **Drum level: punuin sa ~150 ~ 250 mm** (LICBR1001B M / FICFW1007 M) bago **BFP-A off (M.3343 = 0)**; FICFW1007 / LICBR1001A / LICBR1001B M 0. | Procedure: fill before BFP stop (HH +254). | FW 0; drum nakakulong ~122 kg/cm2 (bottle-up ang susunod, PR-OPE-5004). |

**Sa dulo dapat:** MW 0, coal 0, oil 0, hangin 0, MSP ≈ 122 kg/cm2 nakakulong, bed < 750 °C at lumalamig, MST ≈ 330 °C, HIC-BM / EIC-TM / FICFW1007 / PICFG108 M.

**Dagdag sa "Kung may mali" (shutdown):**

| Nakikita | Dahilan (drawing) | Gawin |
|---|---|---|
| MSP bumagsak < 100 habang binabawasan ang coal | coal pinutol bago ang oil; FF ng feeder stop | SUB muna (7.5), FIC-CM ibaba muna bago ang feeder stop |
| Drum level < −150 pagkatapos lumipat sa start-up valve | main valve sarado nang bigla; LICBR1001B mabagal | main valve 10 % muna (LICBR1001A.MV sa 1-element), +5 % kapag < −80 |
| HICHR1002A hindi makababa sa 10 % | (naayos sa beta.21: ML 10 % = 10 %) | i-update ang app |
| Pressure hindi bumababa pagkatapos ng fans off | walang heat-loss model habang nakakulong (bottle-up stage: PR-OPE-5004) | susunod na Beta |

Sanggunian: `docs/versions/v2.2.0/DRAWING_TRACE.md` (bawat permissive, net at drawing), `docs/versions/v2.2.0/CHECK_M2_M3.md` (mga tseke), `document-references/procedure-start-up-PR-OPE-5002-02.docx`, `procedure-normal-shutdown-PR-OPE-5003-01.docx`, `docs/hmi/OPERATING_POINTS.md` (4.PNG / 03.png / 02.png).
