/* 3.2.0-beta.15 (plan "per-loop at unit plant model", phase B): STEAM TABLE. The unit model had a fit of the saturation temperature,
   Tsat = 100 + 47.1 x ln(P + 1) (P in kg/cm2 G), right at 0 and at 130 kg/cm2 but about 30 C too high between 5 and 40 kg/cm2
   (fit 213 C at 10 kg/cm2, steam table 183 C; fit 262 C at 30, steam table 235 C): the water heat-up and the pressure raise of a
   cold start-up, and the floor of the steam temperatures, were off there. Here the saturation line of IAPWS-IF97 (region 4, the
   backward equation Ts(p)), the industrial standard steam table, with P in kg/cm2 G (1 kg/cm2 = 0.0980665 MPa, atmosphere 1.0332
   kg/cm2). Checked: 100.0 C at 0, 183.3 C at 10, 275.4 C at 60, 330.0 C at 130 kg/cm2 G. */
const STEAM_N = [
  0.11670521452767e4, -0.72421316703206e6, -0.17073846940092e2, 0.12020824702470e5, -0.32325550322333e7, 0.14915108613530e2,
  -0.48232657361591e4, 0.40511340542057e6, -0.23855557567849, 0.65017534844798e3
];
/* saturation temperature (C) of a pressure in kg/cm2 G */
function steamTsat(P) {
  const n = STEAM_N,
    p = Math.min(22.064, Math.max(0.0006117, ((Math.max(-1, +P || 0) + 1.0332) * 0.0980665))),
    b = Math.pow(p, 0.25),
    E = b * b + n[2] * b + n[5],
    F = n[0] * b * b + n[3] * b + n[6],
    G = n[1] * b * b + n[4] * b + n[7],
    D = (2 * G) / (-F - Math.sqrt(F * F - 4 * E * G)),
    x = n[9] + D;
  return (x - Math.sqrt(x * x - 4 * (n[8] + n[9] * D))) / 2 - 273.15;
}
/* slope of the saturation line, C per kg/cm2 */
function steamDTsat(P) {
  const p = Math.max(0, +P || 0);
  return (steamTsat(p + 0.05) - steamTsat(p)) / 0.05;
}
