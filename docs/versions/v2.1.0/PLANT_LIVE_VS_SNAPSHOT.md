# 2.1.0 — PLANT LIVE: simulation vs HMI snapshot (150 MW)

Paano nakuha: ⚙ Simulation → Start at 150 MW, 300 s RUN ng lahat ng sheet, PLANT workspace bawat system; ang 02.png (60 MW) ay hindi kasama. Nakalista ang NAKAKABIT na value na lumalayo nang higit 5 % (o 1.5 unit) sa snapshot.

- 2.1.0-beta.5: 66 tag.
- 2.1.0-beta.6: 44.
- 2.1.0-beta.10: 37 (mas maraming nakakabit).
- 2.1.0-beta.11: 33. Naayos: FW flow (498.1 sa 55.9 %), coal master PV 87.0, boiler master (MW demand 150, HIC-BM, PIC-COBM 0.4 %), air flow (PAF 362, SAF 229), FIC-CM SV 94.

Natitira (beta.11):

## ABC-002
- AIFG1122: HMI 6.4 sim 4.3
- AIFG1123: HMI 2.2 sim 4.3

## ABC-003A
- FIQDO1043A: HMI 0 sim 3.5

## ABC-003B
- FIQDO1043B: HMI 0 sim 3.5

## ABC-003C
- FIQDO1043C: HMI 0 sim 3.5

## ABC-003D
- FIFA1043D: HMI 26.8 sim 1.1
- FIQDO1043D: HMI 0 sim 3.5

## ABC-003E
- FIC-OM: HMI 0 sim 3.5

## ABC-004A
- FIC-CF: HMI 81.2 sim 40.0

## ABC-005
- AICFG10571: HMI 41 sim 307.5

## ABC-006
- FIFA1081: HMI 213 sim 228.8

## ABC-007
- MCVFA10531: HMI 35.6 sim 55.9
- MCVFA10541: HMI 37.1 sim 53.0

## ABC-010
- LIBR10012: HMI 2 sim 145.6
- LIBR10013: HMI 8 sim -0.0
- LICBR1001: HMI 3 sim 0.0
- LICBR1001A: HMI 3 sim 0.0

## ABC-019
- TCVFW1150: HMI 66 sim 79.4

## ABC-029
- FCVDO1012: HMI 100.1 sim 0.0

## ABC-030
- PCVAS10201: HMI 0.1 sim 4.2
- PCVAS10202: HMI 32.2 sim 4.2

## ABC-032
- FIQCD1120: HMI 380 sim 0.4

## ABC-034
- TIAS1017: HMI 185 sim 148.9

## ABC-035
- LIHD11051: HMI -6 sim -3.9
- LIHD11052: HMI 0 sim -3.9

## ABC-036
- LIHD11061: HMI -4 sim 10.8
- LIHD11062: HMI 3 sim 10.8

## ABC-051
- TCVFW1060: HMI 0.1 sim 22.3
- TIMS10221: HMI 359 sim 223.6
- TIMS10222: HMI 356 sim 223.6

## ABC-053
- TCVCW1201: HMI 53.1 sim 62.0
- TILO10021: HMI 46 sim 38.2
- TILO10022: HMI 46 sim 38.2
