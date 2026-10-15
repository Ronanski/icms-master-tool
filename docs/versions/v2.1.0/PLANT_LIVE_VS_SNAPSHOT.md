# 2.1.0 — PLANT LIVE: simulation vs HMI snapshot (150 MW)

Paano nakuha: ⚙ Simulation → Start at 150 MW, 300 s RUN ng lahat ng sheet, PLANT workspace bawat system; ang 02.png (60 MW) ay hindi kasama. Nakalista ang NAKAKABIT na value na lumalayo nang higit 5 % (o 1.5 unit) sa snapshot. Tama ang link; ang estado ng simulation ang hindi pa tugma.

- 2.1.0-beta.5: 66 tag (full-load screens).
- 2.1.0-beta.6: 44 tag. Naayos: furnace pressure ABC-008 (PIFG1085 / 1086 / 10871, damper PCDFG10561), drum pressure PIBR10011 / 10012, FW temperature TIFW1160, HP / LP bypass at iba pa (anchor sa load). Bago lumabas: LIBR10012 (HMI 2, sim 145.6).

Natitira (beta.6):

## ABC-002
- AIFG1122: HMI 6.4 sim 4.3
- AIFG1123: HMI 2.2 sim 4.3

## ABC-003A
- FIFA1043A: HMI 22.9 sim 0.0

## ABC-003B
- FIFA1043B: HMI 22.5 sim 0.0

## ABC-003C
- FIFA1043C: HMI 21.8 sim 0.0

## ABC-003D
- FIFA1043D: HMI 26.8 sim 0.0

## ABC-003E
- FIC-OM: HMI 0 sim 3.5

## ABC-004A
- FIC-CF: HMI 81.2 sim 40.0
- FIC-CM: HMI 87 sim 0.0

## ABC-005
- AICFG10571: HMI 41 sim 307.5

## ABC-006
- FIFA1071: HMI 354 sim 285.0
- FIFA1081: HMI 213 sim 134.0

## ABC-010
- FCVFW11301: HMI 56.1 sim 53.1
- FICFW1007: HMI 499.1 sim 473.1
- FIQFW10071: HMI 498.9 sim 458.8
- FIQFW10072: HMI 499.2 sim 458.8
- LIBR10012: HMI 2 sim 145.6
- LIBR10013: HMI 8 sim -0.0
- LICBR1001: HMI 3 sim 0.0
- LICBR1001A: HMI 3 sim 0.0

## ABC-019
- TCVFW1150: HMI 66 sim 100.0

## ABC-028
- PCVDO0002: HMI 24.2 sim 19.3
- PIDO0005: HMI 12.8 sim 1.2

## ABC-029
- PCVDO1009: HMI 85.7 sim 0.0

## ABC-031
- LCVMU1110: HMI 14 sim 48.8

## ABC-032
- FCVCD1120: HMI 0.1 sim 100.0
- FCVCD1121: HMI 100.6 sim 0.0
- FIQCD1120: HMI 380 sim 0.0

## ABC-034
- TCVCD1126: HMI 0.1 sim 21.4
- TIAS1017: HMI 185 sim 255.1

## ABC-035
- LIHD11051: HMI -6 sim 1.8
- LIHD11052: HMI 0 sim 1.8

## ABC-036
- LIHD11061: HMI -4 sim 11.2
- LIHD11062: HMI 3 sim 11.2

## ABC-051
- TCVFW1060: HMI 0.1 sim 22.3
- TIMS10221: HMI 359 sim 224.0
- TIMS10222: HMI 356 sim 224.0

## ABC-052
- PCVHR1010: HMI 1.3 sim 100.0
- PIHR10031: HMI 34.3 sim 31.9
- PIHR10032: HMI 34.4 sim 31.9
- TCVCD1115: HMI 0.2 sim 54.1

## ABC-053
- TCVCW1201: HMI 53.1 sim 38.0
- TILO10021: HMI 46 sim 0.0
- TILO10022: HMI 46 sim 0.0
