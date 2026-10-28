/* 2.0.0 (user tip): PLANT AT 150 MW. The measurements of the control-room HMI snapshots (docs/hmi/operating-points.json, the
   full-load screens of 2023-10-18 / 2023-12-01; the 60 MW screen, the MFT screen and the drafts are left out), by station and
   address (STN101 AI0129 = '1|AI0129'). AN.plantLoad150() writes them into the transmitters (AI blocks) of every sheet, so the
   simulation starts like the plant in service instead of a cold boiler. Generated from the json; one value per address. */
const AN_HMI_AI = {
  /* 2.2.0-beta.3: the LP heaters and the deaerator are only on 02.png (about 60 MW). Their levels are CONTROLLED (the same
     set point at any load), so the level of 02.png is the operating point; before, the levels started at the bottom / top of
     the range (LPH -320 / -287 / -310 mm: LPH LEVEL LOW; deaerator 1095 mm: LEVEL HIGH) */
  '2|AI0672': [71.0, 'LICD11041 (02.png)'],
  '2|AI0848': [60.0, 'LICD11042 (02.png)'],
  '2|AI0928': [65.0, 'LICD11043 (02.png)'],
  '2|AI0673': [-3.0, 'LIHD11011 (02.png)'],
  '2|AI0849': [-3.0, 'LIHD11012 (02.png)'],
  '2|AI0674': [-5.0, 'LIHD11021 (02.png)'],
  '2|AI0850': [-1.0, 'LIHD11022 (02.png)'],
  '2|AI0675': [-11.0, 'LIHD11031 (02.png)'],
  '2|AI0851': [-1.0, 'LIHD11032 (02.png)'],
  '1|AI0128': [134.2, 'PIBR10011'],
  '1|AI0129': [474.1, 'FIQMS1031'],
  '1|AI0420': [149.5, 'TCS-AI1001 TARGET MW SETPOINT FROM TCS (33.PNG)'],
  '1|AI0130': [0.0, 'LIBR10011'],
  '1|AI0131': [122.6, 'PIMS1002'],
  '1|AI0132': [-16.0, 'PIFG1085'],
  '1|AI0134': [1426.0, 'DPIFG1081'],
  '1|AI0144': [4.56, 'LICL1008A'],
  '1|AI0145': [127.8, 'PIBR1130'],
  '1|AI0146': [-82.0, 'PIFG1009A1'],
  '1|AI0147': [-84.0, 'PIFG1009B1'],
  '1|AI0151': [0.0, 'SIM1311'],
  '1|AI0160': [1551.0, 'PIFA1075'],
  '1|AI0161': [1444.0, 'PIFA1078'],
  '1|AI0162': [-233.0, 'PIFG1121'],
  '1|AI0163': [-372.0, 'PIFG1134'],
  '1|AI0164': [22.9, 'FIFA1043A'],
  '1|AI0165': [37.5, 'FIQFW1109'],
  '1|AI0166': [328.2, 'FIFA1079'],
  '1|AI0256': [498.9, 'FIQFW10071'],
  '1|AI0257': [28.2, 'FIQFW1119'],
  '1|AI0258': [2.0, 'LIBR10012'],
  '1|AI0259': [137.7, 'PIFW1160'],
  '1|AI0260': [-17.0, 'PIFG1086'],
  '1|AI0262': [1432.0, 'DPIFG1082'],
  '1|AI0272': [3.65, 'LICL1008B'],
  '1|AI0273': [6.4, 'AIFG1122'],
  '1|AI0275': [124.9, 'PIBR1150'],
  '1|AI0288': [1427.0, 'PIFA1085'],
  '1|AI0289': [1273.0, 'PIFA1088'],
  '1|AI0290': [22.5, 'FIFA1043B'],
  '1|AI0293': [0.0, 'PIDO1043A2'],
  '1|AI0294': [3257.0, 'PIFA1055A'],
  '1|AI0384': [499.2, 'FIQFW10072'],
  '1|AI0385': [134.1, 'PIBR10012'],
  '1|AI0386': [8.0, 'LIBR10013'],
  '1|AI0388': [-15.0, 'PIFG10871'],
  '1|AI0389': [70.0, 'DPIFG1083'],
  '1|AI0390': [1016.0, 'DPIFG1084'],
  '1|AI0400': [3.89, 'LICL1008C'],
  '1|AI0401': [533.0, 'PIFG1009A2'],
  '1|AI0402': [308.0, 'PIFG1009B2'],
  '1|AI0403': [21.8, 'FIFA1043C'],
  '1|AI0416': [-442.0, 'PIFG1141A'],
  '1|AI0417': [3315.0, 'PIFA1055B'],
  '1|AI0419': [151.1, 'GCPAI1001 GEN. MW(C)'],
  '1|AI0432': [-7.0, 'PIFG1151'],
  '1|AI0433': [2.2, 'AIFG1123'],
  '1|AI0439': [0.0, 'PIDO1043B2'],
  '1|AI0448': [41.0, 'DPIFG1183'],
  '1|AI0449': [1014.0, 'DPIFG1184'],
  '1|AI0455': [19.2, 'AIFG1131'],
  '1|AI0466': [41.0, 'AICFG10571'] /* 2.2.0-beta.7: stack outlet SOx AT-FG1057-1 (I/O list STN101 AI0466, 0 ~ 500 ppm) = PV of the SOx CONTROL (19.PNG PV 41 ppm, limestone feeding STOP); before, the model went to 307.5 ppm */,
  '1|AI0480': [29.0, 'MIFCL1061A'] /* 2.1.0-beta.11: coal feeder-A feedrate MIF-CL1061-A (11.png MICL1061A PV 29.0 T/H) */,
  '1|AI0484': [354.0, 'FIFA1071'],
  '1|AI0512': [29.1, 'MIFCL1061B'] /* 2.1.0-beta.11: coal feeder-B feedrate (11.png 29.1 T/H) */,
  '1|AI0544': [28.9, 'MIFCL1061C'] /* 2.1.0-beta.11: coal feeder-C feedrate (11.png 28.9 T/H) */,
  '1|AI0513': [213.0, 'FIFA1081'],
  '1|AI0514': [11.0, 'PIDO1008'],
  '1|AI0515': [0.0, 'FIQDO1043A'],
  '1|AI0517': [0.0, 'FIQDO1043C'],
  '1|AI0545': [26.3, 'FIFA1055'],
  '1|AI0546': [0.0, 'FIQDO1043B'],
  '1|AI0548': [0.0, 'FIQDO1043D'],
  '1|AI0576': [61.0, 'TIFA1073'],
  '1|AI0577': [55.0, 'TIFA1083'],
  '1|AI0578': [146.0, 'TIFG1132'],
  '1|AI0579': [81.0, 'TIFA1055A'],
  '1|AI0580': [30.0, 'TIFA1072'],
  '1|AI0592': [244.0, 'TIFW1160'],
  '1|AI0593': [148.0, 'TIFG1152'],
  '1|AI0594': [870.0, 'TIFG1009A'],
  '1|AI0596': [0.0, 'PIDO1043C2'],
  '1|AI0597': [26.8, 'FIFA1043D'],
  '1|AI0608': [458.0, 'TIBR11201'],
  '1|AI0609': [393.0, 'TIBR11301'],
  '1|AI0610': [461.0, 'TIBR11401'],
  '1|AI0611': [421.0, 'TIBR11501'],
  '1|AI0612': [542.0, 'TIMS10041'],
  '1|AI0613': [263.0, 'TIBR1020'],
  '1|AI0614': [275.0, 'TIBR1030'],
  '1|AI0624': [62.0, 'TIFA1074'],
  '1|AI0625': [55.0, 'TIFA1084'],
  '1|AI0626': [134.0, 'TIFG1133'],
  '1|AI0627': [76.0, 'TIFA1055B'],
  '1|AI0628': [31.0, 'TIFA1082'],
  '1|AI0640': [454.0, 'TIBR11202'],
  '1|AI0641': [395.0, 'TIBR11302'],
  '1|AI0642': [463.0, 'TIBR11402'],
  '1|AI0643': [419.0, 'TIBR11502'],
  '1|AI0644': [543.0, 'TIMS10042'],
  '1|AI0645': [305.0, 'TIBR1040'],
  '1|AI0646': [371.0, 'TIBR1110'],
  '1|AI0656': [282.0, 'TIFA1076'],
  '1|AI0657': [288.0, 'TIFA1086'],
  '1|AI0658': [313.0, 'TIFG1124'],
  '1|AI0660': [882.0, 'TIFG1095A'],
  '1|AI0661': [873.0, 'TIFG1095B'],
  '1|AI0662': [870.0, 'TIFG1009B'],
  '1|AI0672': [281.0, 'TIFA1077'],
  '1|AI0673': [289.0, 'TIFA1087'],
  '1|AI0674': [317.0, 'TIFG1125'],
  '1|AI0676': [855.0, 'TIFG1096A'],
  '1|AI0677': [846.0, 'TIFG1096B'],
  '1|AI0768': [113.0, 'DPIFG10525'],
  '1|AI0771': [0.0, 'PIDO1043D2'],
  '1|AI0772': [-450.0, 'PIFG1141B'],
  '1|AI0773': [-14.0, 'PIFG10872'],
  '1|AI0774': [151.9, 'GCPAI1002 GEN. MW(D)'],
  '2|AI0416': [122.0, 'PIMS10061'],
  '2|AI0418': [165.4, 'PIFW1011'],
  '2|AI0420': [6.7, 'PIFW1115A'],
  /* 2.1.0-beta.10: HP turbine first stage pressure (PT-ST1001-1/2/3) is not on any screen. ABC-052: the REMOTE SV of the LP bypass
     PICHR1003 = 5.1 + LN12(average of AI0883 ~ AI0885); the snapshot SV is 36.0 (5.png), so LN12 = 30.9 -> 96.8 kg/cm2 */
  '2|AI0883': [96.8, 'PIST10011'],
  '2|AI0884': [96.8, 'PIST10012'],
  '2|AI0885': [96.8, 'PIST10013'],
  '2|AI0421': [34.3, 'PIHR10031'],
  '2|AI0436': [0.0, 'FIQCD1121'],
  '2|AI0437': [380.0, 'FIQCD1120'],
  '2|AI0448': [1.0, 'PISW1110A1'],
  '2|AI0449': [0.4, 'PISW1110A2'],
  '2|AI0450': [0.019, 'DPICD1001'],
  '2|AI0451': [0.29, 'DPIFW1115A'],
  '2|AI0512': [122.0, 'PIMS10062'],
  '2|AI0513': [34.4, 'PIHR10032'],
  '2|AI0514': [10.2, 'PIAS1004'],
  '2|AI0515': [10.2, 'PIAS1005'],
  '2|AI0528': [35.3, 'PICR1003'],
  '2|AI0529': [34.9, 'PICR1006'],
  '2|AI0530': [35.0, 'PIHR1001'],
  '2|AI0531': [0.0, 'PIHR1011'],
  '2|AI0532': [0.056, 'PICD1110'],
  '2|AI0533': [0.4, 'PISB1052'],
  '2|AI0544': [0.0, 'FIQCD1115'],
  '2|AI0546': [1.8, 'FIQFW1059'],
  '2|AI0547': [14.8, 'FIQFW1149'],
  '2|AI0549': [0.0, 'PISB1040'],
  '2|AI0550': [0.0, 'PISB1042'],
  '2|AI0560': [14.07, 'PITS1013'],
  '2|AI0561': [5.3, 'PITS1017'],
  '2|AI0562': [1.29, 'PITS1022'],
  '2|AI0563': [0.25, 'PITS1026'],
  '2|AI0564': [16.9, 'PICD1117'],
  '2|AI0565': [7.1, 'PIFW1115B'],
  '2|AI0566': [35.0, 'PIMS1021'],
  '2|AI0640': [3.0, 'LICD1110'],
  '2|AI0641': [103.0, 'TIAS1001'],
  '2|AI0642': [236.0, 'TIAS1003'],
  '2|AI0643': [257.0, 'TIAS1015'],
  '2|AI0676': [-6.0, 'LIHD11051'],
  '2|AI0677': [-4.0, 'LIHD11061'],
  '2|AI0678': [40.0, 'TICD11101'],
  '2|AI0773': [5.0, 'MVMU1001 POSITION DEMAND HIGH LIMIT'],
  '2|AI0800': [1.0, 'PISW1110B1'],
  '2|AI0801': [0.5, 'PISW1110B2'],
  '2|AI0802': [0.0, 'DPICD1002'],
  '2|AI0803': [0.0, 'DPIFW1115B'],
  '2|AI0805': [28.5, 'TISW1110A1'],
  '2|AI0806': [35.3, 'TISW1110A2'],
  '2|AI0816': [371.0, 'TITS1011'],
  '2|AI0817': [426.0, 'TITS1014'],
  '2|AI0818': [314.0, 'TITS1018'],
  '2|AI0819': [188.0, 'TITS1023'],
  '2|AI0820': [91.0, 'TITS1027'],
  '2|AI0832': [42.0, 'TICD1120'],
  '2|AI0837': [40.0, 'TICD1118'],
  '2|AI0838': [41.0, 'TICD1119'],
  '2|AI0852': [0.0, 'LIHD11052'],
  '2|AI0853': [3.0, 'LIHD11062'],
  '2|AI0854': [40.0, 'TICD11102'],
  '2|AI0864': [137.0, 'TIHR10121'],
  '2|AI0865': [359.0, 'TIMS10221'],
  '2|AI0866': [331.0, 'TICR10051'],
  '2|AI0867': [540.0, 'TIHR10021'],
  '2|AI0868': [540.0, 'TIHR1004'],
  '2|AI0869': [40.0, 'TICD11103'],
  '2|AI0870': [228.0, 'TIHR1010'],
  '2|AI0896': [135.0, 'TIHR10122'],
  '2|AI0897': [356.0, 'TIMS10222'],
  '2|AI0898': [327.0, 'TICR10052'],
  '2|AI0899': [540.0, 'TIHR10022'],
  '2|AI0900': [370.0, 'TICR1004'],
  '2|AI0902': [185.0, 'TIAS1017'],
  '2|AI0912': [162.0, 'TIFW1011'],
  '2|AI0913': [198.0, 'TIFW1105'],
  '2|AI0914': [243.0, 'TIFW1106'],
  '2|AI0915': [42.0, 'TICD11104'],
  '2|AI0916': [107.0, 'TISB1056'],
  '2|AI0917': [105.0, 'TISB1057'],
  '2|AI0918': [538.0, 'TIMS1007'],
  '2|AI0933': [28.6, 'TISW1110B1'],
  '2|AI0934': [35.1, 'TISW1110B2'],
  '3|AI0384': [5.3, 'PICW1156'],
  '3|AI0385': [37.0, 'TICW1156'],
  '3|AI0386': [15.8, 'LIBH1750'],
  '3|AI0387': [50.1, 'LISD1800'],
  '3|AI0389': [0.8, 'LICW1109'],
  '3|AI0390': [-8.76, 'LISW1501'],
  '3|AI0402': [287.0, 'TIFA1052'],
  '3|AI0403': [40.0, 'TICW1152'],
  '3|AI0404': [38.0, 'TICW1153'],
  '3|AI0405': [5.2, 'PICW1153'],
  '3|AI0406': [6.4, 'PICW1152'],
  '3|AI0432': [0.0, 'PISD1800'],
  '3|AI0518': [0.27, 'DPICW1108A'],
  '3|AI0534': [0.0, 'DPICW1108B'],
  '3|AI0768': [55.0, 'TIBH1060A1'],
  '3|AI0769': [36.0, 'TICW1060A1'],
  '3|AI0770': [38.0, 'TICW1060A2'],
  '3|AI0771': [31.0, 'TIBH1060A2'],
  '3|AI0772': [0.0, 'IIL1060A'],
  '3|AI0784': [34.0, 'TIBH1060B1'],
  '3|AI0785': [38.0, 'TICW1060B1'],
  '3|AI0786': [38.0, 'TICW1060B2'],
  '3|AI0787': [32.0, 'TIBH1060B2'],
  '3|AI0788': [0.0, 'IIL1060B'],
  '3|AI0800': [54.0, 'TIBH1060C1'],
  '3|AI0801': [38.0, 'TICW1060C1'],
  '3|AI0802': [38.0, 'TICW1060C2'],
  '3|AI0803': [32.0, 'TIBH1060C2'],
  '3|AI0804': [0.0, 'IIL1060C'],
  '3|AI0816': [957.0, 'TIFG1091A'],
  '3|AI0817': [956.0, 'TIFG1091B'],
  '3|AI0818': [956.0, 'TIFG1091C'],
  '3|AI0819': [951.0, 'TIFG1091D'],
  '3|AI0820': [920.0, 'TIFG1091E'],
  '3|AI0821': [943.0, 'TIFG1091F'],
  '3|AI0832': [927.0, 'TIFG1090A'],
  '3|AI0833': [944.0, 'TIFG1090B'],
  '3|AI0834': [960.0, 'TIFG1090C'],
  '3|AI0835': [941.0, 'TIFG1090D'],
  '3|AI0836': [934.0, 'TIFG1090E'],
  '3|AI0837': [930.0, 'TIFG1090F'],
  '3|AI0848': [940.0, 'TIFG1091G'],
  '3|AI0849': [926.0, 'TIFG1091H'],
  '3|AI0850': [926.0, 'TIFG1091I'],
  '3|AI0864': [938.0, 'TIFG1090G'],
  '3|AI0865': [919.0, 'TIFG1090H'],
  '3|AI0866': [910.0, 'TIFG1090I'],
  '3|AI0896': [37.0, 'TIBH1060D1'],
  '3|AI0898': [38.0, 'TICW1060D2'],
  '3|AI0899': [32.0, 'TIBH1060D2'],
  '3|AI0900': [0.0, 'IIL1060D'],
  '3|AI0901': [14.7, 'FIMU1001'],
  '3|AI0902': [38.0, 'TICW1060D1'],
  '4|AI0320': [8.8, 'AISP1001'],
  '4|AI0321': [0.46, 'AISP1002'],
  '4|AI0322': [7.9, 'AISP1003'],
  '4|AI0323': [115.8, 'AISP1004'],
  '4|AI0324': [0.07, 'AISP1005'],
  '4|AI0325': [4.0, 'AISP1006'],
  '4|AI0326': [0.9, 'AISP1007'],
  '4|AI0336': [0.2, 'AISP1008'],
  '4|AI0337': [9.1, 'AISP1009'],
  '4|AI0338': [103.2, 'AISP1010'],
  '4|AI0339': [9.5, 'AISP1011'],
  '4|AI0340': [4.6, 'AISP1012'],
  '4|AI0341': [0.3, 'AISP1013'],
  '4|AI0342': [3.8, 'AISP1014'],
  '4|AI0352': [0.0, 'AISP1015'],
  '4|AI0353': [4.9, 'AISP1016'],
  '4|AI0354': [0.0, 'AISP1017'],
  '4|AI0355': [0.32, 'AISP1018'],
  '4|AI0356': [0.56, 'AISP1019'],
  '4|AI0357': [2.0, 'AISP1020'],
  '4|AI0358': [0.57, 'AISP1021'],
  '4|AI0432': [69.4, 'LILM1800'],
  '4|AI0433': [0.1, 'PILM1812'],
  '4|AI0434': [0.0, 'PILM1811'],
  '4|AI0438': [7.0, 'PIIA1064A'],
  '4|AI0448': [864.0, 'TIFG1100'],
  '4|AI0449': [657.0, 'TIFG1102'],
  '4|AI0450': [388.0, 'TIFG1108'],
  '4|AI0451': [382.0, 'TIFG1111'],
  '4|AI0452': [502.0, 'TIFG1107'],
  '4|AI0453': [854.0, 'TIFG1101'],
  '4|AI0454': [694.0, 'TIFG1103'],
  '4|AI0464': [504.0, 'TIFG1104'],
  '4|AI0465': [443.0, 'TIFG1106'],
  '4|AI0466': [359.0, 'TIFG1110'],
  '4|AI0467': [370.0, 'TIFG1113'],
  '4|AI0468': [426.0, 'TIFG1109'],
  '4|AI0469': [584.0, 'TIFG1105'],
  '4|AI0470': [7.0, 'PIIA1064B'],
  '5|AI0064': [28.6, 'FIMU0001'],
  '5|AI0160': [13.8, 'LIMU0708A'],
  '5|AI0178': [0.029, 'DPIMU0709A'],
  '5|AI0181': [12.8, 'PIDO0005'],
  '5|AI0182': [0.029, 'DPIDO0001'],
  '5|AI0194': [0.0, 'DPIMU0709B'],
  '5|AI0197': [9.1, 'PIMU0709'],
  '5|AI0210': [0.001, 'DPIMU0709C'],
  '5|AI0240': [13.7, 'LIMU0708B'],
  '5|AI0245': [4.978, 'LIDO0701']
};
/* the controllers on the same snapshots: PV / SV / MV and the mode shown (A = AUTO, R = REMOTE, M = MANUAL) */
const AN_HMI_CTL = {
  /* 2.2.0-beta.3: LP heater drains and deaerator level, from 02.png (the only screen with them; valve positions at about 60 MW) */
  LICCD1104: { pv: null, sv: null, mv: 17.5, mode: 'A' },
  LICHD11011: { pv: null, sv: null, mv: 13.6, mode: 'A' },
  LICHD11012: { pv: null, sv: null, mv: 0.1, mode: 'A' },
  LICHD11021: { pv: null, sv: null, mv: 99.9, mode: 'A' },
  LICHD11022: { pv: null, sv: null, mv: 53.7, mode: 'A' },
  LICHD11031: { pv: null, sv: null, mv: 32.4, mode: 'A' },
  LICHD11032: { pv: null, sv: null, mv: 0.1, mode: 'A' },
  'LICBR1001B': { pv: null, sv: null, mv: 0.6, mode: 'M' } /* start-up drum level valve FCVFW11302 0.6 % M (03.png) */,
  'AICFG10571': { pv: 41.0, sv: 200.0, mv: 11.0, mode: 'M' },
  'AICFG112': { pv: null, sv: 3.5, mv: 50.0, mode: 'R' } /* 2.2.0-beta.7: MV from the drawing: SA demand 211.5 T/H x O2 trim = SAF FLOW CTL R-SV 215.3 (7.PNG) -> trim 1.0 = S1-LN15(50 %), the MH of AICFG112 (PID summary). Before: the O2 model was anchored at the manual 100 % of the cold start and went to 2.4 % */,
  'DPICFG108': { pv: 1434.0, sv: 1475.0, mv: 0.0, mode: 'M' },
  'EIC-TM': { pv: 148.6, sv: 150.0, mv: 75.0, mode: 'A' },
  'FIC-CF': { pv: 72.8, sv: 73.0, mv: 72.8, mode: 'R' } /* 2.2.0-beta.1: not on a screen; from the drawing: PV = average of the 3 feeder MVs (72.8 %), MV = feeder AUTO-MV (bias 0.0), SV = FIC-CM.MV 73.0 % */,
  'FIC-CM': { pv: 87.0, sv: 87.4, mv: 73.0, mode: 'R' },
  'FIC-OM': { pv: 0.0, sv: 0.0, mv: 0.0, mode: 'M' },
  'FICCL1061A': { pv: 29.0, sv: 29.1, mv: 72.8, mode: 'A' },
  'FICCL1061B': { pv: 29.1, sv: 29.1, mv: 72.8, mode: 'A' },
  'FICCL1061C': { pv: 28.9, sv: 29.1, mv: 72.8, mode: 'A' },
  'FICDO1043A': { pv: 0.0, sv: 0.0, mv: 25.0, mode: 'M' },
  'FICDO1043B': { pv: 0.0, sv: 0.0, mv: 25.0, mode: 'M' },
  'FICDO1043C': { pv: 0.0, sv: 0.0, mv: 25.0, mode: 'M' },
  'FICDO1043D': { pv: 0.0, sv: 0.0, mv: 25.0, mode: 'M' },
  'FICFA1071': { pv: null, sv: 354.6, mv: 35.6, mode: 'R' } /* 2.2.0-beta.3: MV = PAF inlet damper MCVFA10531 35.6 % (7.PNG) */,
  'FICFA1081': { pv: null, sv: 215.3, mv: 37.1, mode: 'R' } /* 2.2.0-beta.3: MV = SAF inlet damper MCVFA10541 37.1 % (7.PNG) */,
  'FICFW1007': { pv: 499.1, sv: 500.3, mv: 56.0, mode: 'R' },
  'HIC-BM': { pv: 68.4, sv: 68.3, mv: 68.3, mode: 'A' },
  'HIC-ULD': { pv: 150.0, sv: 150.0, mv: 75.0, mode: 'A' },
  'HICHR1002A': { pv: 11.0, sv: 11.0, mv: 11.0, mode: 'A' },
  'HICHR1002B': { pv: 89.0, sv: 89.0, mv: 89.0, mode: 'A' },
  'LICBR1001': { pv: 3.0, sv: 0.0, mv: 4.8, mode: 'A' },
  'LICBR1001A': { pv: 3.0, sv: 0.0, mv: 56.0, mode: 'A' },
  'PIC-COBM': { pv: 122.7, sv: 122.3, mv: 0.8, mode: 'A' },
  'PICAS1004': { pv: null, sv: 9.4, mv: 0.0, mode: 'A' },
  'PICAS1005': { pv: null, sv: 10.2, mv: 4.2, mode: 'A' },
  'PICCD1104': { pv: 5.9, sv: 1.5, mv: 0.0, mode: 'A' },
  'PICDO1043A': { pv: 0.0, sv: 0.0, mv: 25.0, mode: 'M' },
  'PICDO1043B': { pv: 0.0, sv: 0.0, mv: 25.0, mode: 'M' },
  'PICDO1043C': { pv: 0.0, sv: 0.0, mv: 25.0, mode: 'M' },
  'PICDO1043D': { pv: 0.0, sv: 0.0, mv: 25.0, mode: 'M' },
  'FICCD1120': { pv: null, sv: null, mv: 0.1, mode: 'A' } /* 2.1.0-beta.10: valve FCVCD1120 0.1 % A (28.png) */,
  'FICCD1121': { pv: null, sv: null, mv: 100.0, mode: 'M' } /* 2.1.0-beta.10: valve FCVCD1121 100.0 % M (28.png) */,
  'FICFA1043A': { pv: null, sv: null, mv: 2.5, mode: 'M' } /* 2.1.0-beta.10: valve MCVFA1043A 2.5 % M (L shown, R-SV 26.0) (12.PNG) */,
  'FICFA1043B': { pv: null, sv: null, mv: 5.5, mode: 'M' } /* 2.1.0-beta.10: valve MCVFA1043B 5.5 % M (R shown, R-SV 26.0) (13.PNG) */,
  'FICFA1043C': { pv: null, sv: null, mv: 5.0, mode: 'M' } /* 2.1.0-beta.10: valve MCVFA1043C 5.0 % M (L shown, R-SV 26.0) (14.PNG) */,
  'FICFA1043D': { pv: null, sv: null, mv: 1.7, mode: 'M' } /* 2.1.0-beta.10: valve MCVFA1043D 1.7 % M (L shown, R-SV 26.0) (15.PNG) */,
  'FICFA1055A': { pv: null, sv: null, mv: 42.8, mode: 'A' } /* 2.1.0-beta.10: valve FCVFA1055A1 42.8 % A (9.png) */,
  'FICFA1055B': { pv: null, sv: null, mv: 24.9, mode: 'M' } /* 2.1.0-beta.10: valve FCVFA1055B1 24.9 % M (9.png) */,
  'HICBR1391': { pv: null, sv: null, mv: 0.0, mode: 'R' } /* 2.1.0-beta.10: valve MVBR1391 0.0 % R TQ (A) (03.png) */,
  'HICDO1012': { pv: null, sv: null, mv: 100.0, mode: 'M' } /* 2.1.0-beta.10: valve FCVDO1012 100.0 % M (6.PNG) */,
  'HICFA1005': { pv: null, sv: null, mv: 24.9, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1005 24.9 % R A TQ (magenta) (8.PNG) */,
  'HICFA1006': { pv: null, sv: null, mv: 49.2, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1006 49.2 % R A (8.PNG) */,
  'HICFA1007': { pv: null, sv: null, mv: 25.3, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1007 25.3 % R A (8.PNG) */,
  'HICFA1008': { pv: null, sv: null, mv: 49.1, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1008 49.1 % R A (8.PNG) */,
  'HICFA1009': { pv: null, sv: null, mv: 21.2, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1009 21.2 % R A TQ (magenta) (8.PNG) */,
  'HICFA1010': { pv: null, sv: null, mv: 48.5, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1010 48.5 % R A (8.PNG) */,
  'HICFA1011': { pv: null, sv: null, mv: 25.3, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1011 25.3 % R A (8.PNG) */,
  'HICFA1012': { pv: null, sv: null, mv: 48.8, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1012 48.8 % R A (8.PNG) */,
  'HICFA1013': { pv: null, sv: null, mv: 24.2, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1013 24.2 % R A (8.PNG) */,
  'HICFA1014': { pv: null, sv: null, mv: 49.4, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1014 49.4 % R A (8.PNG) */,
  'HICFA1015': { pv: null, sv: null, mv: 24.3, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1015 24.3 % R A (8.PNG) */,
  'HICFA1016': { pv: null, sv: null, mv: 49.0, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1016 49.0 % R A (8.PNG) */,
  'HICFA1017': { pv: null, sv: null, mv: 25.1, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1017 25.1 % R A (8.PNG) */,
  'HICFA1018': { pv: null, sv: null, mv: 0.5, mode: 'A' } /* 2.1.0-beta.10: valve MCVFA1018 0.5 % L A TQ (magenta) (8.PNG) */,
  'HICFA1019': { pv: null, sv: null, mv: 25.5, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1019 25.5 % R A (8.PNG) */,
  'HICFA1020': { pv: null, sv: null, mv: 49.1, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1020 49.1 % R A (8.PNG) */,
  'HICFA1021': { pv: null, sv: null, mv: 24.6, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1021 24.6 % R A (8.PNG) */,
  'HICFA1022': { pv: null, sv: null, mv: 48.7, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1022 48.7 % R A (8.PNG) */,
  'HICFA1023': { pv: null, sv: null, mv: 23.5, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1023 23.5 % R A (8.PNG) */,
  'HICFA1024': { pv: null, sv: null, mv: 48.7, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1024 48.7 % R A (8.PNG) */,
  'HICFA1025': { pv: null, sv: null, mv: 25.4, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1025 25.4 % R A (8.PNG) */,
  'HICFA1026': { pv: null, sv: null, mv: 48.3, mode: 'R' } /* 2.1.0-beta.10: valve MCVFA1026 48.3 % R A (8.PNG) */,
  'LICCD1110A': { pv: null, sv: null, mv: 14.0, mode: 'A' } /* 2.1.0-beta.10: valve LCVMU1110 14.0 % A (28.png) */,
  'LICCD1110B': { pv: null, sv: null, mv: 0.1, mode: 'A' } /* 2.1.0-beta.10: valve LCVCD1110 0.1 % A (28.png) */,
  'PICDO0005': { pv: null, sv: null, mv: 24.2, mode: 'A' } /* 2.1.0-beta.10: valve PCVDO0002 24.2 % A (6.PNG) */,
  'PICDO1008': { pv: null, sv: null, mv: 85.7, mode: 'A' } /* 2.1.0-beta.10: valve PCVDO1009 85.7 % A (6.PNG) */,
  'PICSB1052': { pv: null, sv: null, mv: 0.2, mode: 'M' } /* 2.1.0-beta.10: valve PCVSB1053 0.2 % M (18.PNG) */,
  'TICAS1001': { pv: null, sv: null, mv: 0.1, mode: 'M' } /* 2.1.0-beta.10: valve TCVCD1124 0.1 % M (29.PNG) */,
  'TICLO1002': { pv: null, sv: null, mv: 53.1, mode: 'R' } /* 2.1.0-beta.10: valve TCVCW1201 53.1 % R (27.PNG) */,
  'HS-COAL': { pv: 81.2, sv: 81.2, mv: 33.1, mode: 'R' } /* 2.2.0-beta.1: 11.png "TOTAL COAL FLOW CORRECT." = HS-COAL (TOTAL COAL FLOW CORRECTION CONTROL 0 ~ 120 T/H): MV 33.1 % -> LN3 0.932, 87.0 T/H x 0.932 = 81.1 T/H; 4450 x 0.932 = 4150 Kcal/Kg on the screen */,
  'PICFG108': { pv: -16.0, sv: -16.0, mv: 46.1, mode: 'A' } /* 2.1.0-beta.6: IDF hydraulic coupling A 46.1 % (7.PNG) */,
  'PICFG108A': { pv: null, sv: null, mv: 99.1, mode: 'M' } /* 2.1.0-beta.6: IDF inlet damper PCDFG10561 M 99.1 % (7.PNG) */,
  'PICHR1003': { pv: 34.4, sv: 36.0, mv: 0.8, mode: 'R' },
  'PICHR1391': { pv: 34.4, sv: 35.5, mv: null, mode: 'A' },
  'PICMS1002': { pv: 122.1, sv: 128.0, mv: 0.0, mode: 'A' },
  'PICMS1006': { pv: 121.1, sv: 123.1, mv: 0.0, mode: 'R' },
  'SICL1060A': { pv: 0.0, sv: 0.6, mv: null, mode: 'M' },
  'SICL1060B': { pv: 0.0, sv: 0.6, mv: null, mode: 'M' },
  'SICL1060C': { pv: 0.0, sv: 0.6, mv: null, mode: 'M' },
  'SICL1060D': { pv: 0.0, sv: 0.6, mv: null, mode: 'M' },
  'TICAS1017': { pv: 185.0, sv: 259.0, mv: 0.0, mode: 'A' },
  'TICBR1130': { pv: 394.0, sv: 394.0, mv: 57.6, mode: 'R' },
  'TICBR1140': { pv: 462.0, sv: 462.0, mv: 65.6, mode: 'A' },
  'TICBR1150': { pv: 420.0, sv: 418.0, mv: 30.2, mode: 'R' },
  'TICHR1002': { pv: 541.0, sv: 541.0, mv: 79.4, mode: 'A' },
  'TICHR1002A': { pv: 541.0, sv: 538.0, mv: 36.0, mode: 'R' },
  'TICHR1012': { pv: 136.0, sv: 137.0, mv: 0.0, mode: 'M' },
  'TICMS1004': { pv: 542.0, sv: 541.0, mv: 69.7, mode: 'A' },
  'TICMS1022': { pv: 360.0, sv: 300.0, mv: 0.0, mode: 'M' }
};
/* 2.1.0-beta.6: selections the operator made earlier that the drawing keeps in a flip-flop (sheet|output of the FF): on the snapshot
   they are already made. ABC-008 M.0202 = HYDRAULIC CONTROL SELECT (7.PNG: hydraulic coupling PICFG108 in AUTO, damper in MANUAL) */
const AN_HMI_FF = {
  'ABC-008|M.0202': [1, 'IDF hydraulic coupling control selected (7.PNG)']
};
/* 2.1.0-beta.11: manual stations (MAN blocks, hand loaders) of the snapshots, in the unit of the station: 33.PNG MW OUTPUT HIGH /
   LOW LIMIT SET, OUTPUT CHANGE RATE SET; the MAN stations that are in AN_HMI_CTL take their MV (% station) or PV (other unit) */
const AN_HMI_MAN = {
  'HIC-MWHL': [238.4, '33.PNG MW OUTPUT HIGH LIMIT SET (clamped to the range of the station)'],
  'HIC-MWLL': [0.0, '33.PNG MW OUTPUT LOW LIMIT SET'],
  'HIC-MWRL': [3.0, '33.PNG OUTPUT CHANGE RATE SET (MW/MIN)'],
  /* 2.2.0-beta.7: ABC-002 HIC-TADBS (station -50 ~ +50) -> F(X) S1-LN14 "PA FLOW BIAS" (x 0 % -> -30 T/H, 50 % -> 0, 100 % -> +30):
     7.PNG PAF FLOW BIAS -30.0 T/H = station -50. PA demand = S1-LN12(coal 81 T/H) 380 - 30 = 350 T/H (7.PNG PAF FLOW CTL R-SV 354.6) */
  'HIC-TADBS': [-50.0, '7.PNG PAF FLOW BIAS -30.0 T/H']
};
/* 2.1.0-beta.11: digital inputs that the drawing names only by a text beside the wire (no address): [sheet, text, nth (same text
   counted top to bottom), value, why]. ABC-004A: the 8 "BNR SUPPLY OIL VALVE CLOSE" inputs of HS-COAL (I/O list STN104
   I.0001 / I.0003 / I.0321 / I.0323 / I.0641 / I.0643 / I.0961 / I.0963); the oil burners are out of service at full load
   (6.PNG: oil flows 0, FIC-OM M 0 %), the valves are closed */
const AN_HMI_TXT = [
  ['ABC-004A', 'A-BNR SUPPLY OIL', 0, 1], ['ABC-004A', 'A-BNR SUPPLY OIL', 1, 1],
  ['ABC-004A', 'B-BNR SUPPLY OIL', 0, 1], ['ABC-004A', 'B-BNR SUPPLY OIL', 1, 1],
  ['ABC-004A', 'C-BNR SUPPLY OIL', 0, 1], ['ABC-004A', 'C-BNR SUPPLY OIL', 1, 1],
  ['ABC-004A', 'D-BNR SUPPLY OIL', 0, 1], ['ABC-004A', 'D-BNR SUPPLY OIL', 1, 1]
];
/* the input wire whose free end is nearest to the text (the same rule as the UAT scenarios, src/ui/uat/scen.js nearOf) */
function hmiNearNet(S, txt, nth) {
  const tx = (S.tx || []).filter(x => String(x.t).trim() === txt).sort((a, b) => a.y - b.y || a.x - b.x)[nth || 0];
  if (!tx) return -1;
  let bn = -1,
    bd = 60;
  for (const m of S.ext)
    for (const i of S.nets[m].segs) {
      const g = S.seg[i];
      for (const [x, y] of [[g.x1, g.y1], [g.x2, g.y2]]) {
        const d = Math.hypot(tx.x - x, tx.y - y);
        if (d < bd) {
          bd = d;
          bn = m;
        }
      }
    }
  return bn;
}
/* plant equipment in service on the same snapshots (digital inputs of the ABC sheets; the meaning is the text written beside
   the address on the drawing / the memory list): 1 = running / complete, 0 = stopped / standby */
/* 2.2.0-beta.3: raw transmitter -> the compensated value of the drawing that is on the snapshot */
const AN_HMI_COMP = [
  ['ABC-010', 'AI0130', 'LIBR10011.PV', 0.0],
  ['ABC-010', 'AI0258', 'LIBR10012.PV', 2.0],
  ['ABC-010', 'AI0386', 'LIBR10013.PV', 8.0],
  /* main steam flow FT-MS1031: the snapshot 474.1 T/H (03.png, FIQMS1031) is the flow after the pressure / temperature
     compensation of the drawing (SQRT of LN31(p) x LN32(T) x AI0129) */
  ['ABC-001C', 'AI0129', 'SQRT', 474.1],
  /* primary / secondary air flow FT-FA1071 / FT-FA1081: temperature compensated (SQRT of TP(T, DP), 35 C reference); 7.PNG
     FIFA1071 354.0 T/H, FIFA1081 213.0 T/H. Before: 265.5 / 157.5 T/H after the load (PRIMARY AIR FLOW L.L. -> MFT on the DITL) */
  ['ABC-006', 'AI0484', 'FIFA1071.PV', 354.0],
  ['ABC-006', 'AI0513', 'FIFA1081.PV', 213.0]
];
const AN_HMI_DI = {
  'M.3343': [1, 'BFWP A running (03.png: BFWP-A 289.4 A)'],
  'M.3344': [0, 'BFWP B running (03.png: BFWP-B standby)'],
  'M.3400': [1, 'A-coal feeder running (11.png; memory list 101)'],
  'M.3401': [1, 'B-coal feeder running (11.png)'],
  'M.3402': [1, 'C-coal feeder running (11.png)'],
  'M.3405': [1, 'coal feeder A/B/C all in REMOTE and running (11.png)'],
  'M.3302': [1, 'PA fan running (7.PNG: F-1053 PAF 253.6 A)'],
  'M.3303': [1, 'SA fan running (7.PNG: F-1054 SAF 134.0 A)'],
  'M.3304': [1, 'ID fan running (7.PNG: F-1056 IDF 199.6 A)'],
  'M.3308': [1, 'FA blower A running (9.png: F-1055A 37.3 A)'],
  'M.3309': [0, 'FA blower B running (9.png: F-1055B standby)'],
  'M.3350': [1, 'condensate pump A running (28.png: CP-A 28.1 A)'],
  'M.3351': [0, 'condensate pump B running (28.png: CP-B standby)'],
  'M.3353': [0, 'seawater pump A running (30.PNG: SWP-A stopped)'],
  'M.3354': [1, 'seawater pump B running (30.PNG: SWP-B 242.5 A)'],
  'M.3355': [1, 'seawater pump C running (30.PNG: SWP-C 207.6 A)'],
  'M.3200': [0, 'turbine trip (unit at 148.8 MW)'],
  'M.3220': [0, '52G1 opened (generator breaker closed at 148.8 MW)'],
  'I.0418': [1, 'ICV to CV transfer complete (4.PNG: turbine on CV, CV(A) 46 %)'],
  /* 2.2.0-beta.7: I/O list STN102 I.0931 MIG-52G1-1 "#1 GCB 52G1 on" (ABC-050, ABC-053). ABC-053: with the breaker on, the lube oil
     temperature SV is 46 C (CONST 46), else LN22 (38 C); 27.PNG / 36.PNG lube oil after the coolers 46 C. Before: 0, SV 38 C, the
     oil went to 40 C and the cooling water valve to 62 % (27.PNG TCVCW1201 53.1 %) */
  'I.0931': [1, 'GCB 52G1 on (37.PNG: synchronized, 52G1 closed, red)']
};
/* 2.2.0-beta.3: the drum level transmitters LT-BR1001-1 / 2 / 3 (ABC-010 AI0130 / AI0258 / AI0386) and the main steam flow
   FT-MS1031 (ABC-001C AI0129) are raw values; the snapshot value is the COMPENSATED one that the drawing computes from them
   (drum level: 100 % - LT %, LN38(p), / LN39(p); steam flow: SQRT of LN31(p) x LN32(T) x DP). Before, the snapshot value was
   written as the raw one: drum level 393 / 146 / 393 mm at the end of the load (DRUM LEVEL H.H. > 254 mm, M.0173 / M.0175 ->
   MFT on the DITL), steam flow 461 instead of 474.1 T/H. The raw value is found so that the compensated one is the snapshot
   (secant, 4 steps); the drum level plant model (integrating) starts again from there */
function hmiComp(only, wantOf) {
  for (const [shn, ai, pv, want0] of AN_HMI_COMP) {
    if (only && !only(ai)) continue;
    const want = wantOf ? wantOf(ai, want0) : want0;
    try {
      const sh = AN.sheets.find(x => x.name === shn),
        S = sh && sh.S;
      if (!S) continue;
      const a = S.blk.find(b => b.k === 'AI' && b.o && (AN.nm(S, b.o[0]) || '').trim() === ai),
        n = pv === 'SQRT' ? anCompNet(S, ai) : S.lab.findIndex(l => l && String(l.t).trim() === pv),
        st = a && S.rt.st[a.id];
      if (!st || n < 0) continue;
      const at = x => {
        st.val = st.act = x;
        stepSet(sh, 0);
        return S.rt.v[n];
      };
      let x0 = st.val,
        y0 = at(x0) - want,
        x1 = x0 - 50,
        y1 = at(x1) - want;
      for (let k = 0; k < 4 && Math.abs(y1) > 0.05 && Math.abs(y1 - y0) > 1e-9; k++) {
        const x2 = x1 - (y1 * (x1 - x0)) / (y1 - y0);
        x0 = x1;
        y0 = y1;
        x1 = x2;
        y1 = at(x1) - want;
      }
      if (a.rng) x1 = Math.max(a.rng.lo, Math.min(a.rng.hi, x1));
      at(x1);
    } catch (e) {}
  }
  try {
    const sh = AN.sheets.find(x => x.name === 'ABC-010');
    for (const b of (sh && sh.S && sh.S.procs) || []) if ((b.txt || [])[1] === 'LICBR1001' && sh.S.rt.pm) delete sh.S.rt.pm[b.id];
  } catch (e) {}
  /* the sheets that read these values through a link (ABC-007 FICFA1071 reads FIFA1071.PV of ABC-006) see them now */
  try {
    for (let k = 0; k < 2; k++) for (const sh of AN.sheets) if (sh.S && !/^ABC-000/.test(sh.name)) stepSet(sh, 0);
  } catch (e) {}
}
function anPlantLoad150() {
  return anGenRun(anPlantLoad150S());
}
/* 3.2.0 retest #54 (user 2026-10-28: the page froze over 1 min at "Gabay: Cold -> 150 MW", no loading sign): the starting states are
   generators that yield after each sheet step. AN.plantCold() / plantLoad150() run them at once (the tests, the same result as
   before); AN.plantColdAsync() / plantLoad150Async() run them in slices of 40 ms, so the page paints a progress bar in between */
function* anPlantLoad150S() {
  AN.steady = true;
  try {
    return yield* anPlantLoad150G();
  } finally {
    AN.steady = false;
  }
}
function* anPlantLoad150G() {
  let n = 0;
  /* 2.5.0-beta.7: the snapshot is a steady state, so no pulse is running: the first scan after Reset took every pulse input that is
     already 1 as a new edge (ABC-020 TPS of NOT HICHR1002B.MAN, 2 s): with the ID fan running of the load it set M.017A and the SH and
     RH gas bias dampers stayed MANUAL at 150 MW (39.PNG: both A) */
  for (const sh of AN.sheets)
    if (sh.S && sh.S.rt)
      for (const b of sh.S.blk)
        if ((b.k === 'TPS' || b.k === 'TPV') && sh.S.rt.st[b.id]) Object.assign(sh.S.rt.st[b.id], { run: 0, out: 0, acc: 0 });
  for (const sh of AN.sheets) {
    if (/^ABC-000/.test(sh.name)) continue;
    let S;
    try {
      S = ensure(sh);
    } catch (e) {
      continue;
    }
    let st = null;
    try {
      st = shStn(sh);
    } catch (e) {}
    if (st == null) continue;
    for (const b of S.blk) {
      if (b.k !== 'AI' || !b.o || b.o[0] == null) continue;
      const nm = (AN.nm(S, b.o[0]) || '').trim(),
        m = /^(?:S(\d)\s*)?(AI\d{4})$/.exec(nm);
      if (!m) continue;
      const x = AN_HMI_AI[(m[1] || st) + '|' + m[2]],
        s = S.rt.st[b.id];
      if (!x || !s) continue;
      s.val = s.act = x[0];
      s.snap = 1;
      n++;
    }
  }
  hmiComp();
  /* equipment in service */
  let nd = 0;
  for (const sh of AN.sheets) {
    if (/^ABC-000/.test(sh.name) || !sh.S) continue;
    const S = sh.S;
    for (const n of S.ext) {
      if (!S.nets[n] || !S.nets[n].dig) continue;
      const x = AN_HMI_DI[(AN.nm(S, n) || '').trim()];
      if (x) {
        S.rt.ext[n] = x[0];
        nd++;
      }
    }
  }
  /* 2.2.0-beta.9: 33.PNG CCS OPERATION: the plant is in CCS (EIC-TM turbine master A, SV 150 / MV 75 %, TARGET MW SETPOINT FROM TCS
     149.5 MW): the TCS gives the control to the DCS. STN101 ABC-001C I.0081 DCS CONTROL MODE PERMISSIVE FROM TCS, I.0082 DCS CONTROL
     MODE ON FROM TCS (M.2017 = NOT I.0082 forced the turbine master to MANUAL). Only on ABC-001C: the same address on STN102 is
     another signal (DITL-61A I.0082 CONDENSATE PUMP A REMOTE SELECTED) */
  try {
    const s1 = AN.sheets.find(x => x.name === 'ABC-001C');
    if (s1 && s1.S)
      for (const l of ['I.0081', 'I.0082']) {
        const n = s1.S.lab.findIndex(x => x && String(x.t).trim() === l);
        if (n >= 0 && s1.S.ext.includes(n)) {
          s1.S.rt.ext[n] = 1;
          nd++;
        }
      }
  } catch (e) {}
  for (const k in AN_HMI_FF) {
    const [sn, lb] = k.split('|'),
      sh = AN.sheets.find(x => x.name === sn);
    if (!sh || !sh.S) continue;
    const S = sh.S;
    for (const b of S.blk) if (b.k === 'FF' && (b.o || []).some(n => (AN.nm(S, n) || '').trim() === lb) && S.rt.st[b.id]) S.rt.st[b.id].q = AN_HMI_FF[k][0];
  }
  for (const [sn, t, k, val] of AN_HMI_TXT) {
    const sh = AN.sheets.find(x => x.name === sn);
    if (!sh || !sh.S) continue;
    const m = hmiNearNet(sh.S, t, k);
    if (m >= 0 && sh.S.nets[m].dig) {
      sh.S.rt.ext[m] = val;
      nd++;
    }
  }
  let nm_ = 0;
  for (const sh of AN.sheets) {
    if (/^ABC-000/.test(sh.name) || !sh.S) continue;
    const S = sh.S;
    for (const b of S.blk) {
      if (b.k !== 'MAN' || !S.rt.st[b.id]) continue;
      const tag = b.tag || (b.txt || []).find(t => t && t !== 'MAN' && !/^S\d-MDL/.test(t));
      const P = b.p || {},
        lo = P.lo != null ? P.lo : 0,
        hi = P.hi != null ? P.hi : 100,
        h = AN_HMI_CTL[tag],
        x = AN_HMI_MAN[tag];
      let v = x ? x[0] : null;
      if (v == null && h) v = String(P.u || '%').trim() === '%' ? (h.mv != null ? h.mv : h.pv) : h.pv != null ? h.pv : h.sv;
      if (v == null || !isFinite(v)) continue;
      S.rt.st[b.id].val = Math.max(lo, Math.min(hi, v));
      /* a station that follows its own set input in AUTO (plant.js MAN: svI from an AMT on leg A): that input is the target
         (ABC-001A HIC-ULD: TARGET MW, COS SI0243 = 150 MW on 33.PNG) */
      try {
        const si = b.svI >= 0 ? b.i[b.svI] : null,
          dr = si != null ? (S.drv[si] || []).find(z => z.k === 'AMT') : null;
        if (dr && dr.a != null && S.ext.includes(dr.a) && !(S.xlk && S.xlk[dr.a])) S.rt.ext[dr.a] = Math.max(lo, Math.min(hi, v));
        /* 2.2.0-beta.9: a station whose set input is its OWN output through the AMT (ABC-001B HIC-MWRL: AMT leg A = HIC-MWRL.MV): the
           value goes on that loop too (output nets and AMT out), else the next scan read the old output back (0.1 MW/MIN instead of
           3.0 MW/MIN of 33.PNG: the unit load changed 30 times slower than the operator set it) */
        if (dr && dr.o && dr.o[0] != null && !S.ext.includes(dr.a)) {
          const x = Math.max(lo, Math.min(hi, v));
          S.rt.v[dr.o[0]] = x;
          for (const n of b.o || []) if (n != null && n >= 0) S.rt.v[n] = x;
        }
      } catch (e) {}
      nm_++;
    }
  }
  /* controllers: MV, operator SV and mode as on the snapshot (the station and the SV switch, like the operator would set them) */
  let nc = 0;
  const modes = [];
  if (AN.hmiCtrls)
    for (const sh of AN.sheets) {
      if (/^ABC-000/.test(sh.name) || !sh.S) continue;
      const S = sh.S,
        rt = S.rt;
      let cs = [];
      try {
        cs = AN.hmiCtrls(S) || [];
      } catch (e) {}
      for (const c of cs) {
        const h = AN_HMI_CTL[c.tag];
        if (!h) continue;
        nc++;
        if (h.mv != null) {
          const ps = rt.st[c.b.id];
          if (ps) hmiPidSet(ps, c.b, h.mv);
          if (c.manBlk && rt.st[c.manBlk.id]) rt.st[c.manBlk.id].val = h.mv;
          else if (c.manNet != null && S.ext.includes(c.manNet)) rt.ext[c.manNet] = h.mv;
        }
        if (h.sv != null) hmiSvWrite(S, c, h.sv);
        if (h.mode) modes.push([S, c, h.mode]);
      }
      rt.pm = {}; /* the plant model starts again from these commands (anchored at the snapshot) */
    }
  /* mode status of the drawing (.MAN / .LOC / .REM, every sheet with the tag): M = MANUAL, A = LOCAL (AUTO), R = REMOTE */
  const MK = { MAN: ['MAN', 'MANUAL'], LOC: ['LOC', 'LOCAL', 'AUTO', 'AUT'], REM: ['REM', 'REMOTE'] };
  for (const [, c, m] of modes)
    for (const sh of AN.sheets) {
      if (/^ABC-000/.test(sh.name) || !sh.S) continue;
      const S = sh.S;
      for (const n of S.ext)
        for (const nm0 of [AN.nm(S, n)].concat((S.alias && S.alias[n]) || [])) {
          /* 2.3.0-beta.1: also the mode status written beside an address-named wire (S.alias, ABC-011 TICBR1130.LOC = M.0230) */
          const nm = (nm0 || '').trim().toUpperCase(),
            k = nm.startsWith(c.tag.toUpperCase() + '.') ? nm.slice(c.tag.length + 1) : null;
          if (!k) continue;
          if (MK.MAN.includes(k)) S.rt.ext[n] = m === 'M' ? 1 : 0;
          else if (MK.REM.includes(k)) S.rt.ext[n] = m === 'R' ? 1 : 0;
          else if (MK.LOC.includes(k)) S.rt.ext[n] = m === 'A' ? 1 : 0;
        }
    }
  /* 2.1.0-beta.6: the PV of every loop from the snapshot transmitters, with the plant model OFF for a moment (logic only); the
     plant model of the loop is anchored at that PV (plant.js pr.hopReq) at the end of the load, with the MV of the snapshot */
  const caps = [],
    heldOn = [];
  let nsv = 0;
  try {
    const L = AN.sheets.filter(sh => sh.S && !/^ABC-000/.test(sh.name)),
      was = [];
    for (const sh of L)
      for (const b of sh.S.procs || [])
        if (b.proc) {
          was.push([b.proc, b.proc.on]);
          b.proc.on = false;
        }
    for (let k = 0; k < 6; k++) for (const sh of L) (stepSet(sh, 0), yield);
    for (const sh of L) {
      const S = sh.S;
      for (const b of S.procs || []) {
        const pr = b.proc;
        if (!pr || pr.mode === 'shared') continue;
        const TS = pr.remote ? pr.remote.S : S,
          ids = (pr.remote ? pr.remote.ai : pr.ai) || [];
        if (!ids.some(id => TS.rt.st[id] && TS.rt.st[id].snap)) continue;
        /* the command of the snapshot when every valve on this PV has its MV there (parallel: the sum; in series: the product) */
        const grp = [b].concat(S.procs.filter(g => g !== b && g.proc && g.proc.mode === 'shared' && g.proc.pv === pr.pv)),
          mvs = grp.map(g => (AN_HMI_CTL[(g.txt || [])[1]] || {}).mv);
        let mv = null;
        if (mvs.every(x => x != null))
          mv = grp.some(g => AN_SERIES[(g.txt || [])[1]])
            ? mvs.reduce((a, x) => (a * x) / 100, 100)
            : Math.max(-100, Math.min(100, mvs.reduce((a, x, i) => a + ((grp[i].p.act < 0) === (b.p.act < 0) ? 1 : -1) * x, 0))); /* opposite ACT: subtracted (plant.js u) */
        caps.push([pr, S.rt.v[pr.pv], mv]);
      }
      /* 2.1.0-beta.10: a loop with no SV on the snapshot (and not in REMOTE there): the operator SV = its PV now, while the PV is
         still the snapshot one (the plant runs steady at full load: PV = SV). Before, the operator SV stayed 0 and the PID drove
         the valve to 0 or 100 % (ABC-029 PICDO1008, ABC-031 LICCD1110A, ABC-035 LICHD11051 ...) */
      let cs = [];
      try {
        cs = AN.hmiCtrls(S) || [];
      } catch (e) {}
      for (const c of cs) {
        const h = AN_HMI_CTL[c.tag];
        if ((h && (h.sv != null || h.mode === 'R')) || !c.q || c.q.pv == null) continue;
        if (h && h.mv != null && (h.mv < 2 || h.mv > 98)) continue; /* the valve at a limit on the snapshot: the loop is not at PV = SV (ABC-032 FICCD1120 min-flow valve 0.1 % at 380 T/H) */
        if (hmiSvWrite(S, c, S.rt.v[c.q.pv])) nsv++;
      }
    }
    /* 2.2.0-beta.3: the loops whose transmitters have a snapshot value keep their plant model OFF until the end of the load,
       when the anchor (hopReq) is set: before, their unanchored model ran in the 10 s below and moved the transmitters away
       (ABC-012 main steam temperature AI0612 / AI0644: 542 -> 494 C, back to 541 only after 300 s; with it the compensated
       main steam flow, the feedwater SV, 550 T/H of feedwater and the drum level H.H. 285 mm) */
    const held = new Set(caps.map(c => c[0]));
    for (const [pr, on] of was) {
      if (held.has(pr)) heldOn.push([pr, on]);
      else pr.on = on;
    }
  } catch (e) {}
  /* the plant runs 10 s so that the interlocks of the cold boiler clear, then the operator sets the modes (a station that
     was forced to MANUAL stays MANUAL until AUTO is pressed again: user rule 2026-10-15) */
  try {
    for (const sh of AN.sheets) if (sh.S && !/^ABC-000/.test(sh.name)) for (let k = 0; k < 20; k++) (stepSet(sh, 0.5), yield);
  } catch (e) {}
  /* 2.2.0-beta.10 (CLAUDE.md 10): a MAN station that a BU-CMD of the drawing forced to MANUAL while the cold plant was loading stays
     MANUAL (the latch, plant.js). Right after the 10 s the operator selects the modes of the snapshot: AUTO (MAN off) for a station
     that is not M there and whose BU-CMD is gone (33.PNG: HIC-BM A, EIC-TM A; 11.png feeders A). It is done HERE, before the MV of
     the snapshot is written again and before the plant models are anchored: done after them, the coal feeders A / B / C kept the
     values they tracked while MANUAL (26.5 / 38.2 / 38.2 T/H instead of 29) and the unit model anchored its coal at 103 T/H */
  try {
    for (let k = 0; k < 2; k++) {
      for (const sh of AN.sheets) {
        if (/^ABC-000/.test(sh.name) || !sh.S) continue;
        const S = sh.S;
        for (const b of S.blk) {
          const s = b.k === 'MAN' && S.rt.st[b.id];
          if (!s || !s.fmSet || !b._mn) continue;
          const h = AN_HMI_CTL[b.tag];
          if (h && h.mode === 'M') continue;
          const dr = b.svI >= 0 ? (S.drv[b.i[b.svI]] || []).find(x => x.k === 'AMT') : null,
            ast = dr && S.rt.st[dr.id];
          if (!ast || ast.fman) continue;
          for (const [S2, n] of b._mn) if (S2.rt.force[n] === undefined) S2.rt.ext[n] = 0;
          ast.fm = 'A';
          s.fmSet = 0;
        }
      }
      for (const sh of AN.sheets) if (sh.S && !/^ABC-000/.test(sh.name)) (stepSet(sh, 0), yield);
    }
  } catch (e) {}
  /* 2.1.0-beta.6: the MV of the snapshot again after the 10 s: a start pulse of the drawing may have preset it (ABC-008 M.020E:
     ID fan start -> PICFG108 MV 13 %), but on the snapshot the equipment was already running; then 2 s so the force manual
     that came from that preset clears (M.0206 = MV < 14 %) */
  try {
    for (const [S, c] of modes) {
      const h = AN_HMI_CTL[c.tag],
        rt = S.rt;
      if (!h || h.mv == null) continue;
      if (c.manBlk && rt.st[c.manBlk.id]) rt.st[c.manBlk.id].val = h.mv;
      else if (c.manNet != null && S.ext.includes(c.manNet)) rt.ext[c.manNet] = h.mv;
      const ps = rt.st[c.b.id];
      if (ps) hmiPidSet(ps, c.b, h.mv);
    }
    for (const sh of AN.sheets) if (sh.S && !/^ABC-000/.test(sh.name)) for (let k = 0; k < 4; k++) (stepSet(sh, 0.5), yield);
  } catch (e) {}
  for (const [pr, pv, mv] of caps) pr.hopReq = { pv, mv };
  /* the held plant models start now, from the snapshot PV (pr.y0) and the anchor */
  hmiComp();
  for (const [pr, on] of heldOn) pr.on = on;
  try {
    for (const sh of AN.sheets)
      if (sh.S && sh.S.rt && sh.S.rt.pm)
        for (const b of sh.S.procs || [])
          if (b.proc && heldOn.some(h => h[0] === b.proc)) {
            delete sh.S.rt.pm[b.id];
            b.proc.y0 = 1;
          }
  } catch (e) {}
  /* 2.1.0-beta.11: drum level (integrating, plant.js): the feedwater that does not leave as main steam on the snapshot
     (03.png: FICFW1007 499.1 T/H, main steam AI0129 474.1 T/H) */
  try {
    const fw = AN_HMI_CTL.FICFW1007,
      ms = AN_HMI_AI['1|AI0129'];
    for (const sh of AN.sheets)
      if (sh.S)
        for (const b of sh.S.procs || []) if (b.proc && (b.txt || [])[1] === 'LICBR1001' && fw && ms) b.proc.integLoss = b.proc.integLoss0 = Math.max(0, fw.pv - ms[0]);
  } catch (e) {}
  try {
    for (const sh of AN.sheets) if (sh.S && !/^ABC-000/.test(sh.name)) (stepSet(sh, 0.5), yield);
  } catch (e) {}
  for (const [S, c, m] of modes) {
    const rt = S.rt;
    if (c.amt) {
      const st = rt.st[c.amt.id];
      if (st) {
        st.al = c.autoLeg;
        st.fm = m === 'M' ? (c.autoLeg === 'A' ? 'B' : 'A') : c.autoLeg;
      }
    }
    if (c.svSw) {
      const q = rt.st[c.svSw.id];
      if (q) {
        q.al = 'A';
        q.fm = m === 'R' ? 'A' : 'B';
      }
    }
  }
  /* 2.1.0-beta.11: the plant runs steady at full load: the rate limiters and the lags of the drawing have reached their input
     (before, the MW demand ABC-001B SI0212 started at 0 and its rate limit of 3 MW/min needed 50 min to reach 150 MW, so the
     boiler master feedforward, the fuel and the air demands stayed low) */
  try {
    for (let it = 0; it < 6; it++) {
      for (const sh of AN.sheets) {
        if (/^ABC-000/.test(sh.name) || !sh.S) continue;
        const S = sh.S,
          rt = S.rt;
        for (const b of S.blk) {
          const st = rt.st[b.id];
          if (!st) continue;
          if (b.k === 'LAG' && b.i && b.i[0] != null && isFinite(rt.v[b.i[0]])) st.y = rt.v[b.i[0]];
          else if ((b.k === 'RATE' || b.k === 'RAMPB') && b.main !== undefined && isFinite(rt.v[b.main])) st.y = rt.v[b.main];
        }
      }
      for (const sh of AN.sheets) if (sh.S && !/^ABC-000/.test(sh.name)) (stepSet(sh, 0), yield);
      /* the controller outputs of the snapshot once more: an integral that moved while the demands were still low comes back
         (ABC-001C PIC-COBM: 0.8 % on 33.PNG, 13.1 % after the 10 s) */
      for (const [S, c] of modes) {
        const h = AN_HMI_CTL[c.tag],
          ps = h && h.mv != null ? S.rt.st[c.b.id] : null;
        if (ps) hmiPidSet(ps, c.b, h.mv);
      }
    }
  } catch (e) {}
  /* 2.2.0-beta.7: the operator's mode selection once more, after the plant has settled: an interlock that a not-yet-selected mode
     held for one scan (ABC-002 M.0103 / M.0102 = NOT FICFA1081.REM: the O2 trim AICFG112 is forced manual until the SA flow is in
     REMOTE) is clear now, like the operator who puts the SA flow in REMOTE first and then the O2 trim in AUTO (7.PNG O2 CONTROL R).
     A force manual of the drawing that is still active keeps the station manual (plant.js) */
  try {
    for (const [S, c, m] of modes) {
      if (m === 'M') {
        /* a MANUAL station: its manual MV of the snapshot again (the COS of the manual leg followed the PID output while the auto
           leg was selected in the cold start: ABC-051 TICMS1022 HP bypass spray 7.9 % instead of 0.0 %, 4.PNG TCVFW1060 0.1 % M) */
        const h = AN_HMI_CTL[c.tag],
          rt = S.rt;
        if (h && h.mv != null) {
          if (c.manBlk && rt.st[c.manBlk.id]) rt.st[c.manBlk.id].val = h.mv;
          else if (c.manNet != null && S.ext.includes(c.manNet)) rt.ext[c.manNet] = h.mv;
          if (c.amt && rt.st[c.amt.id]) rt.st[c.amt.id].hold = h.mv;
        }
        continue;
      }
      const st = c.amt ? S.rt.st[c.amt.id] : null;
      if (st) st.fm = c.autoLeg;
      if (c.svSw && m === 'R') {
        const q = S.rt.st[c.svSw.id];
        if (q) q.fm = 'A';
      }
    }
    for (const sh of AN.sheets) if (sh.S && !/^ABC-000/.test(sh.name)) (stepSet(sh, 0), yield);
    for (const [S, c] of modes) {
      const h = AN_HMI_CTL[c.tag],
        ps = h && h.mv != null ? S.rt.st[c.b.id] : null;
      if (ps) hmiPidSet(ps, c.b, h.mv);
    }
  } catch (e) {}
  /* 2.2.0-beta.9 (M2): the boiler and the turbine run as one plant from here (unit.js) */
  try {
    anUnitStart();
  } catch (e) {}
  AN.load150 = { ai: n, ctl: nc, di: nd, sv: nsv, man: nm_, unit: AN_UNIT.on };
  AN.hmiDI = AN_HMI_DI;
  AN.hmiComp = hmiComp;
  return n;
}
/* 2.2.0-beta.14 (M4 step 1, PR-OPE-5002 / boiler manual Fig 2): START COLD. The anchors of "Start at 150 MW" are kept (they are
   the gains of every loop model), then the plant is put cold: the digital inputs of a boiler out of service (coal feeders and fans
   stopped, supply oil valves closed, burners out of service, generator breaker open), every controller LOCAL + MANUAL at 0 % (the
   operator starts the plant from the faceplates; the furnace pressure PICFG108 / 108A stays AUTO as the operator leaves it before
   the purge), the drum level model without the blowdown loss of the snapshot, and the unit model cold (unit.js anUnitCold: drum
   0 kg/cm2, water and bed at 30 C, turbine shut). The DITL sequence (purge, igniters, burner in service) is forced by the operator or
   by the CHECK scenario (CLAUDE.md 7) */
const AN_HMI_DI_COLD = {
  'M.3400': 0,
  'M.3401': 0,
  'M.3402': 0,
  'M.3405': 0 /* coal feeders A / B / C stopped */,
  'M.3302': 0,
  'M.3303': 0,
  'M.3304': 0 /* PAF / SAF / IDF stopped: the operator starts them for the purge */,
  /* 3.2.0-beta.14 (source.js): a cold plant has every machine stopped: FA blowers A / B, condensate pumps A / B, seawater pumps A / B / C
     (memory list BC FROM S3; PR-OPE-5002 starts them in the pre-start). Before they stayed running from the 150 MW snapshot, so the
     condensate flow FICCD1120 read 380 T/H in a cold plant and the Live Training ticked those steps by itself */
  'M.3308': 0,
  'M.3309': 0,
  'M.3350': 0,
  'M.3351': 0,
  'M.3353': 0,
  'M.3354': 0,
  'M.3355': 0,
  /* 3.2.0-beta.21 (bug, user 2026-10-24: "na-reset ko na, cold na, may value pa rin? ... drum lvl at fw flow"): the boiler feedwater
     pumps A / B (ABC-010 M.3343 / M.3344, memory list BC FROM S3) stayed running from the 150 MW snapshot: the feedwater flow read
     0.2 T/H with every valve shut and the drum level crept up 2 mm every 10 minutes in a cold plant */
  'M.3343': 0,
  'M.3344': 0,
  'M.3410': 1,
  'M.3411': 1,
  'M.3416': 1,
  'M.3417': 1 /* A ~ D start-up burner SUPPLY OIL VALVE (1)(2) CLOSE (memory list, BC FROM S4) */,
  'M.3412': 0,
  'M.3413': 0,
  'M.3418': 0,
  'M.3419': 0 /* A ~ D BURNER IN SERVICE */,
  'I.0931': 0,
  'I.0932': 1 /* GCB 52G1 off: the generator is not synchronised */,
  'I.0418': 0 /* no ICV -> CV transfer */,
  'I.0081': 0 /* 2.2.0-beta.17: DCS control mode permissive from the TCS: none before NORMAL OPERATION (PR-OPE-5002 4.6) */,
  'I.0082': 0 /* DCS control mode ON from the TCS: off (the snapshot of 150 MW has both = 1) */
};
/* 2.2.0-beta.15: the SUPPLY OIL VALVE (1)(2) CLOSE of a start-up burner (M.3410 / 3411 / 3416 / 3417, memory list BC FROM S4) is the
   AND of the two limit switches on the coal feeder sheets (ABC-004A ~ C), linked to ABC-003x and ABC-029. The operator opens (or
   closes) the two valves = the two inputs of that AND (one address = one signal, CLAUDE.md 1). Returns the inputs written */
/* 2.2.0-beta.22 (M5): the drum BLOWDOWN valve (field hand valve, not a DCS station): the water that leaves the drum besides the main
   steam (pr.integLoss, 25 T/H from 03.png at 150 MW). PR-OPE-5003 "Before stopping BFP, set the drum level near HH (blow down valve
   must be close)". Before: the 25 T/H left the drum for ever, so a bottled boiler emptied (drum level -422 mm, the bottom of the
   range, 25 min after the BFP stop) */
function anBlowdown(open) {
  let n = 0;
  for (const sh of AN.sheets)
    if (sh.S)
      for (const b of sh.S.procs || [])
        if (b.proc && (b.txt || [])[1] === 'LICBR1001') {
          b.proc.integLoss = open ? b.proc.integLoss0 || 0 : 0;
          n++;
        }
  return n;
}
function anOilValve(addr, open) {
  let n = 0;
  for (const sh of AN.sheets) {
    if (!sh.S || /^ABC-000/.test(sh.name)) continue;
    const T = sh.S;
    for (let k = 0; k < T.lab.length; k++) {
      if (!T.lab[k] || String(T.lab[k].t).trim() !== addr || T.ext.includes(k)) continue;
      for (const g of T.drv[k] || [])
        if (g.k === 'AND')
          for (const i of g.i || [])
            if (T.ext.includes(i) && T.rt.force[i] === undefined) {
              T.rt.ext[i] = open ? 0 : 1;
              n++;
            }
    }
  }
  return n;
}
/* 2.2.0-beta.21 (M5): Start at 150 MW with the shutdown physics on (unit.js anUnitLive) */
function anPlantLive() {
  const n = anPlantLoad150();
  if (AN_UNIT.on) anUnitLive();
  return n;
}
function anPlantCold() {
  return anGenRun(anPlantColdG());
}
function* anPlantColdG() {
  const n = yield* anPlantLoad150S();
  if (!AN_UNIT.on) return 0;
  const L = AN.sheets.filter(sh => sh.S && !/^ABC-000/.test(sh.name));
  /* 2.2.0-beta.16: the cold state is a steady state too: a digital input the cold map sets (ABC-050 I.0932 "GCB 52G1 off" = 1) changed
     long ago, so its pulse is over (plant.js TPS: no pulse while AN.steady). Before: the edge fired M.0124 "TURBINE TRIP / HOUSE LOAD /
     52G OPEN (PULSE)" on ABC-050 / 052 / 030 / 033 / 013 during Start cold: the LP bypass PICHR1003 was forced AUTO for 5 s, opened to
     100 % against a reheat pressure of 0.6 kg/cm2, and the bumpless COS kept 45.6 % in MANUAL after it (TICHR1012 80 %, PICAS1004 17 %) */
  AN.steady = true;
  for (const sh of L) {
    const S = sh.S,
      rt = S.rt;
    for (const e of S.ext) {
      const x = AN_HMI_DI_COLD[(AN.nm(S, e) || '').trim()];
      if (x !== undefined && rt.force[e] === undefined) rt.ext[e] = x;
    }
    for (const c of (AN.hmiCtrls && AN.hmiCtrls(S)) || []) {
      if (c.tag === 'PICFG108' || c.tag === 'PICFG108A') continue;
      if (c.svSw && rt.st[c.svSw.id]) {
        rt.st[c.svSw.id].al = 'A';
        rt.st[c.svSw.id].fm = 'B';
      }
      if (c.amt && rt.st[c.amt.id]) {
        const st = rt.st[c.amt.id];
        st.al = c.autoLeg;
        st.fm = c.autoLeg === 'A' ? 'B' : 'A';
        st.hold = 0;
      }
      if (c.manBlk && rt.st[c.manBlk.id]) rt.st[c.manBlk.id].val = 0;
      else if (c.manNet != null && S.ext.includes(c.manNet) && !(S.xlk && S.xlk[c.manNet])) rt.ext[c.manNet] = 0;
      const ps = rt.st[c.b.id];
      if (ps) hmiPidSet(ps, c.b, 0);
      /* .MAN = 1 (.LOC / .REM = 0) on every sheet with the tag: the mode STATUS the drawing reads (CLAUDE.md 2; ABC-010 M.0226: the
         start-up level control LICBR1001B is allowed only while FICFW1007 and LICBR1001A are in MANUAL) */
      if (AN.latchMode)
        try {
          AN.latchMode(c.tag, 'MAN');
        } catch (e) {}
    }
    for (const b of S.procs || []) if (b.proc && (b.txt || [])[1] === 'LICBR1001') b.proc.integLoss = 0;
  }
  anUnitCold();
  try {
    /* one step: the unit model writes its transmitters (drum 0, MSP 0, MW 0 ...) */
    stepSet(AN.sheets.find(x => x.name === 'ABC-001C'), 0.5);
    yield;
    /* every loop model starts again at the steady state of its (new) command: no feedwater flow decaying from 499 T/H into the
       drum of a cold boiler (an integrating level keeps its PV) */
    for (const sh of L) sh.S.rt.pm = {};
    /* 3.2.0-beta.14: and not from the PV of the 150 MW snapshot (pr.y0 of anPlantLoad150, still set on a sheet that was not stepped
       yet): ABC-034 gland steam temperature began at 185 C in a cold plant and took minutes to reach the ambient */
    for (const sh of L) for (const b of sh.S.procs || []) if (b.proc) b.proc.y0 = 0;
    /* 3.2.0 roadmap 3: a TANK LEVEL keeps its water in a cold plant (no pump runs, nothing flows in or out): the model starts from the
       level read now (deaerator LT-CD1104 71 mm, hotwell LT-CD1110 4 mm, at their normal level), not from the steady state of its
       closed valve (the heater shells stay drained). Before, the cold level depended on whether the sheet had been stepped: a second Start cold read the deaerator at
       -529 mm and the hotwell at -122 mm */
    for (const sh of L) for (const b of sh.S.procs || []) if (b.proc && /^LICCD11(04|10A)$/.test((b.txt || [])[1] || '')) b.proc.y0 = 1;
    /* the drum level transmitters: the raw value that gives the snapshot level at the cold drum pressure (the density
       compensation LN38 / LN39 of the drawing changes with the pressure) */
    /* 3.2.0 walkthrough #7 (PR-OPE-5002 STEAM DRUM FILLING: the BFP fills the drum through FCV-FW1130-2 to -150 mm): the drum of a cold
       plant is not filled yet; its level starts at AN_COLD_DRUM (below the -150 mm of the procedure), the three transmitters 0 / 2 / 8 mm
       apart as in the snapshot. Before: the normal water level (0 / 2 / 8 mm) */
    hmiComp(ai => /^AI0(130|258|386)$/.test(ai), (ai, w) => AN_COLD_DRUM + w);
  } catch (e) {}
  /* 3.2.0-beta.22: the drum level of the model after the compensation above, kept through the settling steps below */
  const lvl0 = anDrumLvlState();
  /* the lags and the rate limiters of the drawing at their (new) inputs, like anPlantLoad150 */
  try {
    /* 2.5.0-beta.3: a cold plant has no generator load of the 150 MW snapshot. The average select holds its last value while every
       input is 0 (zero = lost signal, user rule v1.20.34), so ABC-001C EIC-TM.PV (generator MW AI0419 / AI0774 at 0 MW) kept 151.5 MW
       and the "MW" link set ABC-013 M.025A (> 81.5 MW); with the turbine trip / 52G1 open wired by the drawing audit (ABC-013-1) that
       gave house operation M.025B = 1 during the cold start-up: coal feeders forced MANUAL (ABC-004A M.0141), FIC-CF back-up to 0.
       Only the MW select: the pressure and level selects keep their hold, the warm / hot start states are tuned on it */
    for (const sh of L)
      for (const b of sh.S.blk) {
        const st = sh.S.rt.st[b.id];
        if (st && b.k === 'SEL' && (b.i || []).some(n => n >= 0 && /^AI0(419|774)$/.test(String((sh.S.lab[n] && sh.S.lab[n].t) || '').trim())))
          st.last = null;
      }
    for (let it = 0; it < 4; it++) {
      for (const sh of L)
        for (const b of sh.S.blk) {
          const st = sh.S.rt.st[b.id],
            v = sh.S.rt.v;
          if (!st) continue;
          if (b.k === 'LAG' && b.i && b.i[0] != null && isFinite(v[b.i[0]])) st.y = v[b.i[0]];
          else if ((b.k === 'RATE' || b.k === 'RAMPB') && b.main !== undefined && isFinite(v[b.main])) st.y = v[b.main];
        }
      for (const sh of L) (stepSet(sh, 0), yield);
    }
    for (let k = 0; k < 2; k++) for (const sh of L) (stepSet(sh, 0.5), yield);
    /* 3.2.0-beta.22 (bug, user 2026-10-24 "na-reset ko na, cold na, may value pa rin? ... drum lvl"): during these settling steps the
       feedwater PV of the 3-element loop still read the flow of the snapshot (153 T/H) before its model reached 0, and the drum level
       model added that water: the cold level began at 55 mm instead of the normal water level (0 / 2 / 8 mm of the three
       transmitters). The settling steps are not plant time: the level model and its transmitters go back to where they were */
    if (lvl0) lvl0.put();
  } catch (e) {}
  /* 3.2.0 roadmap 3: nor are they plant time for the slow temperatures of the unit model (unit.js anUnitStepX: feedwater, aux steam,
     FA blowers): they start again at the value of the cold plant (TT-FW1160 kept 99 C, TT-AS1003 209 C) */
  if (AN_UNIT.xt) {
    const t = AN_UNIT.Tamb;
    AN_UNIT.xt.T = { cr: t, aux: t, fw: t, fab0: t, fab1: t };
  }
  /* P2 #13: a cold plant has no vacuum: the condenser vacuum breaker MOV MV-AV1391 (DITL-56) is open, the ejector steam MOVs
     MV-AS1395 / MV-AS1396 (DITL-54 / DITL-55) are shut (PR-OPE-5002 6197: the breaker is open until the vacuum up) */
  try {
    if (typeof MST !== 'undefined' && typeof S !== 'undefined') {
      const s = S.sheets.find(x => /\)DITL-56$/.test(x.name));
      if (s) MST[s.name] = [{ pos: 100, run: 0, lr: 1, tq: 0 }];
    }
  } catch (e) {}
  AN.steady = false;
  AN.cold = true;
  return n;
}
/* run a starting-state generator at once (AN._asc: the step set of each sheet is kept for the run, actSet; the links do not change) */
function anGenRun(g) {
  const own = !AN._asc;
  if (own) AN._asc = new Map();
  try {
    let r;
    while (!(r = g.next()).done);
    return r.value;
  } finally {
    if (own) AN._asc = null;
  }
}
/* the same in slices of 40 ms; AN._loading stops the RUN timers of the ABC page and of the world meanwhile; prog(k) = steps done */
function anGenAsync(g, prog) {
  return new Promise((ok, no) => {
    let k = 0;
    AN._loading = true;
    AN._asc = new Map();
    const fin = () => {
      AN._loading = false;
      AN._asc = null;
    };
    const run = () => {
      const t0 = performance.now();
      try {
        for (;;) {
          const r = g.next();
          k++;
          if (r.done) {
            fin();
            ok(r.value);
            return;
          }
          if (performance.now() - t0 > 40) break;
        }
      } catch (e) {
        fin();
        no(e);
        return;
      }
      if (prog)
        try {
          prog(k);
        } catch (e) {}
      setTimeout(run, 0);
    };
    setTimeout(run, 30);
  });
}
const anPlantColdAsync = prog => anGenAsync(anPlantColdG(), prog);
const anPlantLoad150Async = prog => anGenAsync(anPlantLoad150S(), prog);
/* Reset + a starting state ('cold' / '150') without freezing the page, with the progress bar of the shell (window.lsBusy, app.js);
   on = the plant model ON first. One load at a time (AN._loadP); resolves with the anchors, sets AN.startState */
function anLoadStart(kind, on) {
  if (AN._loadP) return AN._loadP;
  const cold = kind === 'cold',
    B = window.lsBusy,
    est = (cold ? 46 : 40) * Math.max(1, AN.sheets.length - 1);
  if (B) B.show(cold ? 'Nilo-load ang Cold plant…' : 'Nilo-load ang 150 MW…');
  const p = new Promise(r => setTimeout(r, 40))
    .then(() => {
      if (on && !AN.plantOn && AN.plantSwitch) AN.plantSwitch(true, true);
      AN.reset();
      return (cold ? anPlantColdAsync : anPlantLoad150Async)(k => B && B.prog(k / est));
    })
    .then(n => {
      AN.startState = cold ? 'plantCold' : 'plantLoad150';
      return n;
    });
  AN._loadP = p;
  const end = () => {
    AN._loadP = null;
    if (B) B.hide();
  };
  p.then(end, end);
  return p;
}
/* the drum level of a cold plant before the STEAM DRUM FILLING of PR-OPE-5002 (mm, ASSUMED: low, under the -150 mm fill target) */
const AN_COLD_DRUM = -300;
/* the drum level model of ABC-010 (plant.js pr.integ, LICBR1001): its state and the level it holds now */
function anDrumLvlState() {
  try {
    const sh = AN.sheets.find(x => x.name === 'ABC-010'),
      S = sh && sh.S;
    for (const b of (S && S.procs) || [])
      if (b.proc && b.proc.integ) {
        if (!S.rt.pm[b.id]) stepSet(sh, 0);
        const q = S.rt.pm[b.id],
          ai = S.blk.filter(a => a.k === 'AI' && a.o && /^AI0(130|258|386)$/.test((AN.nm(S, a.o[0]) || '').trim())).map(a => [S.rt.st[a.id], S.rt.st[a.id].val]);
        if (q && isFinite(q.y))
          return {
            q,
            put() {
              Object.assign(q, this.q0);
              for (const [st, x] of ai) st.val = st.act = x;
              stepSet(sh, 0);
            },
            q0: { y: q.y, u: q.u, up: q.up, pp: q.pp }
          };
      }
  } catch (e) {}
  return null;
}
/* the output of a PID (plant.js PID: u = kp * es + I): the output and the integral, so it stays there when PV = SV */
function hmiPidSet(ps, b, mv) {
  ps.out = mv;
  ps.I = mv - ((b.p && b.p.kp != null ? b.p.kp : 1) * (ps.es || 0));
}
/* the operator SV of a controller, written where the faceplate writes it (src/ui/hmi/hmi.js svSet): the SV net when it is an input,
   else the operator leg (B) of the SV switch */
function hmiSvWrite(S, c, v) {
  if (!isFinite(v) || !c.q || c.q.sv == null) return false;
  if (S.ext.includes(c.q.sv) && !(S.xlk && S.xlk[c.q.sv])) {
    S.rt.ext[c.q.sv] = v;
    return true;
  }
  if (c.svSw && c.svSw.b != null && S.ext.includes(c.svSw.b)) {
    S.rt.ext[c.svSw.b] = v;
    return true;
  }
  return false;
}
