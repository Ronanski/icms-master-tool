# Trace ng drawing bago ang ayos (v1.20.39): A/M, SV, COS, plant model

Sheet: ABC-007 (sheet 19 ng 54), `analog-logic-abc.zip` -> `PDF/(19)ABC-007.pdf`. Loop na sinuri: SAF = FICFA1081 (PID S1-MDL024). Ang PAF = FICFA1071 ay pareho ang istruktura.

## Ano ang nakikita sa drawing (SAF loop)
1. **SV T switch** (diamond na may COS sa B): A = SI0170 (SAF demand SI0044 -> BUMPLESS ramp 0.05 %/sec, 1:BYPASS kapag FICFA1081.LOC); B = COS (ang SV na itinakda ng operator). Ang output ("SV +") ay papunta sa SV ng PID.
2. **A/M T switch** (label "A/M", may COS sa B): A = output ng PID sa pamamagitan ng **FAULT T** (A = PID, B = sarili nitong output: hawak ang huling MV kapag M.019B); B = COS (manual MV ng operator). Output = FICFA1081.MV -> AO0352.
3. **Select ng A/M T**: "1:B" = M.0190 (OR ng M.0098, M.0198, M.019F: mga kondisyon na nagpapa-**force manual**); "1:A" = M.019C (TR68, pulse pabalik sa auto).
4. **COS** (change-over switch) = manual operation ng operator. Sa A/M T ang COS ang MV sa manual; sa SV T ang COS ang SV na itinakda ng operator.
5. Mode inputs: FICFA1081.MAN / LOC / REM (M.019D); "IF M.019D = 1 SET SI0179 => FICFA1081.SV": kapag nagbago ang mode, sinusundan ng SV ang PV (SI0179).

## Ibat ibang gamit ng COS sa 54 sheets (nasukat sa app, 175 COS)
| Gamit | Bilang |
|---|---|
| MV manual ng A/M station pagkatapos ng PID | 45 |
| SV ng PID | 19 |
| Halaga papunta sa MAN station (manual / auto input) | 37 |
| Papunta sa isa pang AMT / T switch | 13 |
| Bias / limit / iba (SUB 6, AO 2, LLIM 1, wala 1) | 10 |
| **Hindi nakakabit sa T switch (hindi nakilala ng reader)** | **50** |

## Mga patakaran na dapat sundin (operator, ayon sa user)
- AUTO: ang operator ay SV lang ang puwedeng galawin (COS ng SV T). Hindi ang MV.
- MV ay manual lang kapag: (a) **force manual** ng logic (1:B), o (b) manual na pinili ng operator (MAN).
- Kapag ang force-manual signal ay 1, **hindi puwedeng pumunta sa AUTO** ang operator; hindi dapat umandar ang AUTO button hanggang ma-clear ang signal, at pagka-clear, **manual pa rin** hanggang pindutin ang AUTO.
- Ang plant model ay laging naka-ON: manual man o auto, sumasagot ang PV sa valve; ang operator ang gumagalaw, hindi "OFF".

## Ano ang mali sa app (v1.20.38), nasukat
1. Ang AUTO button (`fm='A'`) ay nag-o-override sa **lahat**, kasama ang select-B na signal (M.0190): `plant.js` SW/AMT: `if(s.fm==='A')pickB=false` pagkatapos kunin ang signal. Kaya nagiging AUTO kahit force manual.
2. Ang SV field ng faceplate ay naka-disable (`svOk=S.ext.includes(sv)`); ang SV ay output ng T switch, hindi external input, kaya hindi maitakda ang SV sa AUTO.
3. Ang plant model ay default OFF (`ls-plantmodel` wala = OFF), kaya PV = 0 at MV = 0 kapag tumatakbo.

## Ayos (isa-isa, sinusubok)
- Engine: ang select-signal na humihingi ng manual leg ay may mas mataas na priyoridad kaysa AUTO ng operator; pagkatapos ma-clear ay manual pa rin.
- Faceplate: ang SV field ay nagtatakda ng COS ng SV T at pinipili ang leg B (LOCAL SV); may "REM" para bumalik sa SV galing sa logic. Ang MV field ay para sa manual lang (naka-disable kapag AUTO).
- Plant model: default ON.
- Hindi pa sakop (nakalista sa HANDOFF): ang 50 COS na hindi nakakabit, ang SV tracking ng M.019D.
