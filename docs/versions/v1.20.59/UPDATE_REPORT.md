# v1.20.59 (Beta) — COS ng setup sa ABC-005 + COS survey

**Problem:** 42 COS ang hindi 'used' ng engine; kailangang malaman kung may nawawalang gamit.
**As Found:** 35 ay SV COS na ang SV pin ay bukas na ext net (sakop ng SV sa faceplate). Sa ABC-005 (PDF `analog-logic-abc.zip` > `(17)ABC-005.pdf`, binasa): 3 COS ang "SETUP FROM DCS HMI": LIMESTONE DENSITY (AB0116, RANGE 1.1~1.5) papunta sa DIV A, LIMESTONE SULFUR (AB0114, 0.01~9.99 %) papunta sa DIV A, LIMESTONE CaCO3 (AB0115, 0.01~99.99 %) papunta sa LOW LIMIT. Ang mga wire nila ay ext input na may RANGE na, pero 0 ang simula (labas sa range; 0 ang total limestone consumption).
**Work Done:** compile-step.js: ang ext input na nasa dulo ng wire ng isang COS na walang gamit, may RANGE, at hindi SV ng controller, ay nagsisimula sa gitna ng range (1.3 / 5 / 50). Tatlong COS lang sa ABC-005 ang apektado (nasukat); walang ibang sheet, walang SV default na nagbago.
**Na-check:** UAT dry run v1.20.59: 2458 items, 6808 cases, 0 failing.
**Hindi pa na-check:** ABC-001A COS#4, ABC-003E #3, ABC-013 #11, ABC-054 #1 (Needs Verification, basahin ang PDF).
**Web Worker:** hindi na kailangan; ayon sa user okay ang bilis sa tablet niya.
**Status:** Beta.
