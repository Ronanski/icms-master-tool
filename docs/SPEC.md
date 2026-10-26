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

## 2. Meron na at kulang (3.2.0-beta.38, 2026-10-26)

| # | Meron na sa app | Kulang / bukas |
|---|---|---|
| S1 | Laging iisang mundo ang ABC + DITL (mula beta.25, walang button). Page link ABC ↔ DITL, dalawang direksyon. | — |
| S2 | VIEW mode: click sa wire = trace, Search, info card ("Why?"), page link, Back. | Bahagi 2 ng VIEW audit: DITL, tablet at phone sa VIEW. |
| S3 | Plant chip katabi ng VIEW / RUN → **OFF**. Inputs list, force ng bawat input, A / M / R, SV, MV. | — |
| S4 | Plant chip → **Unit**: steam table IAPWS-IF97, mass / energy balance ng boiler, turbine + TCS (ATS step 0 ~ 7), vacuum, utilities na may trip. | (a) MST umaabot 555 °C sa CCS load up 90 → 150 MW (H alarm 548). (b) RH biasing damper: baligtad ang direksyon sa model. (c) Wala pang model: aux cooling water, instrument air, APH sootblower, ESP. |
| S5 | Home → **At 150 MW** (galing sa HMI snapshot 4.PNG). Load up / down sa HIC-ULD, CCS, boiler / turbine master, coal master. | Kasama sa S4 (a). |
| S6 | Home → **Cold**: walang apoy, patay ang fans at pumps, MSP 0, FW 0. RUN na walang pinili = Cold. | — |
| S7 | Training → **Gabay: Cold → 150 MW** at **Practise: Cold start** / **150 MW load change**. Sunod sa PR-OPE-5002 + FHI Fig. 2. | Hindi pa nasubok ng user. |
| S8 | Library: **I/O list**, **Memory list**, **Wiring**, **Relay / SER**, **Calculations** (= compensations at drum level). **F(X) curves** page (= linears). | **Loop diagram**, **instrument list**, **dictionary**: wala pa. Walang hiwalay na file sa `document-references/`; gagawin mula sa ABC sheet + I/O list + wiring (loop), I/O list + ranges (instrument), textbook + legends (dictionary). |
| S9 | Plant view: 28 screen na kopya ng HMI (UNIT, steam, air, coal, burners A ~ D, ash, sootblower, limestone, sand, condensate, seawater, turbine oil, generator…), faceplate sa bawat controller. | 560 / 1330 item lang ang live (ang iba ay walang signal sa ABC: snapshot value). Walang hiwalay na **plant overview** at **permissives** screen (bukod sa burner 012 ~ 015). |

**Nasa app pero wala sa spec** (para gawing simple, kailangan ng OK ng user bago tanggalin o itago): Plant chip **Per-loop** mode, starting state **Warm** at **Hot**.

## 3. Plano (sunod-sunod; i-update kapag may natapos)

1. [ ] S4 (a) MST 555 °C sa load up: spray TICBR1150 / TICMS1004.
2. [ ] S4 (b) direksyon ng RH biasing damper (ABC-020, `plant.js`).
3. [ ] S7 subok ng user sa Training (gabay: `docs/USER_CHECK.md`).
4. [ ] S2 VIEW audit bahagi 2 (DITL, tablet, phone).
5. [ ] S8 loop diagram, instrument list, dictionary sa Library.
6. [ ] S9 plant overview at permissives screen.
7. [ ] S4 (c) aux cooling water, instrument air, APH sootblower, ESP.
8. [ ] Desisyon ng user: itago ba ang Per-loop, Warm, Hot.

Sa hinaharap lang (hindi gagawin nang walang utos): warm / hot start Training, shutdown Training, tuning lab, cause-and-effect matrix, piping / drain model, sand DITL page.
