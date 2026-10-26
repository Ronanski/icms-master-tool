# Current Project Handoff

> Iisang kasalukuyang estado lang. Palitan kapag nagbago; huwag magdagdag ng kasaysayan (nasa `docs/versions/<ver>/UPDATE_REPORT.md` at git history). Pinaikli 2026-10-26: ang dating 200+ linya ng lumang Beta notes ay tinanggal dito.

## SIMULAN DITO (2026-10-26 PHT)

- **Stable:** v2.4.0 sa `main`.
- **Beta (HMI sample):** branch `claude/project-thread-1h2161` (PR #49, nakapatong sa #46; version 3.2.0-beta.39, ang numero ay ibibigay sa pagsasama). Bagong HMI sample Air & Flue Gas; naghihintay ng pag-apruba ng style ng user (`docs/hmi/HMI_SYSTEMS.md`).
- **Beta:** `3.2.0-beta.39`, branch `claude/project-thread-mzyrtg` (nakapatong sa beta.39 / PR #45 `claude/project-thread-0amxbo`, na nakapatong sa docs PR #43 at beta.38 / PR #42). Roadmap step 1 TAPOS; step 5 (ABC ↔ DITL links) TAPOS; may ibang thread na gumagawa ng step 2 (plant model) at Sand DITL.
- **Ang gusto ng user:** `docs/SPEC.md` (S1 ~ S9). Plano = seksyon 3 ng file na iyon. Wala nang ROADMAP / CHECKLIST.
- **Pag-check ng user:** `docs/USER_CHECK.md`.
- **Rules:** `CLAUDE.md`, `PROJECT_RULES.md` (test policy = seksyon 5).
- Golden reference ng start-up (Claude Doc): https://claude.ai/artifact/D2EXiHjLsiJf12RBPniT39

## Utos ng user na madalas malimutan
- Update sa user bawat ~30 minuto habang may mahabang trabaho, may ETA sa oras (PHT). Sumagot muna bago magpatuloy.
- Test batay sa reference (PR-OPE-5002, DITL, ATS criteria, FHI Fig. 2, HMI snapshot), hindi sa coach ng Training. Ang kulang na model ay FAIL, hindi "field step".
- Huwag magpush ng paisa-isang UI fix: lakarin muna ang bawat screen (PC, tablet, phone) bago ang Beta.
- Per-loop, Warm at Hot: TINANGGAL na sa app (beta.39). Huwag ibalik hangga't hindi sinasabi ng user.

## Bagong HMI (PR #49, roadmap step 6)
- Desisyon ng user 2026-10-26: ang HMI ay GUGUHITIN MULI (sariling vector graphics); ang snapshot ay gabay lang. Pinalitan nito ang lumang "kopyahin 1:1".
- `src/ui/plant/hmi2.js`: library ng simbolo + screen `AFG` (Air & Flue Gas). `plant.js` draw: `sys.v2` → `PLANT_V2.draw` (parehong live link / faceplate).
- Huwag pa tanggalin ang lumang Plant HMI hangga't wala pang kapalit ang lahat ng system (14 screen sa `docs/hmi/HMI_SYSTEMS.md`).

## Estado ng app (links ABC ↔ DITL)
- ABC ↔ DITL: ang BAWAT "FROM / TO DITL xx-nn" sa ABC (233) ay page link (`dsTextAt` / `dsTextClick` sa `links-canvas.js`, pick sa `interaction.js`); listahan = pagpipilian; DITL → ABC ay may ↩ Back sa ABC (`AN.hist` marker `{dig:true}`). Test: `tests/regress/abc_ditl_links.js`.
- Turbine + TCS model (`src/analog/engine/tcs.js`, `docs/tcs/ATS_CRITERIA.md`), start-up steam ayon sa FHI Fig. 2 / 3 / 4 (`unit.js`).
- `tests/regress/sop_bawal.js`: 19 / 19 (lahat ng maagang aksyon ay tinatanggihan).
- Training: Cold → 150 MW sa isang screen (dock), sunod sa PR-OPE-5002.
- Plant chip: OFF | Unit lang; starting state: Cold o 150 MW lang (chip at Home). Ang CHECK scenario na coal / byp / roll ay stage na lang sa loob ng "full" chain.

## Susunod na gagawin (roadmap sa `docs/SPEC.md` seksyon 3)
1. MST 555 °C habang CCS load up 90 → 150 MW (H 548, HH 555, TE-MS1004-1): spray TICBR1150 / TICMS1004.
2. RH biasing damper: sa probe, HICHR1002A 10 → 60 % ay nagpababa ng RHT 482 → 434 °C (dapat tumaas). Suriin ang ABC-020 at `plant.js` xsh.
3. Ang iba: `docs/SPEC.md` seksyon 3.

## Hindi pa nasubok
PC / tablet / EXE / APK ng user sa beta.25 pataas; ang `docs/USER_CHECK.md` ay hindi pa nilalakad ng user.

## Saan ang mga bagay
- References: `document-references/` (listahan: `CLAUDE.md` rule 4).
- Source: `src/` (`src/README.md`); build `npm run build`, `npm run check`; html sa `dist/`.
- Tests: `tests/regress/` (README sa loob), `tools/training/human_run.js`, `tools/ui-audit/audit.mjs`.
- Reports: `docs/versions/v3.2.0/UPDATE_REPORT.md`; link audit `UNLINK_AUDIT.md`; ABC audit `docs/abc-audit/ABC-AUDIT.md`; HMI operating points `docs/hmi/`.
- Workflows: `.github/workflows/` (checks bawat push; site, release, clean = GO STABLE lang).

## Mga tala
- Huwag ipadala ang html sa chat (~3.7 MB); gamitin ang Beta page.
- Hindi ma-delete ang lumang branch mula sa cloud session; ang user ang gagawa sa GitHub Branches page (kung gusto niya).
