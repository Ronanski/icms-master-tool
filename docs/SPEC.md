# SPEC ng app (user, 2026-10-26) — iisang batayan

Ito ang gusto ng user, sa sarili niyang salita. Ito ang sukatan ng bawat gawa. Kapag may gawain na wala rito, itanong muna kung kailangan. Ang plano at listahan ng kulang ay nasa dulo ng file na ito (kapalit ng lumang `ROADMAP.md` at `CHECKLIST.md`; ang lumang laman ay nasa git history at `docs/versions/`).

> "Simple lang dapat ang app." — user

## 1. Ang spec

| # | Bahagi | Ibig sabihin (user) |
|---|---|---|
| S1 | **One world** | Magkakabit ang lahat ng DITL at ABC sheet. Iisang signal ang tag sa buong DCS. |
| S2 | **Viewer** | Madali ang pag-trace ng signal (VIEW: walang simulate / force / control, pero lahat ng tingin at trace ay gumagana). |
| S3 | **Simulate, plant model OFF** | Ang user ang naglalagay ng lahat ng value. Malayang mag-energize ng signal. Makikita ang response ng logic: ang output ayon sa input. |
| S4 | **Simulate, plant model ON** | May physics at steam table. Tunay na response sa bawat galaw sa controller, sa forcing at sa sinisimulate na value. |
| S5 | **Starting point 1: full load** (plant model ON lang) | 150 MW. Load down / up, CCS, boiler master, turbine master at coal master: AUTO / MANUAL ayon sa logic. |
| S6 | **Starting point 2: 0 load, cold start** (plant model ON lang) | Walang value lahat: zero o ang zero ng range nila. |
| S7 | **Training** | Cold start hanggang full load LANG muna. (Warm at hot start: HINDI muna kasama.) |
| — | **Paalala (user 2026-10-26)** | Ang dalawang starting point ay para lang sa SIMULATE na plant model ON. Kapag OFF, walang starting point: ang user ang nagtatakda ng lahat ng value. |
| S8 | **Library** | 1 I/O list · 2 wiring diagram · 3 loop diagram · 4 linears · 5 compensations · 6 memory list · 7 instrument list · 8 dictionary |
| S9 | **DCS graphics / HMI** | Plant overview, bawat system, equipment, permissives, atbp. |

## 2. Meron na at kulang (3.2.0-beta.40, 2026-10-26)

| # | Meron na sa app | Kulang / bukas |
|---|---|---|
| S1 | Laging iisang mundo ang ABC + DITL (mula beta.25, walang button). Page link ABC ↔ DITL, dalawang direksyon. | — |
| S2 | VIEW mode: click sa wire = trace, Search, info card ("Why?"), page link, Back. | Bahagi 2 ng VIEW audit: DITL, tablet at phone sa VIEW. |
| S3 | Plant chip katabi ng VIEW / RUN → **OFF**. Inputs list, force ng bawat input, A / M / R, SV, MV. | — |
| S4 | Plant chip → **Unit**: steam table IAPWS-IF97, mass / energy balance ng boiler, turbine + TCS (ATS step 0 ~ 7), vacuum, utilities na may trip. | (a) MST: TAPOS (pinakamataas 547.7 °C sa 80 MW, alarm 548). (a2) Reheat: TAPOS (541 °C sa 150 MW, reheat control sa AUTO). (b) RH biasing damper: TAPOS sa beta.40 (tama ang direksyon; binabasa na ang damper). (c) Wala pang model: aux cooling water, instrument air, APH sootblower, ESP. |
| S5 | Home → **At 150 MW** (galing sa HMI snapshot 4.PNG). Load up / down sa HIC-ULD, CCS, boiler / turbine master, coal master. | Kasama sa S4 (a). |
| S6 | Home → **Cold**: walang apoy, patay ang fans at pumps, MSP 0, FW 0. RUN na walang pinili = Cold. | — |
| S7 | Training → **Gabay: Cold → 150 MW** at **Practise: Cold start** / **150 MW load change**. Sunod sa PR-OPE-5002 + FHI Fig. 2. | Hindi pa nasubok ng user. |
| S8 | Library: **I/O list**, **Memory list**, **Wiring**, **Relay / SER**, **Calculations** (= compensations at drum level). **F(X) curves** page (= linears). | **Loop diagram**, **instrument list**, **dictionary**: wala pa. Walang hiwalay na file sa `document-references/`; gagawin mula sa ABC sheet + I/O list + wiring (loop), I/O list + ranges (instrument), textbook + legends (dictionary). |
| S9 | Plant view: 28 screen na kopya ng HMI (UNIT, steam, air, coal, burners A ~ D, ash, sootblower, limestone, sand, condensate, seawater, turbine oil, generator…), faceplate sa bawat controller. | 560 / 1330 item lang ang live (ang iba ay walang signal sa ABC: snapshot value). Walang hiwalay na **plant overview** at **permissives** screen (bukod sa burner 012 ~ 015). |

**Tinanggal na (beta.39):** Plant chip **Per-loop** mode, starting state **Warm** at **Hot** (hindi sa spec; sabi ng user: pampahaba ng code at pampagulo).

## 3. Plano (sunod-sunod, inaprubahan ng user 2026-10-26; Library ang huli; i-update kapag may natapos)

Ang user ay susubok lang sa DULO ng buong plano (gabay: `docs/USER_CHECK.md`).

1. [x] **Tinanggal ang Per-loop, Warm at Hot** (3.2.0-beta.39, 2026-10-26): plant chip = OFF | Unit lang; starting state = Cold at 150 MW lang (chip, Home, Start menu); wala na ang engine ng loop study at ng warm / hot start. Ang mga CHECK stage (coal, byp, roll) ay sa loob na lang ng buong chain.
2. [x] Plant model (3.2.0-beta.40): TAPOS: stall sa bypass (hakbang 43, dati na), RH biasing damper (ABC-020), "null" sa DITL header, header ng Cold ("—" bago pumili). TAPOS din (ikalawang batch): hakbang 57 (MS blow-off SV), SH temperature chain, air side ng Cold. TAPOS din (ikatlong batch, 2026-10-27): reheat sa AUTO (541 °C sa 150 MW), MST pinakamataas 547.7 °C (alarm 548), hinto sa 3600 rpm heat soak; mouse Cold run TAPOS hanggang Practice (UPDATE_REPORT, seksyon ikatlong batch).
3. [ ] Starting points: Cold at 150 MW para sa plant model ON lang; kapag OFF, walang starting point (ang user ang naglalagay ng value). Suriin sa app na ang pagpili ng starting point ay nag-o-ON ng plant model.
4. [ ] Training Cold → 150 MW laban sa SOP (PR-OPE-5002), kasama ang negative test (`sop_bawal.js`).
5. [ ] Viewer (VIEW audit bahagi 2: DITL, tablet, phone) at Simulate na plant model OFF.
6. [ ] HMI: live items (560 / 1330 lang ang live), plant overview at permissives screen.
7. [ ] Sand silo DITL (8 drawing, `sand-sootblower-logic.zip`).
8. [ ] Library: loop diagram, instrument list, dictionary.
9. [ ] Merge ng mga nakabinbing PR at Stable release: LANG kapag nag-GO STABLE ang user.

Sa hinaharap lang (hindi gagawin nang walang utos): warm / hot start (Training at starting state), shutdown Training, tuning lab, cause-and-effect matrix, piping / drain model, aux cooling water / instrument air / APH sootblower / ESP model.
