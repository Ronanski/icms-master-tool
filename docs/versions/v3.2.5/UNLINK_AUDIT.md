# UNLINK AUDIT — v3.2.5 (CLAUDE.md rule 9)

## beta.2: a sink connector on a driven wire and a bare stub (compile-step.js, numbered connectors)
No link was removed for the logic to work: a link that carried a wire with NO driver (always 0) over the real signal is replaced by
the driven wire of the same connector circle, and the bare stub is joined to that wire (same circle = same wire).
- ABC-004A connector 21 (tags "SI0311"): sink circle at (132.5, 83.0) touches SI0311 (SW of the start feed: CONST 4 / CONST 8 by
  M.025B) and stub #20 (no driver, no consumer). Source circle at (310.2, 225.1) = #18, leg 2 of SW id19 (SI0117 by M.0146, the 5 s
  start pulse) -> RATE SI0112 -> AMT FICCL1061A.MV. Before: #18 = 0. After: #18 = SI0311 = 4. ABC-004B / C read this connector
  with one wire and already gave 4 T/H.
- ABC-003A connector 11: sink #31 (TPS 2 s of #32 = AND of M.3400 / 3401 / 3402 running and the four fan conditions) and stub #60;
  source #25 -> OR M.0123 -> AMT -> AO -> MCV-FA1043-A. Before: #25 = 0. After: #25 = the pulse.
- ABC-027 connector A: sink #43 (LLIM) and stub #94, source #96 -> DIV SI0121. Value unchanged (the driven wire was already last).
- ABC-050 connector 6: source and sink on M.070D itself, nothing changes.
