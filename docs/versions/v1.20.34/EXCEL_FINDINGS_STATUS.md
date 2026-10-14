# Katayuan ng 20 findings ng Excel ng user (`document-references/values-logic-sim-end-user-report.xlsx`)

Mga salita: PASADO = may ebidensya na nasuri ko; INAYOS = binago ko ngayon; HINDI PA = hindi ko pa nasusuri o hindi pa tapos.

| # | Finding | Katayuan | Ebidensya |
|---|---|---|---|
| 1 | Selector HS / LS: isang wire lang ang iilaw | HINDI PA NA-VERIFY SA LARAWAN | May code na nagpapadilim sa input na hindi napili (`anDead`, `anHL`); hindi ko pa nakita sa larawan |
| 2 | Forced value text, ibang kulay | PASADO | Analog forced 12.34 ay nakasulat katabi ng wire, kulay orange; digital forced "1" ay orange (headless, ABC-007) |
| 3 | Pangalawang sheet window (2 lang, hindi pareho) | HINDI PA | May button na "2nd sheet" (sa More menu); hindi ko pa nasubukan ang limit |
| 4, 17 | Strict range | INAYOS (bahagi) | 23 pa ang nasama; 14 ay hindi pa; 177 ay walang range text sa drawing |
| 5 | COS range ayon sa diagram | PASADO (MAN / PID / SUMA) | `refcheck.py`: 136 na parameter ng workbook, 0 ang magkaiba; 157 AI range, 0 ang magkaiba. Ang COS manual value na walang range text ay hindi pa nasuri isa-isa |
| 6 | HS / LS: ramp muna, hindi instant | HINDI PA | |
| 7 | Maling o blangkong symbol | INAYOS | 80 sa 92 DEV ay blangko; DIV ay ÷; SUB ay bar; pagkatapos 0 blangko sa 495 na block (larawan) |
| 8 | Bypass at ramp output magkapareho | PASADO (net) | Walang RATE / RAMPB na ang output ay kapareho ng input; walang switch na magkapareho ang dalawang leg. Hindi ko pa nakita sa larawan |
| 9, 10 | F(X) na may % input at output | PASADO | 63 kaso (25, 50, 80 % ng range), 0 mali; nasa UAT na |
| 11 | Constant 32 % min air flow (ABC-002) | INAYOS | 128 -> 356.8 T/H; tingnan ang DRAWING_TRACE 4 |
| 12 | Math block na iba ang operasyon | PASADO | UAT: add / subtract / sum / deviation / multiply / divide / abs, 0 bagsak |
| 13 | Analog na naka-grey | HINDI PA | Ang grey ay "walang sumusunod" (`anDead`); hindi ko pa natukoy ang mga maling grey |
| 14 | NOT gate | PASADO | UAT 243 sa 243 |
| 15 | Final element: unti-unti | PASADO | 62 feedback AI ng valve / damper ay unti-unti (stroke) |
| 16 | Select circuit, SIG.AB sa zero | INAYOS | zero = lost: hindi ina-average (UAT); ang path ay hindi iilaw; hindi ko pa nakita sa larawan |
| 18 | FROM DITL / ABC na text, clickable | PASADO | 12 sa 12 na click ang lumipat ng sheet |
| 19 | RATE block ayon sa text | PASADO (may text) | UAT; 8 block na walang text ay 1 / s |
| 20 | T switch na may COS | PASADO | switch test 438 na kaso; PID chain 52 PID |

## Priority next version (Excel)
- Simulation Audit mode (Pass / Fail / Needs Review, report): may PASS / FAIL / NEEDS REVIEW na button sa napiling wire; ang export ng report ay hindi ko pa nasuri.
- Unresolved block / net warnings: HINDI PA.
