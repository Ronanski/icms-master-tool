# HMI STYLE STANDARD (iisang itsura ng lahat ng HMI page)

User 2026-10-30: "Dapat uniform ang style ng mga HMI natin." Ang lahat ng HMI page (MAKE-UP WATER, 030 SEAWATER, 007 AIR & FLUE GAS,
036 TURBINE OIL, INSTRUMENT & PLANT AIR, CLOSED COOLING WATER at ang mga susunod) ay gumagamit ng iisang library:
`src/ui/plant/hmi-sym.js` (`window.HSYM`). Walang page na gumagawa ng sarili niyang tubo, pump, valve o tank.
Ang unang page na sumusunod dito ay ang MAKE-UP WATER (3.2.0-beta.70, `src/ui/plant/hmi-mu.js`). Ito ang halimbawa.

Mockup na inaprubahan ng user (2026-10-30): https://claude.ai/artifact/D7QHoST3PTVzav5Pw1T1q7

## 1. Layout

- **Frame 1280 x 860, drawing area 1280 x 770** (seksyon 1a), `HSYM.fit(1280, 770)`. Ang drawing area ay nasa ilalim ng title
  at alarm bar, at nasa itaas ng page tabs (`HSYM.AREA`). Walang bahagi ng drawing na natatakpan ng frame, ng left pane o ng dock
  (`fitAll: 1` sa `PLANT_SYS`).
- **Daloy ng proseso: kaliwa → kanan.** Source (tank, fan inlet, oil tank) → mga makina → header → mga gumagamit.
  Hindi kinokopya ang layout ng HMI snapshot. Ang snapshot ay batayan lang ng mga tag at instrument.
- **Zones**: bawat yugto ng proseso ay may mahinang background band at label sa itaas (`hs-zone`, ALL CAPS), hal.
  `SUPPLY · DEMI WATER TANKS`, `MAKE-UP WATER PUMPS · DITL-112`, `HEADER`, `#1 UNIT USERS`.
- **Magkakapareho ang ayos ng mga makinang magkakatulad** (pump A / B / C): parehong taas, pareho ang puwesto ng bawat instrument.
- **Ang text ay may sariling lane.** Walang text na nakapatong sa tubo, sa makina o sa ibang text. Sa itaas ng makina ang pangalan,
  at nasa tabi ng instrument ang value box.
- Dulo ng linya papunta sa ibang system: `HSYM.dest` card (pangalan + linya / drawing).
- Sa ibaba: legend ng media (`HSYM.legend`) at ang pinagmulan (P&ID, SOP, "values: plant model").

### 1a. Laki sa totoong screen (user 2026-10-30: "malabo / maliit"; "Cge")
Sa PC 1366 x 768 na bukas ang dock, ~912 px lang ang lapad ng page. Ang lumang frame (1920) ay 0.47x: 10.5 px na text = ~5 px.
- **Frame ng bawat page = 1280 x 860** (`sys.w` / `sys.h` = `HSYM.FRAME`), ~0.71x sa 1366 + dock. Sa frame na < 1600 ang lapad, mas
  malaki ang text ng frame bar ng `hmi2.js` (x1.3) at 4 header value lang (MSP, MST, MSF, LOAD).
- **Drawing area = 1280 x 770**, iginuguhit nang 1:1 (`HSYM.fit(1280, 770)`); ang content ay mula y 44 kapag may tabs.
- Minimum sa drawing: text 13, pangalan 18, value 22. Sa screen (1366 + dock): text ~9 ~ 13 px, value ~16 px (nasukat sa beta.70).
- Kapag hindi kasya ang system: **tabs** sa loob ng page (`HSYM.tabs(pg, id, names)`), hal. MAKE-UP WATER: TANKS & PUMPS /
  #1 UNIT USERS & EXPANSION TANK. Ang dulo ng linya papunta sa kabilang tab ay card na nagbubukas ng tab na iyon.

## 2. Kulay (dark steel)

| Gamit | Kulay | Token (`HSYM.C`) |
| --- | --- | --- |
| RUN / OPEN | pula `#e5484d` | `run` |
| STOP / CLOSED | berde `#2fa56a` | `stop` |
| Gumagalaw (starting, coasting, valve travel) / alarm | amber `#f2a531`, kumikislap | `amber` |
| Walang signal | abo `#6b7480` | `none` |
| TRIP | pulang kumikislap | `run` |
| Demineralized water | `#2f8fc0` | `med.d` |
| Recirculation | `#3f86a8` | `med.r` |
| Closed cooling water | `#4a77b8` | `med.c` |
| Tubo na walang daloy | parehong kulay, 50 % opacity | |

