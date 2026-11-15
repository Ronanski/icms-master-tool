# Turnover: HANNI : TUTOR

Written 2026-11-15, 8:40 PM PHT, by the HANNI thread (weekly limit near 96 %, plan ends 2026-11-17).
Purpose of the thread: teach the user (DCS engineer, visual learner) how the plant's signals and machines work, with interactive pages. Learning thread only: no app code, no PR to the simulator, no release.

## 1. Where things are

- Source of every page: `/mnt/project-files/tutor-2026-11-11/` (shared project folder, survives threads).
- Published pages (private claude.ai Artifacts, owner = user): list in section 2.
- Memory notes used by this thread: `project-signal-path-finder`, `reference-rack-room-layout-unit1`, `reference-scada-path-to-hmi`, `reference-impeccable-cli`.
- Plant documents are private (Ronanski/icms-plant-documents and the user's PC). Never copy them into this public repo.

## 2. Pages made by this thread

Each line: name, link, file in `/mnt/project-files/tutor-2026-11-11/`, state.

- **Signal Path Finder** (main work): https://claude.ai/artifact/2A5FFvEhkDPnggoM4i95wk, `signal-path-finder.html`, version 16. Any of the 2,703 Unit 1 hardwired DCS signals, drawn like Cisco Packet Tracer with real device drawings and real cabinets (rack room numbers from E2-0-107). Cards show only Panel, TB, Terminal, Signal. Has a per-screen "Find the fault" box.
- **Plant Tools List**: https://claude.ai/artifact/CLWF6fLkvX8VNvtbjfYLwS, `plant-tools.html`.
- **Gen Voltage B-C Path**: https://claude.ai/artifact/KVddKmqbHmxh7fj9e5Fekz, `gen-voltage-bc-flow.html`.
- **Gen Voltage B-C Troubleshooter**: https://claude.ai/artifact/RUet573mt7QS675aqFfjqK, `gen-voltage-bc-troubleshooter.html`.
- **HP-IP Turbine Valves**: https://claude.ai/artifact/NRX6XetGGHB3XWh69oZqz8, `turbine-valves-guide.html`.
- **AI sa Planta**: https://claude.ai/artifact/RrhP6eonrHX7njzh6uStbT, `ai-in-plant.html`.
- **Transfer Lab**: https://claude.ai/artifact/Wiy6NDxu7oSUiFDzc4jahC, `transfer-lab.html`.
- **CV Demand Lab**: https://claude.ai/artifact/FUxNzDMV4Ms5HwLyCZL96w, `cv-demand-lab.html`.
- **Sync Lab**: https://claude.ai/artifact/JYehhTtobFpiBNDmJxMRri, `sync-lab.html`.
- **52G and 52L Lab**: https://claude.ai/artifact/9sa5hstmeApg1YSkArA1sM, `breaker-lab.html`.
- **Drum Swell Lab**: https://claude.ai/artifact/DGPMzcCw3VC6dhpyyTrXdx, `drum-swell-lab.html`.
- **Generator metering hardware**: `gen-metering-hardware.html` (link not confirmed in this note).

## 3. How to continue the Signal Path Finder

- Source: `/mnt/project-files/tutor-2026-11-11/src/page.src.html` plus `data.json` (signal data, private plant data: keep it in the project folder only). Build: replace `@@DATA@@` in the source with the contents of `data.json`, write to `signal-path-finder.html`, publish to the same artifact link.
- Checks (Playwright, in `src/`): `test.js` (4 signals, PC and phone), `audit.js` (40 signals at 1280 / 820 / 400 px: cable over device or text, overflow, small text), `lab.js` (cable labels over content), `tov.js` (text over text inside drawings), `fonts.js` (font list), `sweep.js` (all 2,703 signals: missing or doubled links, unknown modules), `ff.js` (fault finder).
- v16 results: 0 cable over device or text, 0 text overlap, 0 overflow, 0 JS errors; all 2,703 signals linked, 0 unknown modules. Not tested on a real phone or tablet.
- Style rules the user set: light page; cards = Panel, TB, Terminal, Signal only; one font (IBM Plex Sans), page sizes 12/13/14/16/20, drawing text 7/8/9; cable labels = cable numbers only; little blank space. Audit the page yourself (UI/UX skill) before showing it; never make the user point out flaws.

## 4. Open items

- Not in docs yet: 23AI60 channel for gen voltage B-C, cable and station of the TCS HMI, FL-NET port of FCS-2000.
- 18 kV on SCADA case (GCP-AO1005 / AO0582): suspect the output scaling (DCS AO0582 0~100 % vs 0~18 kV) or the RTU560 / SYS600 point scaling; test at MPL108F 8ATB10C 13/14, expected 16.27 mA at 13.8 kV. Waiting on a field reading.
- PDF and HTML copies of the pages for this turnover: not done yet (the HTML holds private plant data, so the copies go to the project folder, not this public repo, unless the user says otherwise).

## 5. Decisions log (user's own words, PHT)

Full conversation (private): `/mnt/project-files/turnover/hanni/conversation.md`.

- 2026-11-10 9:57 PM: "10 years plus n ko sa i and c maintenance... gsto ko sana ma refresh ako s plant operations." (goal of the thread)
- 2026-11-11 9:31 PM: "Visual learner ako pre... gusto ko talaga makita ang mga bagay ultimo daloy ng medium sa loob ng isang pipe or gears."
- 2026-11-12 10:01 PM: "Lgyan mo p rin ng electr terms pero naiintndhan ko. Pti values."
- 2026-11-14 6:17 PM: "Pki simplehan nga mga itetrend ippgawa ko kase s tao ko."
- 2026-11-14 8:28 PM: "Aba eh bumase ka sa planta namin."
- 2026-11-14 8:39 PM: "Ilista natin lahat ng tools na kailangan na makakatulong sa akin." 8:44 PM: "Pwede mo ba gawan ng artifact lahat yan pra lang madali hanapin ang list." (Plant Tools List)
- 2026-11-14 9:05 PM: "Bago k sumagot skn ng buo at final, icheck mo muna buong documents sa pc ko at onedrive ko. Kay librarian yoona tanungin mo."
- 2026-11-14 9:07 PM: "Lahat lng ng may electrical signal pre... dapat makita natin ang hardware loop."
- 2026-11-14 9:27 PM: "Nandyan yan.. tiwala lng kayo sakin.. need nio lng ayusin paghahanap nio." 9:37 PM: "Check mo nga s onedrive n laptop backup."
- 2026-11-14 9:38 PM: "Unit 1 lng gnagawa ntn pero ung unit 2 3 4, identical yan lahat sila."
- 2026-11-14 10:22 PM: "Walang iccheck s field pre. D kmi magloloop check s field. Bawal dyan ang not in docs."
- 2026-11-14 10:27 PM: "Dont use generic blocks."
- 2026-11-15 7:19 AM: "Bkt di pinakita mga equipment n dinaanan sa dcs... ayusin mo wordings at yung mga font style. Bara bara ka gumawa."
- 2026-11-15 9:18 AM: "Hardware at software path ng signal ang dapat makita. Isang view lng. Accurate ang diagram... Tama ang distinction ng mga kable... English ang mga text hindi tagalog."
- 2026-11-15 11:20 AM: mismatch on the SCADA screen must show "saan possible may problema", including field faults. 11:23 AM: "Wag masyado madaming page or tab.. it should be viewable kaagad." "Try mo muna mag trace.. then onti ontiin ntn iimprove."
- 2026-11-15 11:46 AM: "YUNG FLOW, YUNG NETWORK, UNG DEVICES, UNG EQUIPMENTS" (all of them must be shown, for thousands of signals).
- 2026-11-15 12:43 PM: "pwede bang hndi dark. Hndi puro box. Ipakita tlga ung itsura ng actual na device o equipment... cisco net tracer... kita din mga panel na papasukan, andon mga terminals." (Signal Path Finder style)
- 2026-11-15 3:23 PM: "ung cable di mismo nakasaksak or terminate s mismong device." 3:34 PM: no cables stuck together or hidden.
- 2026-11-15 4:09 PM: "di naka emphasize ang panels." 4:11 PM: "Dpt mukhang cabinet tlga yan."
- 2026-11-15 4:29 PM: the value input must work per screen ("Pano kung hnd sa scada? Pno kung s dcs lng?"). 4:33 PM: "Wala nga s diagram mo ung part n lilitaw din ang display sa HMI."
- 2026-11-15 7:01 PM: "Tgnan mo kc diagram ng mga rack... Ano anong panel ang meron s rackroom."
- 2026-11-15 7:07 PM: "wag masyado madaming blank spaces... May proper format."
- 2026-11-15 7:08 PM (repeated 7:48 PM): "No need for too much info. Panel name at okay na. TB number at Terminal # ay ok na... Ok din na nilalagay mo anong uri ng signal ang nandoon."
- 2026-11-15 7:08 PM: "Gmit k skill for better ui ux design." 7:48 PM: "Iaudit mo nga sarili mong gawa... Pati connections."
- 2026-11-15 8:05 PM: "Ganyan ba ang proper font style??!!!!" 8:06 PM: "Kailangan ko b tlga specific sabihin lahat ng mali?" (rule: audit yourself before showing)
- 2026-11-15 8:37 PM: start the turnover now. 8:39 PM: "Kasama artifacts? Pdf? Mga usapan? Lahat? Covered?"
- 2026-11-15 8:39 PM (team decision via coordinator): PDF and HTML copies with private plant data go only to `/mnt/project-files/turnover/hanni/`, never to a public repo.
