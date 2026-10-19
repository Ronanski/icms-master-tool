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
