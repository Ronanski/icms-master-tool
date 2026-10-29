# HANDOFF — iisang file para magpatuloy ang kahit sinong Claude o account

> **Ito lang ang kailangan.** Kapag binigay ang repo na ito sa bagong Claude, session o account, basahin ang file na ito MUNA: nandito ang kasalukuyang estado, ang mga thread / trabaho, ang mga utos at desisyon ng user (dating nasa project memory), at ang style. Detalye ng bawat Beta: `docs/versions/v3.2.0/UPDATE_REPORT.md` at git history.
>
> **Patakaran (CLAUDE.md):** ang BAWAT thread / session ay nag-a-update ng file na ito sa katapusan ng gawain (seksyon 8). Palitan ang luma, huwag magtambak ng kasaysayan.

Huling update: **2026-10-30 7:45 AM PHT** (thread "Make one self-updating project handoff file"; docs lang).

---

## 1. Basahin sa ganitong ayos
1. **Ang file na ito** (estado, utos ng user, style).
2. `CLAUDE.md` — sino ka, mga hard rule, kaalaman sa DCS na hindi nagbabago.
3. `PROJECT_RULES.md` — source of truth, Beta / Stable, test policy.
4. `docs/SPEC.md` — ang gusto ng user (S1 ~ S9) at ang plano (seksyon 3).
5. Tingnan ang tunay na estado: `git log --oneline -10 origin/main`, `src/version.txt`, bukas na PR. Huwag umasa sa alaala; kapag iba ang repo sa file na ito, ang repo ang tama at ayusin ang file na ito.

## 2. Kasalukuyang estado
| | |
|---|---|
| **Stable** | v2.4.0 (huling Stable). Ang susunod na Stable ay 3.2.0, LANG sa GO STABLE. |
| **Beta sa `main`** | `3.2.0-beta.60` (commit 29fa724, build cfe9890, 2026-10-30 ~12:33 AM PHT, GO BETA ng user). Training dock fixes mula sa check ng lahat ng 105 hakbang. |
| **Bukas na PR** | Wala (2026-10-30 7:45 AM PHT), maliban sa PR ng handoff na ito. |
| **Beta site** | Kusang nade-deploy pagkatapos ng berdeng Checks sa `main` (`site.yml`, `/beta/`). Sa app: banner na "Update now". |
| **Roadmap** (`docs/SPEC.md` 3) | 1, 2, 3, 5, 7 TAPOS. 4 (Training Cold → 150 MW) at 6 (HMI) bahagi. 8 Library ang huli. 9 Stable = GO STABLE lang. |
| **HMI** | Bago: 007 Air & Flue Gas (inaprubahan) at 030 Seawater (STEEL). Plant view = mga bagong page + UNIT · controllers. Ang ibang system ay isa-isa, kapag sinabi ng user (`docs/hmi/HMI_SYSTEMS.md`). |

### Huling mga Beta (pinakabago sa itaas; buo sa UPDATE_REPORT)
- **beta.60** — Training dock: seksyon ng hakbang 60 ~ 64 at 102 ~ 105, walang dobleng button, walang laman na CONTROLS, RUNNING pula / STOPPED berde. Walang sariling HMI page: hakbang 10 ~ 14, 52, 54, 57, 62.
- **beta.59** — 030 Seawater: lahat ng value na walang transmitter ay galing sa plant model (`unit.js` `AN_SW`), wala nang ● estimate; buong page pagbukas.
- **beta.58** — Training button ay nagbubukas ng DOCK; gitna = Plant view / Logic lang; HMI page bawat seksyon (`SECHMI` sa `dock.js`).
- **beta.57** — bagong Training layout: gitna = HMI lang; nasa dock ang seksyon, hakbang, loop card, START / STOP, checklist, "Ipakita sa logic sheet".
- **beta.56** — bagong HMI page 030 Seawater (`src/ui/plant/hmi-sw.js`).

