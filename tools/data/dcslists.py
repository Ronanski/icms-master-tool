# DCS loop list, user tag list and the Modbus point lists of LMYP-1 #1 -> src/ui/plant/dcslists.js (Library, ALL SIGNALS).
# Sources (user's drive D:\LPDSI Documents\LMYP-1 DCS TCS, found 2026-11-12):
#   LMYP1 LOOP&USERTAG(new)\STN101~105_LOOP,USERTAG.xls  sheets LOOP_AX (loop list) and UserTag_AX (user tags)
#   LMYP-1 #1-DOCUMENT\Subsystem PLC\...\IO List\LMYP-1 #1-MODBUS Communication list between DCS and turbine system.xls
#   LMYP-1 #1-DOCUMENT\Subsystem PLC\...\IO List\LMYP-1 _1,2-MODBUS Communication list between DCS and SCADA.xls
# Usage: python3 tools/data/dcslists.py <folder with the .xls files>
# Only the columns shown in the app are kept: loop tag, name, loop type code, PV / remote SV / MV addresses, PV range and unit;
# user tag name, data name, system tag, data type, scale, unit (rows marked DATA BASE NOT USE are left out); Modbus address,
# tag, description, type, the SI address written on the row (the lists write it on the first row of a block only), from, to.
import xlrd, json, os, sys, glob
D = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def v(c):
    x = c.value
    if isinstance(x, float):
        x = int(x) if x == int(x) else round(x, 6)
    return ' '.join(str(x).split())
def un(s):
    # the unit cell of the temperature rows reads '\u8693' (one or two, an old code page of the degree Celsius sign); every row
    # that has it is a temperature tag (TI / TIC / TIF ... or a 'temp.' description), checked 2026-11-12
    return '°C' if '\u8693' in s else s
def tg(s):
    return s.replace('ns*2;s*#/', '').strip()
loops, utag, mb = [], [], []
for f in sorted(glob.glob(os.path.join(D, 'STN10*_LOOP,USERTAG.xls'))):
    st = os.path.basename(f)[5]
    wb = xlrd.open_workbook(f)
    s = wb.sheet_by_name('LOOP_AX')
    for r in range(9, s.nrows):
        a = [v(c) for c in s.row(r)]
        t = tg(a[1])
        if not t:
            continue
        # 5 type, 13 PV, 14 REM-SV, 15 MV(AO), 33 PV-BS, 34 PV-FS, 35 PV-UNIT
        loops.append([st, t, a[2], a[5], a[13], a[14], a[15], a[33], a[34], un(a[35])])
    s = wb.sheet_by_name('UserTag_AX')
    for r in range(2, s.nrows):
        a = [v(c) for c in s.row(r)]
        if not a[2] or a[5] == 'DATA BASE NOT USE':
            continue
        # 1 DATA NAME, 2 USER TAG NAME, 3 SYS TAG NAME, 5 Data Type, 8 base, 9 full, 12 unit
        utag.append([st, tg(a[2]), a[1], a[3], a[5], a[8], a[9], un(a[12])])
for pat, sysk in (('*turbine system.xls', 'tcs'), ('*SCADA.xls', 'sca')):
    for f in glob.glob(os.path.join(D, pat)):
        wb = xlrd.open_workbook(f)
        for s in wb.sheets():
            out = s.name.upper().startswith('DCS')
            for r in range(3, s.nrows):
                a = [v(c) for c in s.row(r)]
                if not a[0] or not (a[1] or a[2]):
                    continue
                if out:  # DCS to PLC: 6 STN102 from, 7 STN102 to, 9 from, 10 to
                    si, fr, to = ' '.join(x for x in (a[6], a[7]) if x), a[9], a[10]
                else:    # PLC to DCS: 6 / 7 GCS10F area 1 / 2, 8 / 9 STN area 1 / 2, 10 indication, 11 from, 12 to
                    si, fr, to = ' '.join(x for x in (a[8], a[9], a[10]) if x), a[11], a[12]
                mb.append([sysk, a[0], a[1], a[2], a[5], si, fr, to])
js = ('/* DCS loop list, user tag list (STN101~105_LOOP,USERTAG.xls) and Modbus point lists (turbine system, SCADA) of LMYP-1 #1,\n'
      '   made by tools/data/dcslists.py. Read only; shown in the Library ALL SIGNALS tab. */\n'
      'window.DCS_LOOPS_F=["stn","tag","name","type","pv","rsv","mv","lo","hi","unit"];\n'
      'window.DCS_LOOPS=' + json.dumps(loops, ensure_ascii=False, separators=(',', ':')) + ';\n'
      'window.DCS_UTAG_F=["stn","utag","dname","sys","type","lo","hi","unit"];\n'
      'window.DCS_UTAG=' + json.dumps(utag, ensure_ascii=False, separators=(',', ':')) + ';\n'
      'window.DCS_MODBUS_F=["sys","maddr","tag","d","type","si","from","to"];\n'
      'window.DCS_MODBUS=' + json.dumps(mb, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(ROOT, 'src', 'ui', 'plant', 'dcslists.js'), 'w').write(js)
print('loops', len(loops), 'user tags', len(utag), 'modbus', len(mb), 'bytes', len(js))
