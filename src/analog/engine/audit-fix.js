/* 2.3.0-beta.1 DRAWING AUDIT: what the PDF says and the reader missed (docs/versions/v2.3.0/DRAWING_AUDIT.md, DRAWING_TRACE.md).
   Applied in anCompile (compile-step.js) after the links of the sheet are read. Each entry names the block id / net id of the
   reading of the DWG and checks them (k = block kind, was = the name the net has now); a mismatch is skipped with a warning.
   op: in    = a missing input of a gate (wire n enters gate blk)
       lab   = the name written on the wire (tag / address)
       alias = a second name of a wire that already carries an address: the mode status .LOC / .MAN of a controller
       xtag  = the cross-sheet source of an input, by the tag written beside it
       link  = the wire n is the wire src of the same sheet (on-page connector, same tag text)
       and   = the wire n is the AND of the wires src (one text names two mode states: "B & C ALL IN MANUAL")
       split = segments segs of net n are their own wire (move = its name goes with it, to = the gate it enters)
       dsTo  = the "TO DITL" text ref belongs to the wire named t */
const AN_AUDIT_FIX = {
  'ABC-001C': [
    /* ABC-001C-1: OR M.2013 (HIC-BM force manual) has 8 inputs; the 8th is M.2000 = NOT FIC-CM.REM */
    { id: 'ABC-001C-1', op: 'in', blk: 67, k: 'OR', n: 80, was: 'M.2000' },
    /* LINK-3: "TO DITL 40-xx" is written under its own comparator box (DITL-40 rows 6 ~ 9) */
    { id: 'LINK-3', op: 'dsTo', ref: '40-6', t: 'O.0177' },
    { id: 'LINK-3', op: 'dsTo', ref: '40-7', t: 'M.3109' },
    { id: 'LINK-3', op: 'dsTo', ref: '40-8', t: 'M.310A' },
    { id: 'LINK-3', op: 'dsTo', ref: '40-9', t: 'M.310D' }
  ],
  'ABC-001D': [
    /* ABC-001D-1: LN60 input = "MWD CHANGE RATE (FROM ABC-001B) HIC-MWRL.PV" (RATE connector) */
    { id: 'ABC-001D-1', op: 'lab', blk: 16, k: 'FX', n: 59, was: '', t: 'HIC-MWRL.MV' }
  ],
  'ABC-004A': [
    /* ABC-004A-2: "COAL FEEDER B & C ALL IN MANUAL (FROM ABC-004B / C)" -> NOT -> M.013C */
    { id: 'ABC-004A-2', op: 'and', blk: 102, k: 'NOT', n: 176, src: [105, 104] },
    /* ABC-004A-3: "COAL FEEDER C IN MANUAL" -> NOT (1:b of SW B31) */
    { id: 'ABC-004A-3', op: 'link', blk: 111, k: 'NOT', n: 149, src: 104 }
  ],
  'ABC-008': [
    /* ABC-008-2: TPS TR142 input "HYDRAULIC CONTROL SELECT (CRT) M.0200" */
    { id: 'ABC-008-2', op: 'lab', blk: 80, k: 'TPS', n: 53, was: '', t: 'M.0200' },
    /* LINK-3: "TO DITL 40-13" FURNACE PRESS. HIGH = M.3107 (> 30) */
    { id: 'LINK-3', op: 'dsTo', ref: '40-13', t: 'M.3107' }
  ],
  'ABC-009A': [
    /* ABC-009A-1: OR M.0290 (screw cooler B force manual) has the DITL input M.331D too, as M.0280 / M.0300 */
    { id: 'ABC-009A-1', op: 'in', blk: 115, k: 'OR', n: 32, was: 'M.331D' },
    { id: 'ABC-009A-1', op: 'link', n: 32, was: 'M.331D', src: 31 },
    /* ABC-009A-2: AND M.0212 inputs = SICL1060A / B / C / D.MAN (D #107 is reached by its tag text) */
    { id: 'ABC-009A-2', op: 'link', blk: 109, k: 'AND', n: 202, src: 85 },
    { id: 'ABC-009A-2', op: 'link', blk: 109, k: 'AND', n: 175, src: 67 },
    { id: 'ABC-009A-2', op: 'link', blk: 109, k: 'AND', n: 174, src: 49 },
    /* ABC-009A-3: "PIC-BASC.MAN  BOTTOM ASH SCREW COOLER CONTROL IN MANUAL" */
    { id: 'ABC-009A-3', op: 'lab', n: 167, was: '', t: 'PIC-BASC.MAN' }
  ],
  'ABC-009B': [
    /* ABC-009B-1: M.331D (FROM DITL 21D-59) is its own wire into OR M.0320; the AND(B.0646, B.066E) output is another input */
    { id: 'ABC-009B-1', op: 'split', blk: 22, k: 'OR', n: 11, was: 'M.331D', segs: [30], move: 'M.331D', to: 22 }
  ],
  'ABC-011': [
    /* ABC-011-1: "1ST DE-S/H SPRAY WATER TEMP. CONTROL NOT IN REMOTE  TICBR1130.LOC" = the wire M.0230 */
    { id: 'ABC-011-1', op: 'alias', n: 15, was: 'M.0230', t: 'TICBR1130.LOC' }
  ],
  'ABC-012': [
    /* ABC-012-1: "2ND DE-S/H SPRAY WATER TEMP. CONTROL NOT IN REMOTE  TICBR1150.LOC" = the wire M.0240 */
    { id: 'ABC-012-1', op: 'alias', n: 15, was: 'M.0240', t: 'TICBR1150.LOC' }
  ],
  'ABC-013': [
    /* ABC-013-1: the three inputs of the house operation OR (FROM S2 L0400 / L0932 / L0937) */
    { id: 'ABC-013-1', op: 'lab', blk: 22, k: 'OR', n: 19, t: 'M.3200' },
    { id: 'ABC-013-1', op: 'lab', blk: 22, k: 'OR', n: 9, t: 'M.3220' },
    { id: 'ABC-013-1', op: 'lab', blk: 22, k: 'OR', n: 10, t: 'M.3221' }
  ],
  'ABC-020': [
    /* ABC-020-1: on-page connector "I" = HICHR1002B.MV */
    { id: 'ABC-020-1', op: 'link', n: 37, src: 24 }
  ],
  'ABC-054': [
    /* ABC-054-1: PV of PICHR1391 = "HRP / 052  S2 SI0180" */
    { id: 'ABC-054-1', op: 'xtag', n: 21, t: 'S2 SI0180' }
  ],
  'ABC-057': [
    /* ABC-057-1: "FURNACE FRONT / REAR WALL AUTO MODE (CRT) S3 M.144A", "... MANUAL MODE (CRT) S3 M.144B" */
    { id: 'ABC-057-1', op: 'lab', n: 79, was: '', t: 'S3 M.144A' },
    { id: 'ABC-057-1', op: 'lab', n: 74, was: '', t: 'S3 M.144B' }
  ]
};
