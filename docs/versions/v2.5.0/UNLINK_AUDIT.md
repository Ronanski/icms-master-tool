# 2.3.0 — Mga link na binago o hindi ikinabit, may ebidensya (CLAUDE.md rule 9)

Walang link na tinanggal para lang gumana. Ang dalawang binago sa ibaba ay MALING link na pinalitan ng tamang pinagmulan ayon sa PDF.

## beta.1

1. **ABC-017 I.024E "S/B STEAM SUPPLY MOTOR VALVE TORQUE (FROM DITL 80S-57 FOR S/B LOGIC)"** (LINK-1).
   - Dati: ikinabit sa DITL-80 output 57 = "HRH DRN POT DP-HR01 DRN VLV OPEN COMMAND" (inalis ng app ang "S" ng "80S").
   - Ebidensya: ang text mismo ay "FOR S/B LOGIC"; ang "80S" ay ang sootblower PLC logic (`document-references/sand-sootblower-logic.zip`, DITL-80x), hindi ang DITL-80 ng DCS. Iba ang equipment (sootblower steam supply valve vs hot reheat drain pot valve).
   - Ngayon: ang reference na nagtatapos sa "S" ay hindi ibinabagsak sa ibang drawing. Ang I.024E ay input na itinatakda ng user (FORCE) hanggang maipasok sa app ang sootblower PLC logic.
2. **ABC-009B "M.331D"** (ABC-009B-1).
   - Dati: ang pangalang M.331D ay nasa net ng output ng AND(B.0646, B.066E), dahil ang wire ng M.331D at ang output ng AND ay pumapasok sa iisang input bar ng OR M.0320. Kaya ang M.331D ng ABC-009A ay sumusunod sa SIG.AB ng furnace DP, hindi sa DITL.
   - Ebidensya: PDF ABC-009B, x376 ~ 448 y286: "BOTTOM ASH SCREW COOLER SPEED CONTROL MANUAL MODE ( FROM DITL 21D-59 ) M.331D" ay sariling wire papasok sa OR; ang AND ng B.0646 / B.066E (FURNACE DP (A) / (B) SIG.AB) ay hiwalay na input ng parehong OR.
   - Ngayon: dalawang net. Ang M.331D ay DITL input (iisang address sa ABC-009A at 009B); ang output ng AND ay input pa rin ng OR.

## beta.3

3. **ABC-008 "B.0664 FURNACE PRESSURE (A) SIG.AB"** (ABC-008-1).
   - Dati: ang input ng AND B74 (→ OR M.0204, force manual ng IDF inlet damper PICFG108A) ay B.0664, walang pinagmulan, laging 0.
   - Ebidensya: ang text sa tabi ng address ay "FURNACE PRESSURE (A) SIG.AB". Sa kaliwang kalahati ng parehong sheet, ang FURNACE PRESSURE (A) SIG.AB ay B.0644 (SIG.AB ng AI0132), at ang dalawa pang input ng parehong AND ay B.066C / B.068C, kapareho ng kaliwang AND (B.0644, B.066C, B.068C). Sa repo, ang B.0664 ay SIG.AB ng AI0196 = ZT-FA1055-B1 (FA blower-B inlet damper position, ABC-014): ibang equipment.
   - Ngayon: nakakabit sa B.0644. Kapag sira ang tatlong furnace pressure transmitter, napupunta sa MAN ang hydraulic coupling AT ang IDF inlet damper.

## 2.5.0-beta.5 — DITL-21C row 19 / 20 (M.311A / M.311B)

