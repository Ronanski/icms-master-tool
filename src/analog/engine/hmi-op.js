/* 2.0.0 (user tip): PLANT AT 150 MW. The measurements of the control-room HMI snapshots (docs/hmi/operating-points.json, the
   full-load screens of 2023-10-18 / 2023-12-01; the 60 MW screen, the MFT screen and the drafts are left out), by station and
   address (STN101 AI0129 = '1|AI0129'). AN.plantLoad150() writes them into the transmitters (AI blocks) of every sheet, so the
   simulation starts like the plant in service instead of a cold boiler. Generated from the json; one value per address. */
const AN_HMI_AI = {
  '1|AI0128': [134.2, 'PIBR10011'],
  '1|AI0129': [474.1, 'FIQMS1031'],
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
  'LICBR1001B': { pv: null, sv: null, mv: 0.6, mode: 'M' } /* start-up drum level valve FCVFW11302 0.6 % M (03.png) */,
  'AICFG10571': { pv: 41.0, sv: 200.0, mv: 11.0, mode: 'M' },
  'AICFG112': { pv: null, sv: 3.5, mv: null, mode: 'R' },
  'DPICFG108': { pv: 1434.0, sv: 1475.0, mv: 0.0, mode: 'M' },
  'EIC-TM': { pv: 148.6, sv: 150.0, mv: 75.0, mode: 'A' },
  'FIC-CF': { pv: 81.2, sv: 81.2, mv: 33.1, mode: 'R' },
  'FIC-CM': { pv: 87.0, sv: 87.4, mv: 73.0, mode: 'R' },
  'FIC-OM': { pv: 0.0, sv: 0.0, mv: 0.0, mode: 'M' },
  'FICCL1061A': { pv: 29.0, sv: 29.1, mv: 72.8, mode: 'A' },
  'FICCL1061B': { pv: 29.1, sv: 29.1, mv: 72.8, mode: 'A' },
  'FICCL1061C': { pv: 28.9, sv: 29.1, mv: 72.8, mode: 'A' },
  'FICDO1043A': { pv: 0.0, sv: 0.0, mv: 25.0, mode: 'M' },
  'FICDO1043B': { pv: 0.0, sv: 0.0, mv: 25.0, mode: 'M' },
  'FICDO1043C': { pv: 0.0, sv: 0.0, mv: 25.0, mode: 'M' },
  'FICDO1043D': { pv: 0.0, sv: 0.0, mv: 25.0, mode: 'M' },
  'FICFA1071': { pv: null, sv: 354.6, mv: null, mode: 'R' },
  'FICFA1081': { pv: null, sv: 215.3, mv: null, mode: 'R' },
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
  'HS-COAL': { pv: null, sv: null, mv: null, mode: 'A' } /* 2.1.0-beta.11: not on a screen; in AUTO on 11.png (coal master FIC-CM REMOTE MV 73.0 %, feeders at SV 29.1 T/H follow it) */,
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
  'HIC-MWRL': [3.0, '33.PNG OUTPUT CHANGE RATE SET (MW/MIN)']
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
  'I.0418': [1, 'ICV to CV transfer complete (4.PNG: turbine on CV, CV(A) 46 %)']
};
function anPlantLoad150() {
  let n = 0;
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
      for (const n of S.ext) {
        const nm = (AN.nm(S, n) || '').trim().toUpperCase(),
          k = nm.startsWith(c.tag.toUpperCase() + '.') ? nm.slice(c.tag.length + 1) : null;
        if (!k) continue;
        if (MK.MAN.includes(k)) S.rt.ext[n] = m === 'M' ? 1 : 0;
        else if (MK.REM.includes(k)) S.rt.ext[n] = m === 'R' ? 1 : 0;
        else if (MK.LOC.includes(k)) S.rt.ext[n] = m === 'A' ? 1 : 0;
      }
    }
  /* 2.1.0-beta.6: the PV of every loop from the snapshot transmitters, with the plant model OFF for a moment (logic only); the
     plant model of the loop is anchored at that PV (plant.js pr.hopReq) at the end of the load, with the MV of the snapshot */
  const caps = [];
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
    for (let k = 0; k < 6; k++) for (const sh of L) stepSet(sh, 0);
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
    for (const [pr, on] of was) pr.on = on;
  } catch (e) {}
  /* the plant runs 10 s so that the interlocks of the cold boiler clear, then the operator sets the modes (a station that
     was forced to MANUAL stays MANUAL until AUTO is pressed again: user rule 2026-10-15) */
  try {
    for (const sh of AN.sheets) if (sh.S && !/^ABC-000/.test(sh.name)) for (let k = 0; k < 20; k++) stepSet(sh, 0.5);
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
    for (const sh of AN.sheets) if (sh.S && !/^ABC-000/.test(sh.name)) for (let k = 0; k < 4; k++) stepSet(sh, 0.5);
  } catch (e) {}
  for (const [pr, pv, mv] of caps) pr.hopReq = { pv, mv };
  /* 2.1.0-beta.11: drum level (integrating, plant.js): the feedwater that does not leave as main steam on the snapshot
     (03.png: FICFW1007 499.1 T/H, main steam AI0129 474.1 T/H) */
  try {
    const fw = AN_HMI_CTL.FICFW1007,
      ms = AN_HMI_AI['1|AI0129'];
    for (const sh of AN.sheets)
      if (sh.S)
        for (const b of sh.S.procs || []) if (b.proc && (b.txt || [])[1] === 'LICBR1001' && fw && ms) b.proc.integLoss = Math.max(0, fw.pv - ms[0]);
  } catch (e) {}
  try {
    for (const sh of AN.sheets) if (sh.S && !/^ABC-000/.test(sh.name)) stepSet(sh, 0.5);
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
      for (const sh of AN.sheets) if (sh.S && !/^ABC-000/.test(sh.name)) stepSet(sh, 0);
      /* the controller outputs of the snapshot once more: an integral that moved while the demands were still low comes back
         (ABC-001C PIC-COBM: 0.8 % on 33.PNG, 13.1 % after the 10 s) */
      for (const [S, c] of modes) {
        const h = AN_HMI_CTL[c.tag],
          ps = h && h.mv != null ? S.rt.st[c.b.id] : null;
        if (ps) hmiPidSet(ps, c.b, h.mv);
      }
    }
  } catch (e) {}
  AN.load150 = { ai: n, ctl: nc, di: nd, sv: nsv, man: nm_ };
  return n;
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
