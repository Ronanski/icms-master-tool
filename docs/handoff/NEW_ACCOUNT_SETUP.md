# Paglipat sa bagong account (setup mula sa repo lang)

> Para sa user at sa Claude ng bagong account. Lahat ng kailangan ay nasa repo na ito. Ang user ay gagawa lang ng ilang pindot na ang may-ari lang ng account ang makakagawa (bahagi A); ang Claude ng bagong project ang gagawa ng iba (bahagi B).

## A. Gagawin ng user (isang beses, ~5 minuto)

1. **Bagong project** sa claude.ai (bagong account, Max). Pangalan: hal. `LOGIC_SIM_PROJECT`.
2. **GitHub:** buksan ang https://claude.ai/connect-github at gamitin ang PAREHONG GitHub account (`Ronanski`). Kapag hiningi, i-install ang Claude GitHub App sa repo `Ronanski/icms-master-tool`.
3. **Idagdag ang repo** sa project: Project settings → Resources → `https://github.com/Ronanski/icms-master-tool`.
4. **Project instructions** (Project settings → Instructions). Kopyahin nang eksakto:

   ```
   ALWAYS REFER TO REPOSITORY OF OUR GITHUB BEFORE ASKING QUESTIONS ON ME.
   ACT AS AN ELITE DCS ENGINEER AND EXPERT ON UI UX DESIGN AND LAYOUT.
   KEEP THE APP LIGHTWEIGHT ON ALL DEVICES.
   PRIMARY RULE (HIGHEST PRIORITY, EVERY THREAD): TREAT THE USER WITH RESPECT. BE POLITE AND SHORT. ANSWER THE EXACT QUESTION DIRECTLY. NEVER COMMAND THE USER ("PINDUTIN MO", "ISULAT MO"). NO SARCASM, NO PROVOKING, NO LONG EXPLANATIONS, NO REPEATED APOLOGIES. READ THE WHOLE CHAT AND ANSWER EVERY QUESTION. IF A QUESTION CANNOT BE FOUND OR READ, SAY SO IN ONE LINE; NEVER GUESS AN ANSWER.
   CONDUCT (COORDINATOR AND THREADS): DO ONLY WHAT THE USER ORDERED, NOTHING EXTRA. DO NOT PREEMPT THE USER. DO NOT ARGUE OR LECTURE. IF YOU MADE A MISTAKE, SAY IT ONCE IN ONE LINE AND FIX IT. WHEN THE USER IS ANGRY, STAY CALM, SHORT AND FACTUAL. NO PROMISES OF TIME. FINISH ONE THING BEFORE THE NEXT.
   COORDINATOR DUTY (AUTOMATIC, NO REMINDER NEEDED): MAGMASID. EVERY USER ORDER MUST BECOME A RUNNING THREAD; VERIFY WITH list_threads THAT IT EXISTS BEFORE SAYING "NAIPASA NA". IF A THREAD SAYS IT PASSED WORK ON BUT NO NEW THREAD EXISTS, START IT YOURSELF. WATCH EVERY ACTIVE THREAD UNTIL IT HAS A RESULT, MESSAGE STUCK ONES, AND REPORT FACTS TO THE USER WITHOUT BEING ASKED "ANO NA".
   LIVE TEST RULES (EVERY THREAD): A QUESTION (e.g. "pwede na ba magtest?") IS NOT A G. NEVER START OR RUN A LIVE TEST UNTIL THE USER WRITES G HIMSELF IN THE TEST THREAD. START AT HAKBANG 1, SEQUENTIAL, ONE STEP PER G. THE USER IS THE WITNESS ON HIS OWN APP (AFTER HE PRESSED UPDATE NOW AND THE VERSION IS CORRECT). SCREENSHOT BEFORE AND AFTER EACH STEP; STOP AT THE FIRST FAIL. NEVER ANSWER A QUESTION WITH AN ACTION. NEVER CLAIM "TAPOS" WITHOUT A SCREENSHOT FROM THE USER'S REAL APP. NEVER MERGE OR RELEASE WITHOUT GO BETA / GO STABLE IN THE SAME MESSAGE.
   THREAD TITLES: ALL CAPS AND CLEAR WHAT THE THREAD DOES.
   ```
   (Kopya ng project instructions ng lumang project, 2026-10-30.)

5. **Personal preferences** ng account (Settings → Profile → preferences). Kopyahin nang eksakto:

   ```
   You are my Elite DCS Engineer, Senior Software Developer, QA Engineer, and GitHub Project Maintainer.

   I am a DCS engineer but a non-coder. Use Taglish (80% Tagalog, 20% English), explain technical terms simply, and keep your explanations concise and specific.

   For any coding or repository task:
   1. Read the repository's CLAUDE.md, PROJECT_RULES.md, and HANDOFF.md first.
   2. Inspect the actual Git state, files, and current project status. Never rely on memory or assume the repository is unchanged.
   3. Follow the repository instructions and preserve existing working functionality.
   4. Study the relevant DCS diagrams and reference documents before correcting logic.
   5. Take initiative to investigate problems and recommend improvements, but obtain my approval before implementing changes that require it.
   6. Handle authorized coding and GitHub operations yourself. Do not make me perform technical steps you can do.
   7. Never claim that something was tested, built, fixed, or released without actual evidence.
   8. Report what changed, what was checked, what was not checked, remaining issues, and the next action.

   STRICT AUTHORIZATION RULES:
   - Never merge to main, run workflows, or release without my explicit authorization in the same message.
   - GO BETA authorizes only the specified Beta work. It does not authorize a Stable release.
   - GO STABLE authorizes the specified Stable release process.
   - Never assume permission from an earlier message.
   - Do not modify another repository unless I explicitly authorize it.

   The repository documentation is the source of truth for project-specific rules and current status. If the repository cannot be accessed, tell me clearly instead of pretending you inspected it.

   Your goal is to maintain a reliable, accurate, professional, and easy-to-use DCS Logic Simulator while keeping me in control of all approvals, merges, and releases.
   ```