- **Drawing:** DITL-21C row 19 / 20 "FURNACE DIFF. PRESSURE (A) / (B) SIGNAL ABNORMAL" M.311A / M.311B, FROM ABC-009A. Walang "M.311A" na text sa ABC-009A.
- **Ebidensya:**
  - Memory list 101 (STN101 WM): M.311A "Plenum/upper diff. press.(A) sig. abnormal" at M.311B "(B)", STN101 STATION WIRING.
  - Memory list 103: M.311A / M.311B "(FROM S1)".
  - I/O list Station 101: AI0134 DPT-FG1081 "#1 Furnace plenum/upper layer diff. pressure (A)" SIG.AB **B.0646**; AI0262 DPT-FG1082 "(B)" SIG.AB **B.066E**.
  - Sa ABC-009A: SIG.AB B.0646 / B.066E ng AI0134 / AI0262 (select circuit ng furnace DP).
- **Ayos:** walang tinanggal na link. Ang DITL-21C row 19 / 20 ay kinukuha ang B.0646 / B.066E ng ABC-009A (`world.js` WIRE_S1).
- **Test:** `tests/regress/audit230.js` (DITL-21C row 19 / 20, at walang DITL-21C row na walang pinagmulan).

## 2.5.0-beta.11 — DITL laban sa PDF (mga link na binago ang basa)

Lahat ay binasa sa PDF (300 dpi, `/mnt/project-files/ditl-audit-2026-10-20/png/`). Walang tinanggal na link para lang gumana: bawat isa ay pagdugtong na walang tuldok sa drawing.

1. **DITL-61A row 11 (OUTLET PRESSURE LOW M.3217)** sa maliit na OR ng auto start.
   - Dati: OR(IN10, IN11, IN11). Ang wire ng row 11 ay lumiliko pataas 4 unit bago ang OR (papunta sa AND ng 5 s ON DELAY TR267); ang liko ay nabasang input ng OR.
   - PDF: ang OR ay may dalawang input lang: row 10 (M.1194) at row 8 (PUMP B TRIP, ang wire ay bumababa sa column 4 at pumapasok sa ibabang input). Ang row 8 ay tumatawid sa row 11 nang walang tuldok.
   - Ngayon: OR(IN10, IN8). Ang row 11 ay nasa AND ng 5 s ON DELAY pa rin.
2. **DITL-76 / 77 row 5 (REMOTE SELECTED)** sa AND ng TR533 at sa AND ng auto start.
   - Dati: AND(IN12, IN12, ...) at AND(IN2, IN4, ...): ang vertical ng row 5 ay bumababa sa loob ng input cell at hindi nabasa; ang row 2 ay tumatawid nang walang tuldok.
   - Ngayon: AND(IN12, IN5, IN4, ON DELAY 5 s(IN9)) at AND(IN5, IN4, connector (7)).
3. **DITL-112 row 10 at DITL-26A row 8** sa timer.
   - Dati: ON DELAY 3 s(IN12, IN10) at ON DELAY 60 s(NOT IN6, IN8): ang liko ng row 10 / row 8 na dumaraan sa harap ng timer ay nabasang input.
   - PDF: DITL-112 ang timer ay may tuldok sa row 12 lang; DITL-26A ang row 8 ay bumababa papunta sa 5 s ON DELAY TR128 lang.
4. **DITL-76 / 77 row 53 / 54 (VCB ON / VCB OFF, MIV-P1108A1 / A2, I.008A / I.008B)**.
   - Dati: nakadugtong sa wire ng GREEN / RED lamp (VCB ON = pump stopped, baligtad).
   - PDF: ang VCB ON / OFF ay nagsisimula sa field break symbol (column 8); ang lamp wire ay nagtatapos sa vertical na may tuldok. Field signal ito, gaya ng DITL-61A row 51 / 52.
   - Ngayon: field input na may test switch (MIV-P1108A1 / A2), gaya ng 61A.
5. **DITL-73 SV-CR1011**.
   - Dati: ang solenoid ay pinapatakbo ng wire ng row 27 (CONDENSER VACUUM, NOT → AND) na dumaraan sa ilalim ng assembly box.
   - PDF: row 23 OPEN COMMAND M.0563 → NOT → XV-CR1011 O.0126 → CLOSE COMMAND DC 24V → SV-CR1011 (gaya ng DITL-74).
   - Ngayon: SV-CR1011 = NOT(IN23).
