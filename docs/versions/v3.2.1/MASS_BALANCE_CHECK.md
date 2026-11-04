# Mass Balance vs plant model (3.2.1-beta.3)

IRENE : PLANT MODEL, 2026-11-04 PHT. Source: `document-references/mass-balance-diagram-K1AU3-A2-0-001-RA.pdf` (FHI / GIBSIN, Rev 0
2015-06-30). Pahina: MB-020 seawater p12, MB-021 auxiliary cooling water p13, MB-023 compressed air p15 (PA) / p16 (IA), MB-024
make-up p17. Ang MB ay DESIGN point. Ayon sa CLAUDE.md, ang HMI snapshot at SOP ang totoong operating point, kaya kapag hindi
tugma, ang snapshot / SOP ang ginagamit at nakatala ito rito.

## Pinalitan (dati NO-SOURCE, ngayon may source)
1. PA compressor capacity: 5800 → **5100 Nm3/h** (MB-023 1/2 items 2, 4, 6).
2. IA compressor capacity: 1600 → **1500 Nm3/h** (MB-023 2/2 items 2, 4, 6). IA power sa buong flow 176 kW (ratio ng PA, NO-SOURCE pa rin).
3. Fill ng expansion tank T-1109: 10 → **20 T/H** (MB-024 item 17, MB-021 item 1).
4. Kasabay (DATA_ANSWERS item 6): MWP shaft power × 0.74, para tugma sa snapshot 28.png (20.5 / 20.8 A). UNUSUAL.

## Tugma
- SWP 18900 T/H bawat isa, 2 tumatakbo (MB-020 items 1-1 ~ 1-3, line 2 37800) = EBARA rated at S-1502 normal flow.
- Condenser seawater 30 → 35.6 °C (MB-020 items 5, 6) = D1-0-039.
- SWBP 1000 T/H bawat isa; CCWHE seawater 1000 T/H, 30 → 42 °C (MB-020 items 7, 10, 11) = D1-0-034 / D1-0-041.
- ACWP 1500 T/H, isa tumatakbo; CCWHE 750 T/H × 2 (MB-021 items 5 ~ 8) = model.
- ACW design 50 → 34 °C (MB-021 items 7, 8) = D1-0-041.
- MWP recirculation 10 T/H bawat pump (MB-024 items 11 ~ 13) = model.
- IA tanks 7.0 kg/cm2 (MB-023 2/2) = SOP at snapshot.

## Hindi tugma (snapshot / SOP ang ginamit)
1. **SWP discharge:** MB 2.8, model 2.26 kg/cm2 (SOP 2.2 ~ 2.4).
2. **SWBP discharge:** MB 4.0, model 2.35 kg/cm2 (SOP 2.3 ~ 2.4). Flow ng 2 SWBP sa model ~2450 m3/h, MB 2000.
3. **Condenser seawater drop:** MB 2.5 → 2.0 (0.5), model 0.4 (SOP "0.4 Kg/cm2 difference").
4. **ACW pressure:** MB suction 3.0, discharge 8.0, supply header 7.0; model / snapshot 27.PNG PICW1152 6.4, PICW1153 5.2.
5. **ACW temperatura:** MB supply 34, return 50 °C (design heat ~27,900 kW); snapshot 38 / 40 °C (~3,450 kW). Ito rin ang dahilan ng UA 7.2 % (UNUSUAL sa MU_CCW_PLANT_MODEL.md).
6. **PA pressure:** MB 8.0, model 7.0 kg/cm2 (SOP "up to 7 Kg/cm2").
7. **Ilang compressor:** MB 2 PA at 2 IA tumatakbo; SOP "at least one", sa model 1 + standby.
8. **MU header:** MB 7.0, model 9.0 kg/cm2 (snapshot 28.png, recirculation lang ang flow). MWP flow sa MB 70 T/H bawat pump.

## Para sa susunod na system (galing sa MB-021)
- Turbine oil cooler: 170 T/H bawat isa, 5 → 4.75 kg/cm2, 34 → 41 °C (items 12, 13). Gagamitin sa Turbine Oil.
- Generator air coolers 76.5 / 47 / 40 T/H, 34 → 42 °C; BFP coolers 39.6 T/H; IA compressor 29, IA dryer 6, PA compressor 80, PA dryer 18 T/H.
