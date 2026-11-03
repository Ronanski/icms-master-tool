# How to publish a Beta (user rules #75 and #76, 2026-11-03)

The user's rules:
- #75: a Beta needs no approval. A Stable release and any manual workflow run still need GO STABLE in the same message.
- #76: whoever makes a fix also builds and publishes the Beta.

Do the steps in order. Do not skip one.

## 1. Bring in main
```
git fetch origin main <your-branch>
git checkout <your-branch> && git merge origin/main
```

## 2. Raise the version
Put the next number in `src/version.txt`, for example `3.2.0-beta.83`. If the number does not change, "Update now" does not see the new build.

Remove the old app file:
```
git rm dist/logic-sim-v<old>.html
```

## 3. Build
```
node tools/build/build.js
node tools/build/build.js --check
```
`--check` must print `SAME`. Run it right after the build, BEFORE you commit.

## 4. Regress tests (plain and Worker)
For each test `t`:
```
node tests/regress/<t>.js
node -r ./tools/test/worker-preload.js tests/regress/<t>.js
```
The tests to run:
- dock_open_run, status_clock, fa_standby_150, cw1001_fp, reset, world, mcc_valve
- plus the test of your own fix (for example temp_hmi)

The Worker preload (`tools/test/worker-preload.js`) forces `ls-worker=1` and waits for `ENG.mode === 'mirror'`. All runs must report 0 FAIL. Never change a test to make it pass.

## 5. Update HANDOFF.md
Section 2, row "Beta sa `main`": add the new version, what it fixes, and the date.

## 6. Commit, push, open a PR to main
- Commit message: `3.2.0-beta.N: <what changed>`.
- PR body: the tests and their numbers, and what was NOT tested.

## 7. Merge when the PR "checks" is green
Use a merge commit. Do not run any workflow by hand.

## 8. Check the deploy
In GitHub Actions, the workflow "Site (Stable + Beta)" must show success for the merge commit on `main`. It starts by itself after "Checks" on main.

Then open `https://ronanski.github.io/icms-master-tool/version.json` in a new tab. It should show the new beta number. This works only from a device that can reach github.io; the cloud cannot.

## 9. Tell the coordinator in one line
The version, the PR number, the test result, and whether the deploy is green.

## What the tester sees
- A banner says "New Beta available".
- After one press of "Update now", a message stays on screen with the MB downloaded (about 12 MB). The app then reloads by itself into the new version.
- Do not press again or reload while it downloads (beta.83 and later).
