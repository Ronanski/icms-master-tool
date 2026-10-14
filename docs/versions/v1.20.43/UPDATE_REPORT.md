# v1.20.43 (Beta) - SCALE CONVERT: ang constant ay ang ratio na nakasulat sa drawing

## Problem
Ang block na "SCALE CONVERT 1115 / 432" ay nagpapakita ng 1.00. Ang text sa drawing ang reference, hindi design lang (user).

## As Found (basa sa drawing)
ABC-006 / ABC-002: ang signal sa DCS ay % ng range. Ang SCALE CONVERT a / b = source range / destination range (hal. SAF 200 T/H = 46.3 % ng 432 -> x 432/1115 -> 17.9 % ng 1115 = 200 T/H). Ang simulator ay gumagamit ng totoong T/H (PROJECT_RULES 4a), kaya ang ratio ay nagkakansela at ×1 ang ginagamit mula pa v1.20.21 (F-7).

## Work Done
- Ang constant ay nagpapakita na ng ratio sa drawing (648/1115 = 0.581, 432/1115 = 0.387, 35/1115 = 0.031, 1115/432 = 2.581, atbp.).
- Ang multiplier na kumukuha nito ay hinahati ito ulit (`scn` sa `plant.js` MUL, parehong gamit ng UAT `gen.js`), kaya **pareho ang lahat ng numero** (T/H).
- Kapag ang kumukuha ay hindi MUL, ×1 pa rin (dating asal). Ang mga constant na binago nang sadya (ABC-005 limestone 100/27, ABC-001B 0.05) ay hindi ginalaw.

## As Left
- Paghahambing ng buong sim (60 hakbang x 0.5 s, lahat ng 54 sheet) bago at pagkatapos: **13 net lang ang nag-iba, pawang ang mga constant mismo** (sa 7 sheet: 004A, 006, 010, 032, 056, 001C, 002). Walang ibang net na nagbago.
- UAT dry run sa 7 sheet na iyon: 0 bagsak.
- Hindi nasubukan: totoong tablet. Ang ABC-005 "12000 / 2700" ay 3.70 (100/27, T/H -> feeder speed %), hindi 4.44; iyon ay conversion ng unit na sadyang inayos noon (hindi ginalaw ngayon).

## Status
Beta.
