# Plant tools design standard v1 (2026-11-16)

User order, 2026-11-16 8:01 PM PHT: "pagandahin mo lahat ng gawa mo, dapat applications mga yun or webapp, minimalistic, maayos font style, color grade, layout, design, spacing, lahat standard. iaudit mo."

Every Hanni page follows this one standard. The rules live in `std.py`.

## The standard

- One font: IBM Plex Sans, weights 400 / 500 / 600, tabular numbers. No monospace.
- Text sizes: 12 / 13 / 14 / 16 / 20 px. Nothing under 12 px.
- Spacing on a 4 px grid. Corner radius 6 px (controls), 10 px (cards), 999 px (pills).
- Light and dark theme from one set of colour tokens (`--bg, --paper, --fg, --muted, --faint, --edge, --fill, --accent, --ok, --warnc, --badc`) plus a drawing palette (`--c-red, --c-orange, --c-blue, --c-green, --c-yellow, --c-purple, --c-teal, --c-steam, --c-oil, --eq, --metal, --pipe`).
- Controls are 36 px high, 44 px on a phone (width 640 px or less).
- Every page has an app bar at the top: "Plant Tools / page title". "Plant Tools" links to the Plant Tools List.
- A colour word in text is dark text with a coloured underline (class `cw`), not coloured text.
- On a phone a wide drawing scrolls sideways inside its box; the page itself never scrolls sideways.
- RUN = red, STOP = green (project rule).

## Files

- `std.py`: `python3 std.py in.html out.html <key> [light]`. The full pass maps an old page to the standard; `light` is for a page already on the standard tokens. Per-page extra CSS: `extra/<key>.css`.
- `hub.py`: builds the Plant Tools List page. `python3 hub.py <Generator Metering Hardware link>`.

## Measured before and after (16 pages, PC 1280 px and phone 390 px)

- Before: two looks (dark and light), up to 4 font families, 8 to 9 text sizes, 4 weights, text at 11 px, 4 to 81 % of spacing off the grid, up to 19 small tap targets on phone, up to 19 low-contrast texts.
- After (15 pages): 1 family, 5 sizes, 3 weights, 0 text under 12 px, 0 low contrast (light and dark), 0 sideways overflow, 0 script errors, 0 to 8 % spacing off the grid, 0 small tap targets except one native checkbox in Drum Swell Lab.
- Signal Path Finder: only the app bar and the phone input height were changed. Its drawing styles are not restyled (30 % spacing off the grid, 7 radii).

## Not tested

- A real phone. Clicks on the published pages. The real assistant answer in Tag Lookup.
