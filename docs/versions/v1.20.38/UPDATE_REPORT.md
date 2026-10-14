# v1.20.38 (Beta) - live values: tamang sukat, at walang puwang na nakalaan sa mga text na hindi lumalabas

## Problem
Rule 5c: ang live values ay hindi dapat humaharang sa text, block, ibang value o wire. Ang sukat ko sa v1.20.37 ay MALI (sobra ang bilang): (1) sinukat ko ang buong line box ng text (1.45 x font) imbes na ang aktwal na numero (0.95 x font); (2) binilang ko ang mga text na walang laman kapag tumatakbo (SW, COS, ACH, at ang AO na ang address ay nagpapakita na ng numero).

## As Found
Ang "893 patong" sa v1.20.37 report ay hindi tama. Tamang sukat sa v1.20.37 ay nasa `tests/regress/values_layout.js` (bago ang ayos na ito): ang app ay naglalaan pa rin ng espasyo para sa mga text na hindi lumalabas, kaya ang wire values ay napipilitang umiwas sa wala.

## Work Done
- Ang sukat (`values_layout.js`) ay gumagamit na ng aktwal na taas ng numero at hindi binibilang ang walang-laman na text.
- Sa `src/analog/ui/links-canvas.js` (`vplace`): hindi na naglalaan ng espasyo para sa SW, COS, ACH at sa AO na may address na (hindi sila nagpapakita ng numero); naka-tag ang overlay text (`data-eq`) para masukat. Walang binago sa engine o sa mga numero.

## As Left (54 sheets, 2426 label na talagang nagpapakita ng numero)
- Mas malalim sa 0.7 unit sa loob ng ibang bagay: **26** (1.1 %).
- Patong na kahit konti (touching): text 31, ibang value 4, block 78, wire 135.
- Net labels, wire: 189 -> 124 (mas maraming espasyo dahil hindi na naglalaan para sa wala).
- Alignment (side level, itaas / baba centered): 0 mali.
- Sinubukan at binawi: paghahanap ng pinakamalapit na malinis na pwesto (grid) para sa mga masisikip: mas dumami ang patong sa block (deep 26 -> 76).
- Hindi nasubukan: itsura sa totoong tablet; walang screenshot na tiningnan ng bawat sheet.

## Status
Beta. Ang natitirang 26 na malalim ay nasa masisikip na lugar; ang susunod ay tingnan ang bawat isa kasama ang user (screenshot ng PDF kung saan dapat ang value).
