# HMI art spec: paano iguguhit ang plant graphics

Audit ng Air & Flue Gas sample v3 (PR #49, `src/ui/plant/hmi2.js`, commit 2182970), 2026-10-27.
Sinabi ng user: tama ang flow. Ang drawing ng equipment at ang art ang pangit ("gawang bata").
Ang spec na ito ay para sa graphics lang. Hindi nito binabago ang flow, ang mga tag, ang logic at ang plant model.

Batayan: control-room snapshot 7, 8, 38 (`document-references/hmi-snapshot-sample.zip`), ISA-101 (High Performance HMI),
ISA 5.1 (instrument bubble), ISO 10628 (hugis ng equipment), ISA-18.2 (alarm), at ang karaniwang hitsura ng ABB 800xA,
Emerson Ovation at Yokogawa CENTUM na process graphic.

Symbol library na susundin: `docs/hmi/symbols/` (`hmi-symbols.svg` = sprite, `gallery.svg` = lahat ng symbol,
`proof-after.svg` = before/after na halimbawa, `build.mjs` = pinagmulan; `node docs/hmi/symbols/build.mjs` para gawin ulit).

## 1. Bakit mukhang "gawang bata" (ebidensya: v3 screenshot, 150 MW)

| # | Nakita sa v3 | Bakit pangit | Batayan |
|---|---|---|---|
| 1 | Ducts na may puting tuldok-tuldok na gumagalaw sa loob at may outline sa magkabilang gilid | Mukhang conveyor belt o riles ng laruang tren. Ang tunay na DCS ay solid na duct; ang direksyon ay maliit na arrow. | ISA-101: animation lang kung may ibig sabihin |
| 2 | Malalaking beige na tatsulok sa dulo ng duct | Clip-art na arrow, mas malaki pa sa damper | ISO 10628: flow arrow ay maliit |
| 3 | Fan = bilog na may puting "swirl" na icon | Mukhang icon ng PC fan. Ang tunay na fan ay volute (spiral casing) na may outlet at motor sa shaft. | ISO 10628 fan; snapshot 7 / 8 (volute + motor) |
| 4 | Damper = manipis na guhit na may pulang tuldok | Maliit, at ang pula ay kulay ng alarm | ISA-101: pula = alarm lang |
| 5 | Malalaking pula / berdeng parisukat na "M" | Mukhang butones ng laruan, mas matingkad pa sa alarm | ISA-101; ang plant ay pula = tumatakbo (snapshot 7 VCB ON) kaya maliit na band lang |
| 6 | Furnace na may orange na apoy-glow at brick texture | Parang video game. Walang ganitong glow sa operator graphic. | ISA-101: walang dekorasyon |
| 7 | Stack na may pula-puting guhit | Aviation marking, hindi kailangan sa DCS | — |
| 8 | Apat na iba't ibang estilo: hatching sa backpass, makinang na bakal, flat na kahon, brick | Hindi magkakasama ang hitsura; parang pinagdikit | Gestalt: isang istilo |
| 9 | Label na nasa ibabaw ng hatching na may itim na kahon ("SA SECTION") | Mabigat at magulo basahin | Label sa labas ng equipment |
| 10 | Puting bilog na instrument bubble | Ang pinakamaputing bagay sa screen ay ang pinaka-hindi-mahalaga | ISA-101: ang value ang mahalaga |
| 11 | Cyan sa lahat ng value, SV, MV at bar | Walang hierarchy; lahat sumisigaw | ISA-101: tahimik ang normal |
| 12 | Malaking TREND panel na halos walang laman; CEMS na "-----" | Mukhang hindi tapos | Walang bakanteng panel |

## 2. Mga patakaran (gawin lahat)

**Liwanag at shading.** Isang ilaw lang, galing sa itaas-kaliwa. Gradient na 3 ~ 4 stop lang, sa haba ng
equipment (cylinder = pahalang na gradient). Walang glow, walang drop shadow, walang texture na lampas ~15 % ang contrast.
Ang bawat equipment ay may 1 px na outline `#0c1014`.

**Background at grid.** `#1b2128`. Grid na 8 px; lahat ng x / y ng equipment, duct at value box ay nasa grid.

**Kulay ng medium (duct fill, gradient):**

| Medium | Gradient (gilid → liwanag → gitna → gilid) |
|---|---|
| Cold air | `#3c566e` `#6a88a2` `#4d6a84` `#334a5f` |
| Hot air | `#6a5136` `#a0805a` `#806446` `#5a442e` |
| Flue gas | `#55514d` `#7f7973` `#655f5a` `#4a4642` |
| Walang daloy (fan stop) | flat `#3a424b` |

**Kapal ng linya.** Main duct 14 px, branch duct 8 ~ 10 px, process pipe 3 px, signal / leader line 0.75 px dashed `3 2` `#5b6774`.
Walang outline na mas makapal sa 1 px. Flow arrow = chevron 6 × 8 px, `#e3e8ec` 55 % opacity, isa bawat ~200 px, HINDI gumagalaw.

**Equipment (gamitin ang symbol, huwag iguhit ulit):**

| Equipment | Symbol | Laki sa 1280 px na screen | Tala |
|---|---|---|---|
| SAF / PAF / IDF | `hs-fan` + `hs-motor` | 84 × 84 + 44 × 26 | Outlet sa itaas-kanan; motor nakakabit sa ilalim na may shaft. Ang status ay ang 3 px na band sa ilalim ng motor: pula `#d64545` = tumatakbo, berde `#3fa34d` = hinto (convention ng planta), `#59636d` = walang data |
| FAB / maliit na fan | `hs-fan` 0.5× | 42 × 42 | parehong patakaran |
| Damper | `hs-damper` + 3 blade | 36 × 14 sa duct | Blade rotate 90° (sarado) → 0° (bukas) ayon sa tunay na posisyon (ZT o MV) |
| Control valve | `hs-cv` | 28 × 30 | Body fill `#c3ccd5` bukas, `#2a3138` sarado |
| On/off valve (MOV) | `hs-mov` | 28 × 30 | parehong patakaran |
| Air intake | `hs-intake` | 30 × 40 | "ATM" sa ilalim |
| Air preheater | `hs-aph` | 160 × 210 | Ayon sa snapshot 038: air side sa kaliwa (hot out sa itaas, cold in sa ibaba, SA at PA), gas side sa kanan (in sa itaas, out sa ibaba) |
| ESP | `hs-esp` | 230 × 160 | 3 field, T/R sa bubong, 3 hopper |
| CFB furnace | `hs-furnace` | 170 × 430 | Waterwall = mahinang guhit; refractory = payak na kulay; walang apoy, walang brick |
| Cyclone | `hs-cyclone` | 100 × 270 | |
| Stack | `hs-stack` | 60 × 400 | Walang pula-puting guhit |
| Drum | `hs-drum` | 180 × 36 | |
| SH / RH / ECO bank | `hs-bank` | ayon sa backpass | label sa labas, hindi sa ibabaw ng tubo |

**Instrument bubble (ISA 5.1).** Bilog r 9 px, fill = background, guhit 1 px `#8794a1`, letra 7.5 px 600 `#c3ccd5`. HINDI puti ang loob.

**Value box.** 58 × 17 px, fill `#0d1116`, guhit 1 px `#3a4550`, radius 1.5. Value: mono 12.5 px `#e8eef3`, right-aligned.
Tag sa itaas: 9 px `#7f8b97`. Unit sa kanan, labas ng kahon: 9 px `#8b97a3`.
Alarm: guhit 1.5 px at value na kulay `#e5484d` (high) o `#f5a524` (medium), kasama ang priority na hugis; kumukurap lang kapag hindi pa na-acknowledge.

**Loop faceplate (sa mimic).** 132 × 58 px, fill `#20272f`, guhit `#46525e`. Hilera: tag (10 px 600), mode pill sa kanan,
PV / SV / MV (mono 11 px), MV bar 52 × 5 px na `#8fa4b8`. Mode pill 30 × 12: MAN = `#f5a524` na guhit at letra sa `#2a2110`;
AUT = `#c3ccd5` sa `#262d35`; CAS / REM = `#6cb4ff` sa `#10202e`. Hindi matingkad na fill ang mode, guhit at letra lang.

**Typography.** `Inter, 'Segoe UI', Roboto, Arial` para sa label; `'JetBrains Mono', Consolas, 'Roboto Mono'` para sa numero.
Laki: 9 (tag, unit), 10 ~ 10.5 (label, equipment), 11 (pangalan ng equipment, 600), 12.5 (value), 15 (pamagat ng screen).
Dalawang weight lang: 400 at 600. Pangalan ng equipment: ALL CAPS, 600, letter-spacing 0.03 em, `#dfe6ec`. Label ng daloy: 9 px `#aeb9c4`.

**Kulay na may ibig sabihin lang.** Pula `#e5484d` = alarm high; amber `#f5a524` = alarm medium o MAN mode; asul `#6cb4ff` = CAS / REM;
pula / berdeng band = run / stop ng motor. Lahat ng iba ay grey. Walang cyan sa normal na value.

## 3. Ang gagawin ng HMI thread (sunod-sunod, pinakamahalaga muna)

1. Palitan ang lahat ng duct ng solid na gradient duct (14 / 10 px), alisin ang gumagalaw na tuldok at ang malalaking tatsulok; maliit na chevron lang.
2. Palitan ang fan ng `hs-fan` + `hs-motor` na may status band; alisin ang pula / berdeng "M" na parisukat.
3. Palitan ang damper ng `hs-damper` na may blade na sumusunod sa posisyon.
4. Furnace: alisin ang glow at brick; gamitin ang `hs-furnace`. Stack: alisin ang guhit.
5. Iisang estilo sa backpass, APH, ESP (gamitin ang symbol). Ilipat ang mga label sa labas ng equipment.
6. Instrument bubble: hindi na puti. Value: `#e8eef3` na mono, hindi cyan.
7. Faceplate: gamitin ang estilo sa itaas (PV / SV / MV, mode pill na guhit lang).
8. Alisin ang malaking walang-laman na TREND panel sa main mimic; ilagay ang trend sa faceplate / pop-up, o punuin ang buffer mula sa simula. CEMS na walang value: ipakita ang tamang tag at "BAD" / "—" na may dahilan, o alisin.
9. Iguhit sa 8 px grid. Suriin sa 1280 × 800, 800 × 1280 at 390 × 844 bago ipakita sa user.

Gaan: SVG lang, walang larawan. Ang buong sprite ay ~15 KB; ang gradient ay `<defs>` na iisa para sa lahat ng screen.
