# v1.20.55 (Beta) - REMOTE / LOCAL: sa REMOTE talagang AUTO (user, 2026-10-15)

## Ang rule (user)
Sa REMOTE mode, TALAGANG AUTO ang station: hindi mamamanual, pati ang SV. Ang logic ang magpapasya kung kailan ma-re-REMOTE, pero puwede ring ang operator ang maglipat sa REMOTE.

## As Found (basa sa drawing, ABC-007 FICFA1081)
Ang SV ay output ng T switch na may COS: A = SV path ng logic (SI0170, demand ramp) = REMOTE; B = COS ng operator = LOCAL. Select 1:B = M.0190 (force manual). Ang panel ay nagpapahintulot sa MAN at SV kahit REMOTE (v1.20.49 ~ 52: ang pagtype ng SV ay awtomatikong pumipili ng LOCAL).

## Work Done
- Engine: `anSvSwitchOf` (sa `engine/sheets.js`) ang naghahanap ng SV switch; bawat SV switch ay may AUTO leg = A (REMOTE), kaya sumusunod ito sa parehong rule ng force manual (1:B -> LOCAL, sticky).
- Engine (`plant.js`): habang REMOTE (SV switch sa leg A) ang A/M station ay **AUTO at hindi mamamanual**; force manual ay nagkakansela ng REMOTE (ang SV switch ay LOCAL at nananatili hanggang piliin ng operator ang REMOTE).
- Panel: may MODE na `REMOTE` at `LOCAL`; sa REMOTE naka-disable ang MAN, SV at MV (naka-label: "REMOTE: AUTO, SV galing sa logic path"); sa LOCAL puwedeng MAN at mag-set ng SV (COS). Ang pagtype ng SV ay hindi na awtomatikong nagpapalipat sa LOCAL.

## As Left (nasubukan)
- `tests/regress/panel_sync.js` (totoong page, ABC-007): LOCAL -> MAN at SV / MV puwede; REMOTE -> AUTO, MAN / SV / MV disabled, pagpindot ng MAN ay walang epekto; force manual = 1 -> MAN at LOCAL; pagkatapos mawala ang signal: LOCAL at MAN pa rin. Pasa lahat (12 sa 12 sa ABC-007; ang ABC-003A ay walang SV switch, kaya ang unang bahagi lang).
- `force_manual.js`: 68 sa 68. `pid_am.js`: 56 pasa, 0 bagsak (ang MAN ay pumipili muna ng LOCAL). Engine mag-isa = buong simulator (5128 net).
- UAT ng MAN case ng controller ay pumipili muna ng LOCAL.
- Hindi nasubukan: tablet; ang ibang SV switch sa panel (isang loop lang ang sinubukan sa totoong page).

## Status
Beta.