Bagong medium (steam, oil, air, flue gas): idagdag sa `HSYM.C.med` at sa talaang ito, hindi sa page.

## 3. Text

| Klase | Gamit | Laki |
| --- | --- | --- |
| `hs-zone` | label ng zone | 14 px, ALL CAPS, letter-spacing |
| `hs-eq` | pangalan ng equipment (MWP-A, T-1109) | 18 px bold |
| `hs-st` | estado (RUNNING, STOPPED, OPEN) | 13 px bold, may kulay ng estado |
| `hs-tag` | tag ng instrument / valve | 13 px mono |
| `hs-val` | value sa value box | 22 px mono, bold |
| `hs-unit` / `hs-sub` | unit, maliit na paliwanag | 12 ~ 13 px |

## 4. Value box

`HSYM.vbox(x, y, tag, unit, key, w)`: tag sa itaas, madilim na kahon, value na nakahanay sa kanan, unit sa labas ng kahon.
`-----` kapag walang value (abo). Click = info card ng I/O list line. Ang value ay galing LANG sa plant model o sa logic.

## 5. Mga symbol

| Symbol | Function | Galaw |
| --- | --- | --- |
| Tubo | `b.pipe(points, {w, med, f})` | tuldok na gumagalaw sa direksyon ng daloy; bilis ayon sa flow; tumitigil kapag 0 |
| Tee | `b.tee(x, y)` | (dinidikit ang sanga; walang hiwa) |
| Pump + motor | `HSYM.pump(x, y, id, px)` | umiikot ang impeller at fan; spin-up 3 s, coast-down 6 s |
| Valve | `HSYM.valve(x, y, {kind, id, lab})`, kind = man / mov / xv / cv | position bar; amber kumikislap habang gumagalaw |
| Check valve | `HSYM.check(x, y, id)` | bumubukas ang flapper kapag may daloy |
| Gauge | `HSYM.gauge(x, y, id, tag)` | karayom ayon sa value |
| Strainer | `HSYM.strainer(x, y, tag, px)` | |
| Orifice | `HSYM.orifice(x, y)` | |
| Tank | `HSYM.tank(x, y, w, h, id, {max, marks})` | level ng tubig, alon, agos na pumapasok |

**Mga tubo:** iisang path bawat tubo, bilog na elbow (`rpath`), at layers: lahat ng outline muna, saka lahat ng body, highlight at flow.
Kaya nagdidikit ang tee at elbow nang walang dugtong o laktaw. Dumadaan ang tubo sa ilalim ng valve at instrument; hindi ito pinuputol.

## 6. Animation

- `HSYM.live(root)`: iisang `requestAnimationFrame` loop bawat page.
- Tumatakbo lang kapag nakikita ang page (nasa document at hindi hidden).
- Humihinto kapag naka-pause ang simulation (`HSYM.simRunning()`, pareho ng Training dock).
- `prefers-reduced-motion`: walang galaw, pero tama pa rin ang kulay at value.
- Ang estado (RUN / STOP / TRIP, open / closed) ay galing sa logic (`LS_DOCK.mst`, DITL) at sa plant model. Ang galaw ay larawan lang
  ng estadong iyon (spin-up, travel), hindi bagong value.

## 7. Pakikipag-ugnayan

- Click sa pump / valve / tank = info card o faceplate (tulad ng ibang page). Hover = asul na outline.
- RUN = pula, STOP = berde (patakaran ng planta, hindi binabago).

## 8. Bagong page: checklist

1. `PLANT_SYS` entry: `w: HSYM.FRAME.w, h: HSYM.FRAME.h, fitAll: 1`. `pg.setAttribute('transform', HSYM.fit(1280, 770))`; kung malaki: `HSYM.tabs`. Bawat tab: `const b = HSYM.scene('<prefix>')`, iguhit sa 1280 x 770 (content mula y 44).
2. Kaliwa → kanan na daloy, zones, magkakaparehong row.
3. Mga tubo gamit ang `b.pipe` / `b.tee`; walang sariling line drawing.
4. `const A = HSYM.live(pg)`; sa tick: `A.pump`, `A.flow`, `A.valve`, `A.check`, `A.gauge`, `A.tank`.
5. Mga value mula sa plant model / logic gamit ang `api.reg`.
6. Screenshot sa 1366 x 768 na bukas ang dock (ang pinakamaliit na PC): walang natatakpan, walang text na nagkakapatong, nababasa ang value.
