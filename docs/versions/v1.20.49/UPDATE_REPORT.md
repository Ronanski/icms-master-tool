# v1.20.49 (Beta) - PV / MV / SV at A/M ayon sa operator rule ng user (2026-10-15)

## Ang rule (user)
FORCE MANUAL: naka-enable ang COS para sa .MV; hindi puwedeng AUTO hangga't may aktibong signal na nagpapa-force manual.
AUTO: kapag wala na ang signal, puwede nang ilipat sa AUTO, pero **hindi ito automatic**. Sa AUTO, ang COS-SV ang gagana o ang SV path ng logic (ayon sa logic diagram). Puwede ring i-MAN: pipiliin nito ang COS na malapit sa .MV.

## As Found
v1.20.46: pagkatapos mawala ang force-manual signal, bumabalik sa AUTO nang kusa (suspended lang ang AUTO request). Ang force manual ay gumagana lang kapag may pinindot nang button sa panel dati (ang engine ay hindi alam kung aling leg ang AUTO).

## Work Done
- Engine: ang A/M station ng controller ay hinahanap na ng engine (`anStationOf` sa `engine/sheets.js`, parehong gamit ng panel); alam na ng engine ang AUTO leg ng bawat station mula sa simula.
- Engine (`plant.js`): ang aktibong select signal ng drawing ay mas mataas kaysa sa operator at **nananatili ang leg pagkatapos**: 1:B (force manual) -> MANUAL hanggang pindutin ng operator ang AUTO; 1:A (sariling signal ng drawing) -> AUTO ng logic. Hindi na bumabalik sa AUTO nang kusa.
- Panel: AUTO disabled habang may force manual (may pangalan ng signal); sa AUTO naka-disable ang MV (COS ng .MV), naka-enable ang SV. May label kung saan galing ang SV: LOCAL (COS ng operator) o REMOTE (path ng logic); REM ay bumabalik sa path.

## As Left (nasubukan)
- `tests/regress/force_manual.js`: **68 sa 68 controller** pasa (force manual -> AUTO tinanggihan; pagkatapos alisin -> MANUAL pa rin; pindutin ang AUTO -> AUTO, maliban kung ang logic mismo ang humihingi ng manual / 1:A).
- `tests/regress/panel_sync.js` sa totoong page (DOM clicks): ABC-007 FICFA1081 at ABC-003A FICFA1043A pasa.
- Walang pagbabago sa normal na takbo: ang buong sim (54 sheet, 5128 net, 30 s) ay pareho sa v1.20.48 (0 ang naiba). Ang engine mag-isa (`tests/engine/isolated.js`) = pareho sa buong simulator; `reset.js` 51 sa 51; `faceplate.js` 68 controller, 0 mali.
- Hindi nasubukan: tablet; ang SV LOCAL / REMOTE sa lahat ng 25 SV na may COS (ang panel test ay dalawang loop).

## Status
Beta.
