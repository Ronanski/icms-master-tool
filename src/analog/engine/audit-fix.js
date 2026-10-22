/* 2.3.0-beta.1 DRAWING AUDIT: what the PDF says and the reader missed (docs/versions/v2.5.0/DRAWING_AUDIT.md, DRAWING_TRACE.md).
   Applied in anCompile (compile-step.js) after the links of the sheet are read. Each entry names the block id / net id of the
   reading of the DWG and checks them (k = block kind, was = the name the net has now); a mismatch is skipped with a warning.
   op: in    = a missing input of a gate (wire n enters gate blk)
       lab   = the name written on the wire (tag / address)
       alias = a second name of a wire that already carries an address: the mode status .LOC / .MAN of a controller
       xtag  = the cross-sheet source of an input, by the tag written beside it
       link  = the wire n is the wire src of the same sheet (on-page connector, same tag text)
       and   = the wire n is the AND of the wires src (one text names two mode states: "B & C ALL IN MANUAL")
       split = segments segs of net n are their own wire (move = its name goes with it, to = the gate it enters)
       dsTo  = the "TO DITL" text ref belongs to the wire named t
   2.3.0-beta.2 (behaviour, group B):
       setCos = "IF M.0x5C = 1 SET SV = 49 T/H" also writes the operator SV (COS of the SV switch blk) and holds it
       q4sig  = the conditions of a 4-leg switch are signals (SV switch blk of sheet sh on leg), not user settings
       span   = the range sp of a "% / sec" ramp, from the drawing
   2.3.0-beta.3 (data, group C):
       range  = the range of a controller written on the drawing (applied in anDefaults after the parameter workbook) */
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
    { id: 'LINK-3', op: 'dsTo', ref: '40-13', t: 'M.3107' },
    /* ABC-008-1 (beta.3): "B.0664 FURNACE PRESSURE (A) SIG.AB" into AND B74 is B.0644 (typo; the left half of the sheet: B.0644 = SIG.AB of
       AI0132 FURNACE PRESSURE (A); B.0664 is the FA blower-B inlet damper position flag of ABC-014). UNLINK_AUDIT beta.3 */
    { id: 'ABC-008-1', op: 'lab', blk: 74, k: 'AND', n: 85, was: 'B.0664', t: 'B.0644' },
    { id: 'ABC-008-1', op: 'link', n: 85, src: 96 }
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
  ],
  'ABC-002': [
    /* ABC-002-1: "0.2 %/sec" on the air demand: 0.2 % of the total air range 0 ~ 1115 T/H (the same line is compared with
       "32 % MIN. AIR FLOW" = 356.8 T/H) = 2.23 T/H per s */
    { id: 'ABC-002-1', op: 'span', blk: 76, k: 'RATE', sp: 1115, why: 'total air flow 0 ~ 1115 T/H (32 % MIN. AIR FLOW = 356.8 T/H)' },
    /* ABC-002-2: "0.2 %/sec" on the PA flow demand: PA range 0 ~ 648 T/H (SI0031 scaled 648 / 1115) = 1.296 T/H per s */
    { id: 'ABC-002-2', op: 'span', blk: 75, k: 'RATE', sp: 648, why: 'primary air flow 0 ~ 648 T/H (648 / 1115 of the total air)' }
  ],
  'ABC-003A': [{ id: 'ABC-003A-1', op: 'setCos', blk: 12, k: 'AMT' }],
  'ABC-003B': [{ id: 'ABC-003B-1', op: 'setCos', blk: 6, k: 'AMT' }],
  'ABC-003C': [{ id: 'ABC-003C-1', op: 'setCos', blk: 6, k: 'AMT' }],
  'ABC-003D': [{ id: 'ABC-003D-1', op: 'setCos', blk: 6, k: 'AMT' }],
  'ABC-003E': [
    /* ABC-003E-1: "(1) IF BNR-A OIL FLOW CONTROL REMOTE (M.009A) SELECT TO a" ... (4) M.009D: REMOTE of FICDO1043A ~ D = its SV
       switch on the A leg (SV from the oil master, ABC-003E) */
    {
      id: 'ABC-003E-1',
      op: 'q4sig',
      blk: 4,
      k: 'SW',
      sig: [
        { tag: 'M.009A', sh: 'ABC-003A', blk: 48, leg: 'A' },
        { tag: 'M.009B', sh: 'ABC-003B', blk: 35, leg: 'A' },
        { tag: 'M.009C', sh: 'ABC-003C', blk: 35, leg: 'A' },
        { tag: 'M.009D', sh: 'ABC-003D', blk: 35, leg: 'A' }
      ]
    }
  ],
  'ABC-051': [
    /* ABC-051-1: BUMPLESS "RAMP: 1.67 % / min" of the temperature set point (LN10 output 0 ~ 600 C, TICMS1022 0 ~ 600 C) = 10 C/min */
    { id: 'ABC-051-1', op: 'span', blk: 24, k: 'RAMPB', sp: 600, why: 'temperature set point 0 ~ 600 C (LN10 output, TICMS1022)' }
  ],
  'ABC-004B': [
    /* ABC-004B-2: the "<1 %" comparator output is M.0154, the TONS 2 s (TR71) output is M.0156 */
    { id: 'ABC-004B-2', op: 'lab', blk: 12, k: 'CMPK', n: 45, was: 'M.0156', t: 'M.0154' },
    { id: 'ABC-004B-2', op: 'lab', blk: 41, k: 'TON', n: 11, was: '', t: 'M.0156' }
  ],
  'ABC-004C': [
    /* ABC-004C-2: the "<1 %" comparator output is M.0164, the TONS 2 s (TR72) output is M.0166 */
    { id: 'ABC-004C-2', op: 'lab', blk: 20, k: 'CMPK', n: 18, was: 'M.0166', t: 'M.0164' },
    { id: 'ABC-004C-2', op: 'lab', blk: 43, k: 'TON', n: 6, was: '', t: 'M.0166' }
  ],
  'ABC-010': [
    /* ABC-010-1: PID LICBR1001A "DRUM LEVEL 1 ELEMENT CONTROL -422 ~ 820 mm" (the workbook SL -24 / SH 74 contradicts its own PH 127 / PL -178) */
    { id: 'ABC-010-1', op: 'range', blk: 20, k: 'PID', rlo: -422, rhi: 820, why: 'range -422 ~ 820 mm from the drawing (workbook -24 ~ 74 mm)' }
  ]
};