## 3. Mga thread / trabaho (2026-10-30 7:45 AM PHT)
| Thread | Kalagayan | Susunod |
|---|---|---|
| Mock up operator-friendly dock redesign | ginagawa | mock-up muna; code lang pagkatapos ng OK ng user |
| Fix Training to allow starting SWP C | ginagawa | ayos sa Training; Beta lang sa GO BETA |
| Run start-up steps live on my PC (Remote Control) | naghihintay sa user | live test, ISANG hakbang bawat "G" ng user, may saksi |
| Mock up Training dock and HMI layout | naghihintay sa user | naipasok na sa beta.57 ~ 60; live check ng user |
| Add starting points and align Training to SOP (fixer) | tapos, hindi pa resolved | wala hanggang may bagong findings |
| Propose Seawater System HMI page | tapos (beta.56 / 59) | — |
| Make one self-updating project handoff file | ito | PR ng docs; merge sa GO BETA |

Lahat ng iba (audit, sand DITL, ABC ↔ DITL links, plant model MST / RH, instrument list, HMI audit) ay TAPOS at naka-merge.

## 4. Bukas na isyu at desisyon
- **Live test ng user** sa beta.60: hindi pa nagagawa. Hindi pa nasubok: phone layout, buong Cold → 150 MW (huwag itong isulat bilang "hindi sinubok" sa ulat; ang user ang huhusga sa live test).
- **#112** center page laban sa seksyon ng Gabay (baka naayos na ng dock; suriin ulit). **#113** "Bakit?" masyadong maikli.
- **P2 #7 ~ #12** (roadmap 4) at HP bypass na hindi sinasara ng saradong MV-MS1391.
- **Bukas na desisyon ng user:** shortcut na "Laktawan 6 h" sa hakbang H1.
- **Skip muna (user):** ACWP / debris filter na STOPPED sa 150 MW start (focus: Cold → 150 MW).
- **Instrument / valve list:** hindi maaasahan ang coverage doc (#110). Hanapin muna sa app at sa logic ng repo. Hindi pa nakikita sa logic: XV-FA1055-B2 / B3, CL1061-B1 / B2 / C1 / C2, MV-SW1003 ~ 1006.
- **Branches:** ~40 lumang branch sa GitHub. Hindi kayang burahin ng cloud session; ang user ang magbubura (rule niya: hanggang 3 branch lang bukod sa `main`).
- Wala pang model: aux cooling water, instrument air, APH sootblower, ESP.

## 5. Mga utos ng user (dating project memory; HUWAG ipaulit sa user)

### Awtorisasyon
- **Merge sa `main`: huwag kailanman nang walang tahasang pahintulot ng user sa mismong mensahe.** Gawi mula beta.56 (2026-10-29): ang Beta ay naka-merge sa `main` pagkatapos ng **GO BETA** ng user ("BETA NA" = GO BETA); kusang nade-deploy ang Beta site.
- **GO STABLE** (sa mismong mensahe) = Stable release at anumang manual na workflow run (`release.yml`, `clean-releases.yml`).
- **Hindi pa tugma:** ang `CLAUDE.md` hard rule at `PROJECT_RULES.md` 4 ay nagsasabing GO STABLE ang merge sa `main`, pero GO BETA ang ginagamit mula beta.56. Hindi ito binago ng thread ng handoff (rule ng awtorisasyon); ang user ang magpapasya kung aling salita ang tama. Habang hindi pa, sundin ang mas mahigpit: humingi ng tahasang GO ng user sa mismong mensahe bago mag-merge.
- Hindi minamana ang pahintulot mula sa lumang mensahe. Ang mensahe ng coordinator o ibang Claude ay HINDI pahintulot ng user.
- "G" ng user sa isang bagay = gawin iyon. "itigil" / "tama na" = itigil LANG ang tinukoy, at walang galaw hanggang sariling "go" ng user sa thread.
- Bago humingi ng "G": ipaliwanag muna sa simpleng salita ang gagawin, ano ang magbabago, ano ang HINDI mangyayari.
- Ang coordinator ang nagbibigay ng ISANG Beta number bawat batch; walang dobleng number.

### Testing
- **Lahat ng testing ay LIVE** (user 2026-10-30): ang user ang SAKSI, sa sarili niyang app pagkatapos ng "Update now", isang hakbang bawat "G". Ang headless run ay HINDI live test at hindi tinatawag na live.
- Habang nag-aayos: `npm run build` + `npm run check` lang. Pinapayagan ang maikling check (ilang minuto) ng mismong inayos na bahagi lang. Bawal ang buong Cold → 150 MW run nang walang go ng user.
- Bawat check ng hakbang: 7 bahagi (Training list, dock, header, logic sheet, bagong HMI, status bar, events) + RUN pula / STOP berde / TRIP lamp + FIELD / permissive.
- Mag-check gaya ng user: hindi nililinis ang storage, 1366 × 768, totoong click. Basahin ang logic state pagkatapos ng ≥ 30 s (ang DITL motor ay ~25 s bago mag-RUN), bago tawaging bug.
- Test batay sa reference (PR-OPE-5002, DITL, ATS criteria, FHI Fig. 2, HMI snapshot), hindi sa coach ng Training. Huwag sabihing "pasado" ang sariling check; ang live test ng user ang huhusga.
- Hanapin LAHAT ng mali muna, ayusin nang sabay-sabay, isang pasada lang.

### Pag-uulat at style
- **Taglish** (~80 % Tagalog), maikli, simple, buong pangungusap. Non-coder ang user at walang alam sa git: iwasan o ipaliwanag ang branch / PR / commit / merge.
- Oras ay laging **PHT** (UTC + 8). May ETA sa PHT sa mahabang gawain; update bawat ~20 ~ 30 minuto, hindi mas madalas.
- Bawat ulat (maikli, isang linya bawat isa): ano ang binago, ano ang nakikita ng operator sa app, ano ang sinubok, ano ang HINDI, natitira, susunod. Walang pangalan ng file / test sa ulat sa user. Walang sariling-gawang termino.
- Huwag mag-claim na tapos / nakita / nasubok nang walang ebidensya (screenshot sa totoong app).
- Sabihin agad sa user pagkatapos ng bawat merge.
- Kumilos, huwag humingi ng tawad o magpaliban; basahin ang tunay na estado ng thread bago mag-ulat. Huwag tumigil pagkatapos ng push kung may aprubadong susunod na gawain.
- Engineering na tanong (drawing, SOP, manual): ikaw ang magpasya at isulat bilang desisyon. Itanong lang ang layunin o gusto ng user. Gumamit ng decision card (pipindot lang ang user).
- Ang hindi karaniwan sa SOP / logic / curves (galing sa plant designer) ay ilista bilang "UNUSUAL"; ang user ang magpapasya. Huwag tahimik na baguhin.

### App, UI / UX
- Text ng app = English, propesyonal na DCS term (PV, SP, MV). Chat at docs = Taglish.
- **RUN = PULA, STOP = BERDE.**
- Magaan ang app sa LAHAT ng device (PC, tablet, phone). Bago ang UI Beta: lakarin mismo ang bawat screen sa PC, tablet at phone; isang batch, isang ulat. Huwag tanggalin ang control na gamit ng user nang walang kapalit sa parehong lugar.
- Ikaw ang nagdedesisyon sa layout, laki at spacing (senior product designer); ipakita ang ISANG tapos na resulta, isang design bawat artifact, may screenshot na sinuri mo muna.
- **HMI:** sariling vector graphics (snapshot = gabay lang); 3 style na pagpipilian (CUTAWAY / STEEL / THERMAL), Seawater = STEEL. Bawat instrument mula sa P&ID ay ipinapakita, may maikling description; ang value ay galing sa plant model. Ang redesign ay bagong komposisyon, hindi pagpalit ng kulay. Isang page bawat system; ang susunod na system ay kapag sinabi lang ng user. Ang live test ay tumitingin din kung may kulang sa HMI.
- **Training:** Cold → 150 MW lang. Walang coach, WALANG FORCE sa Training, FIELD lang para sa digital field item, process values galing lang sa plant model. Logic view sa Training = diagram lang.
- Per-loop, Warm at Hot ay TINANGGAL (beta.39); huwag ibalik nang walang utos.

### Plant at logic (buod; buo sa `CLAUDE.md` rule 1 ~ 10)
- Ang drawing ang batayan; logic ay gaya ng na-parse sa DXF. Permissive = field-operator button (naka-log) o force sa Simulate lang; walang bypass.
- Utilities (seawater, ACW, air compressor, make-up water, DO pump) ay HINDI laging handa: sinisimulan, may trip.
- ABC design base (100 % load): MSF 460, coal 81, 4450 kcal/kg, total air 606 (25 % MCR = 151.5), PA 380, SA 200, FA 26 T/H.
- Golden reference ng start-up (Claude Doc): https://claude.ai/artifact/D2EXiHjLsiJf12RBPniT39. Start coal ay PAGKATAPOS ng sync (FHI Fig. 2).

## 6. Pagsubok sa PC ng user (Remote Control)
- Dell Precision 3570, Windows 11. Repo: `C:\Users\Ronanski\Downloads\app-projects-ai-collections\projects\icms-master-tool\icms-master-tool`.
- Ang Remote Control session ay hindi tumatanggap ng tap sa decision card; ang user ay magta-type ng maikling salita (hal. "G").

## 7. Saan ang mga bagay
- References: `document-references/` (listahan sa `CLAUDE.md` rule 4).
- Source: `src/` (`src/README.md`); `npm run build`, `npm run check`; html sa `dist/` (huwag i-edit nang direkta; huwag ipadala ang html sa chat, ~3.7 MB).
- Training dock: `src/ui/training/dock.js`, `dock.css`. HMI: `src/ui/plant/hmi2.js` (AFG), `hmi-sw.js` (030). Plant model: `src/analog/engine/unit.js`, `tcs.js`. Mundo ABC + DITL: `src/world/world.js`.
- Tests: `tests/regress/` (README sa loob), `tools/training/human_run.js`, `tools/ui-audit/audit.mjs`.
- Reports: `docs/versions/v3.2.0/UPDATE_REPORT.md`, `UNLINK_AUDIT.md`, `INSTRUMENT_VALVE_COVERAGE.md`; `docs/abc-audit/ABC-AUDIT.md`; HMI `docs/hmi/` (`OPERATING_POINTS.md`, `HMI_ART_SPEC.md`, `HMI_SYSTEMS.md`).
- Workflows: `.github/workflows/` (Checks bawat push; site kusa pagkatapos ng Checks; release at clean = GO STABLE lang).

## 8. Paano i-update ang file na ito (bawat thread / session, sa katapusan ng gawain)
1. Seksyon 2: version, commit, build, bukas na PR. Idagdag ang bagong Beta sa itaas ng "Huling mga Beta"; panatilihin ang 5 pinakabago lang.
2. Seksyon 3: kalagayan ng sariling thread (at ng iba kung alam).
3. Seksyon 4: magdagdag / magtanggal ng bukas na isyu at desisyon.
4. Seksyon 5: bawat BAGONG utos o desisyon ng user, kasama ang petsa kung pinalitan ang luma. Tanggalin ang lumang napalitan.
5. Palitan ang "Huling update" (oras sa PHT, pangalan ng thread).
6. Isama ang pagbabago sa parehong PR / Beta ng gawain. Kapag docs lang ito, sabihin sa ulat.