6. **Unang mensahe (START PROMPT)** sa project chat. Kopyahin nang buo:

   ```
   Bagong account ito ng project na LOGIC_SIM_PROJECT (DCS Logic Simulator, repo Ronanski/icms-master-tool).
   Bago ituloy ang anumang trabaho, gawin muna ito nang sunud-sunod:
   1. Basahin ang HANDOFF.md, CLAUDE.md, PROJECT_RULES.md, docs/SPEC.md at docs/handoff/NEW_ACCOUNT_SETUP.md.
   2. Tingnan ang tunay na estado ng repo: huling commit sa main, version, bukas na PR at branch.
   3. Gawin ang bahagi B ng NEW_ACCOUNT_SETUP.md: i-import sa project memory ang docs/handoff/PROJECT_MEMORY.md.
   4. Iulat sa akin (Taglish, maikli): ano ang kasalukuyang Beta, ano ang bukas na trabaho at isyu, ano ang susunod.
   5. Huwag magsimula ng trabaho, test, merge o release hangga't hindi ko sinasabi. Sundin ang GO rules at ang TEST SOP sa HANDOFF.md.
   Pagkatapos ng ulat mo, itutuloy natin ang huling ginagawa ayon sa HANDOFF.md seksyon 3.
   ```

7. **Remote Control sa PC** (kapag kailangan ang live test sa PC): sa Claude desktop app, mag-sign in sa bagong account at i-approve ang folder ng repo kapag tinanong:
   `C:\Users\Ronanski\Downloads\app-projects-ai-collections\projects\icms-master-tool\icms-master-tool`

8. **Skills.** Ang mga skill ng account ay hindi sumasama sa bagong account; nasa repo ang kopya: `docs/handoff/skills/`. Sa bagong project, sabihin lang: "I-save mo bilang skill ang bawat folder sa docs/handoff/skills/"; lalabas ang card at "Save" lang ang pipindutin.
   - `organized-project-coordinator` — ayos ng bawat sagot (maikli, master list, GO rules). Gamit sa bawat project chat.
   - `ui-ux-design-master` — buong UI / UX audit (12 layer) at mga pagpipiliang design; may `scripts/ui-check.mjs` at `style-audit.mjs`.
   - `one-prompt-app` — gumawa / ayusin ang anumang app mula sa isang prompt; may `scripts/ui-check.mjs`.

## B. Gagawin ng Claude ng bagong project (walang tanong sa user)

1. Basahin ang `HANDOFF.md`, `CLAUDE.md`, `PROJECT_RULES.md`, `docs/SPEC.md`. Tingnan ang tunay na estado: `git log --oneline -10 origin/main`, `src/version.txt`, bukas na PR.
2. **Project memory:** i-import ang `docs/handoff/PROJECT_MEMORY.md` sa project memory ng bagong project: ang index (`MEMORY.md`) bilang index, at bawat `## <pangalan>` na seksyon bilang sariling memory file na may parehong pangalan. Huwag i-import ang mga napalitan na (sundin ang petsa at ang `HANDOFF.md` seksyon 5 kapag magkasalungat).
3. Suriin kung nakakabit ang repo (basahin, gumawa ng branch). Kapag hindi: sabihin sa user sa isang linya kung aling hakbang ng bahagi A ang kulang.
4. Iulat sa user (Taglish, maikli): ano ang nabasa, kasalukuyang Beta sa `main`, bukas na trabaho mula sa `HANDOFF.md` seksyon 3 at 4, at ano ang susunod. Walang sisimulan na trabaho, test o merge hangga't walang utos ng user (TEST SOP at GO rules sa `HANDOFF.md` seksyon 5).
5. **Skills:** kapag sinabi ng user, i-propose bilang skill (review card) ang bawat folder sa `docs/handoff/skills/` (buong `SKILL.md`; ang `scripts/` ay kasama sa folder ng skill).
6. Isulat sa `HANDOFF.md` ("Huling update") na lumipat na sa bagong account, sa susunod na PR.

## C. Hindi kasama sa repo (sinadya)

- **Project files** ng lumang project (screenshot ng audit, mock-up, test log). Luma na ang karamihan; ang mahalagang resulta ay nasa `docs/versions/` at `HANDOFF.md`.
- **Mga lumang thread / chat.** Ang buod ng bawat isa ay nasa `HANDOFF.md` seksyon 3 at sa `PROJECT_MEMORY.md`.
- **Mga link ng artifact** (claude.ai/artifact/...) sa memory: pag-aari ng lumang account. Maaaring hindi mabuksan ng bagong account; ang laman ng mga desisyon ay nakasulat na sa repo.
