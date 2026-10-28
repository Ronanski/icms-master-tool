# Gabay sa pag-check ng user (maikli)

Para sa bawat bahagi ng spec (`docs/SPEC.md`): ano ang pipindutin, at ano ang dapat makita. Kapag iba ang nakita mo, screenshot lang at sabihin ang numero (hal. "S3 mali").

| # | Pindutin | Dapat makita |
|---|---|---|
| S1 one world | Logic → DITL → buksan ang **DITL-01** → pindutin ang sulat na **ABC-006** sa row. Pagkatapos: ABC → buksan ang **ABC-027** → mag-zoom sa sulat na **TO DITL 02-25, DITL 03F-16 …** (may tuldok na guhit) → pindutin. | Bumubukas ang ABC-006; **↩ Back** (unang button sa tool row) = balik sa DITL-01. Sa ABC-027: lumalabas ang listahan ng page; pumili ng isa = bubukas ang DITL sheet at kumikislap ang item row; **◀ Back** = balik sa ABC-027. Lahat ng "FROM / TO DITL" sa ABC ay ganito. |
| S2 viewer | Naka-**VIEW**. Pindutin ang isang wire sa ABC-010. | Naka-highlight ang buong signal hanggang sa dulo; sa kanan: saan galing, saan papunta. Walang value na nagbabago. |
| S3 plant OFF | Plant chip (katabi ng VIEW / RUN) → **OFF** → **RUN**. Buksan ang ABC-010 (drum level). Sa Inputs list, baguhin ang isang drum level input. | Tumutugon agad ang logic: nagbabago ang output ng drum level PID; ang ibang value ay hindi gumagalaw nang kusa (walang physics). |
| S4 plant ON | Home → **At 150 MW** → **RUN**. Buksan ang faceplate ng feedwater (FICFW1007), **M**, ibaba ang MV ng 10 %. | Bumababa ang FW flow, sumusunod pababa ang drum level. Pindot **A**: bumabalik sa normal. |
| S4 RH damper | Home → **At 150 MW** → RUN. ABC-020 faceplate **HICHR1002A** (RH biasing damper) → **M**, MV 25 → 60 %. | Tumataas ang reheat temperature (TICHR1002, ABC-019) at bumubukas ang RH spray para pigilan ito. Ibaba sa 10 %: bumababa ang reheat. |
| S5 full load | Home → **At 150 MW** → RUN. HIC-ULD (load demand) ▼▼ hanggang 120 MW. | Bumababa ang MW nang ~3 MW / min; boiler master, turbine master, coal ay sumusunod sa AUTO. Walang trip. |
| S6 cold | Home → **Cold** → RUN. | MSP 0, FW flow 0, MW 0, patay ang fans at pumps. Bago pumili ng starting point: ang header (LOAD / MSP / DRUM LVL / FW FLOW) ay "—", hindi MSP 75 / drum -566. |
| S7 training | Training → **Gabay: Cold → 150 MW**. Sundan ang card, hakbang-hakbang. | Ang card ang nagsasabi ng gagawin at ng value na babantayan; hindi ka makakalaktaw (hal. hindi ma-roll ang turbine nang walang vacuum). Dulo: 150 MW, walang trip. |
| S8 library | Home → **I/O and memory lists**. Tabs: I/O list, Memory list, Wiring, Relay / SER, Calculations. Home → **F(X) curves**. | Bawat tab may laman; search ng tag (hal. FICFW1007) ay nakakahanap. Wala pa: loop diagram, instrument list, dictionary. |
| S9 HMI | Home → **Operate the plant**. ☰ Systems → pumili ng screen. | Kapareho ng HMI ng control room; pindot sa controller = faceplate. |

## Ano ang "bawal" test (sop_bawal)?

Simpleng paliwanag: ginagawa ng test ang isang hakbang ng start-up **nang masyadong maaga**, gaya ng isang operator na nagkamali, at tinitingnan kung **tatanggi ang app**, gaya ng tunay na planta.

Mga halimbawa:
- I-start ang turbine (ROLL) nang **walang vacuum** → dapat ayaw ng app.
- Gumawa ng vacuum nang **walang aux steam** → dapat ayaw.
- Magpasok ng coal habang malamig pa ang bed (**< 400 °C**) → dapat ayaw.

Ang batayan ng bawat isa ay ang procedure PR-OPE-5002, ang DITL drawing at ang ATS criteria ng TCS. Kapag pumayag ang app = **FAIL** (kulang ang app). Ngayon: 19 sa 19 ay tumatanggi nang tama.
