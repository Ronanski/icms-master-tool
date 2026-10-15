# 2.1.0-beta.5 — PLANT LIVE: simulation vs HMI snapshot (150 MW)

Paano nakuha: app 2.1.0-beta.5, ⚙ Simulation → Start at 150 MW, PLANT workspace, bawat system (`tests/regress/plant_live.js` ang link check). Ang listahan ay ang mga NAKAKABIT na value kung saan ang simulation ay lumalayo nang higit 5 % (o 1.5 unit) sa snapshot.

Ibig sabihin: tama ang link (ang value ay galing sa tamang tag / address), pero ang estado ng simulation sa 150 MW ay hindi pa tugma sa HMI para sa mga ito. Ito ang input ng susunod na trabaho sa plant model at sa `src/analog/engine/hmi-op.js` (AN_HMI_AI / AN_HMI_DI / AN_HMI_CTL).

Kabuuan: 96 tag.

## ABC-002
- AIFG1122: HMI 6.4, sim 18.8
- AIFG1123: HMI 2.2, sim 18.8

## ABC-003A
- FIFA1043A: HMI 22.9, sim 0
- PICDO1043A (controller): HMI PV 0.0, sim PV 2.5
- PIDO1043A2: HMI 0.0, sim 2.5

## ABC-003B
- FIFA1043B: HMI 22.5, sim 0
- PICDO1043B (controller): HMI PV 0.0, sim PV 2.5
- PIDO1043B2: HMI 0.0, sim 2.5

## ABC-003C
- FIFA1043C: HMI 21.8, sim 0
- PICDO1043C (controller): HMI PV 0.0, sim PV 2.5
- PIDO1043C2: HMI 0.0, sim 2.5

## ABC-003D
- FIFA1043D: HMI 26.8, sim 0
- PICDO1043D (controller): HMI PV 0.0, sim PV 2.5
- PIDO1043D2: HMI 0.0, sim 2.5

## ABC-003E
- FIC-OM (controller): HMI PV 0.0, sim PV 3.2

## ABC-004A
- FIC-CM (controller): HMI PV 87.0, sim PV 0
- FIC-CF (controller): HMI PV 81.2, sim PV 40

## ABC-005
- AICFG10571 (controller): HMI PV 41, sim PV 311.8

## ABC-006
- FIFA1081: HMI 213.0, sim 0
- FIFA1071: HMI 354.0, sim 0
- FIFA1055: HMI 26.3, sim 8.8

## ABC-008
- PIFG1085: HMI -16, sim 444.4
- PIFG1086: HMI -17, sim 444.4
- PIFG10871: HMI -15, sim 444.4
- PCDFG10561: HMI 99.1, sim 0

## ABC-009A
- DPIFG1081: HMI 1419, sim 2500
- DPIFG1082: HMI 1419, sim 2500
- DPICFG108 (controller): HMI PV 1434, sim PV 2500

## ABC-010
- FIQMS1031: HMI 474.1, sim 501.1
- LIBR10011: HMI 0, sim -370.8
- PIBR10011: HMI 134.2, sim 0
- PIBR10012: HMI 134.1, sim 0
- LIBR10013: HMI 8, sim -370.8
- LICBR1001A (controller): HMI PV 3, sim PV -370.8
- LICBR1001 (controller): HMI PV 3, sim PV -370.8
- TIFW1160: HMI 244, sim 300
- FIQFW10072: HMI 499.2, sim 550
- FIQFW10071: HMI 498.9, sim 550

## ABC-011
- TIBR11401: HMI 461, sim 435.6
- TIBR11402: HMI 463, sim 435.6
- TICBR1140 (controller): HMI PV 462, sim PV 435.6
- TCVFW11102: HMI 100.7, sim 0
- TCVFW11101: HMI 45.5, sim 0

## ABC-012
- TIMS10041: HMI 542, sim 487
- TIMS10042: HMI 543, sim 487
- TICMS1004 (controller): HMI PV 542, sim PV 487
- TCVFW11201: HMI 14.9, sim 4.7

## ABC-019
- TCVFW1150: HMI 66.0, sim 79.4

## ABC-028
- PCVDO0002: HMI 24.2, sim 55.8
- PIDO0005: HMI 12.8, sim 2

## ABC-029
- PCVDO1009: HMI 85.7, sim 4
- PIDO1008: HMI 11.0, sim 1.2

## ABC-030
- PCVAS1010: HMI 0.6, sim 58.4

## ABC-031
- LCVMU1110: HMI 10.6, sim 100
- LCVCD1104: HMI 17.5, sim 0

## ABC-032
- FCVCD1120: HMI 0.1, sim 100
- FCVCD1121: HMI 100.6, sim 0
- FIQCD1120: HMI 380.0, sim 0

## ABC-033
- TIAS1001: HMI 103, sim 77.5
- TCVCD1124: HMI 0.1, sim 100

## ABC-034
- TIAS1017: HMI 185, sim 300

## ABC-035
- LIHD11051: HMI -6, sim -300
- LIHD11052: HMI 0, sim -300
- LCVHD11052: HMI 0.1, sim 100
- LCVHD11051: HMI 0.1, sim 100

## ABC-036
- LIHD11061: HMI -4, sim -300
- LIHD11062: HMI 3, sim -300
- LCVHD11062: HMI 0.1, sim 100
- LCVHD11061: HMI 0.1, sim 100

## ABC-037
- LCVHD11012: HMI 0.1, sim 100
- LCVHD11011: HMI 13.6, sim 100
- LIHD11011: HMI -3, sim -320
- LIHD11012: HMI -3, sim -320

## ABC-038
- LCVHD11022: HMI 53.7, sim 100
- LIHD11021: HMI -5, sim -306.3
- LIHD11022: HMI -1, sim -306.3

## ABC-039
- LCVHD11031: HMI 32.4, sim 100
- LCVHD11032: HMI 0.1, sim 100
- LIHD11031: HMI -11, sim -310
- LIHD11032: HMI -1, sim -310

## ABC-050
- PIMS10061: HMI 122.0, sim 0
- PIMS10062: HMI 122.0, sim 0
- PCVMS1020: HMI 1.0, sim 86.7

## ABC-051
- TCVFW1060: HMI 0.1, sim 50.2
- TIMS10221: HMI 359, sim 0
- TIMS10222: HMI 356, sim 0

## ABC-052
- PIHR10031: HMI 34.3, sim 7.1
- PIHR10032: HMI 34.4, sim 7.1
- PCVHR1010: HMI 1.3, sim 84.8
- TCVCD1115: HMI 0.2, sim 52
- TIHR10121: HMI 137, sim 177.6
- TIHR10122: HMI 135, sim 177.6

## ABC-053
- TCVCW1201: HMI 53.1, sim 0
- TILO10022: HMI 46, sim 0
- TILO10021: HMI 46, sim 0

## ABC-056
- PCVAS1030: HMI 0.4, sim 15.1
