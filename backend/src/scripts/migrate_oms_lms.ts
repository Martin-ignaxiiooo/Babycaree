import { query } from "../config/db";

/**
 * Migración: agrega parámetros LMS (L, M, S) de la OMS para peso-por-edad
 * a la tabla oms_percentiles, y los puebla con los valores OFICIALES de
 * los estándares de crecimiento infantil de la OMS (WHO Child Growth
 * Standards, weight-for-age y length/height-for-age, 0-60 meses, niños
 * y niñas). Antes esta tabla solo tenía 7 filas "dummy" (Unisex, 0-6
 * meses) usadas como placeholder.
 *
 * Estos parámetros permiten calcular el PERCENTIL REAL del bebé mediante
 * el método LMS de la OMS:
 *   z = ((peso/M)^L - 1) / (L*S)   (o  ln(peso/M)/S  si L=0)
 *   percentil = distribución_normal_acumulada(z) * 100
 * en vez de la aproximación lineal que se usaba antes.
 *
 * Fuente de los datos: WHO Child Growth Standards
 * (http://www.who.int/childgrowth/standards/en/), tal como los publica
 * la librería de referencia "pygrowup" (https://pypi.org/project/pygrowup/),
 * que empaqueta directamente las tablas oficiales de la OMS.
 */

// [sexo, mes_vida, L (peso), M (peso, kg), S (peso), M (talla, cm)]
const LMS_OMS: [string, number, number, number, number, number][] = [
['Masculino', 0, 0.3487, 3.3464, 0.14602, 49.8842],
  ['Masculino', 1, 0.2297, 4.4709, 0.13395, 54.7244],
  ['Masculino', 2, 0.197, 5.5675, 0.12385, 58.4249],
  ['Masculino', 3, 0.1738, 6.3762, 0.11727, 61.4292],
  ['Masculino', 4, 0.1553, 7.0023, 0.11316, 63.886],
  ['Masculino', 5, 0.1395, 7.5105, 0.1108, 65.9026],
  ['Masculino', 6, 0.1257, 7.934, 0.10958, 67.6236],
  ['Masculino', 7, 0.1134, 8.297, 0.10902, 69.1645],
  ['Masculino', 8, 0.1021, 8.6151, 0.10882, 70.5994],
  ['Masculino', 9, 0.0917, 8.9014, 0.10881, 71.9687],
  ['Masculino', 10, 0.082, 9.1649, 0.10891, 73.2812],
  ['Masculino', 11, 0.073, 9.4122, 0.10906, 74.5388],
  ['Masculino', 12, 0.0644, 9.6479, 0.10925, 75.7488],
  ['Masculino', 13, 0.0563, 9.8749, 0.10949, 76.9186],
  ['Masculino', 14, 0.0487, 10.0953, 0.10976, 78.0497],
  ['Masculino', 15, 0.0413, 10.3108, 0.11007, 79.1458],
  ['Masculino', 16, 0.0343, 10.5228, 0.11041, 80.2113],
  ['Masculino', 17, 0.0275, 10.7319, 0.11079, 81.2487],
  ['Masculino', 18, 0.0211, 10.9385, 0.11119, 82.2587],
  ['Masculino', 19, 0.0148, 11.143, 0.11164, 83.2418],
  ['Masculino', 20, 0.0087, 11.3462, 0.11211, 84.1996],
  ['Masculino', 21, 0.0029, 11.5486, 0.11261, 85.1348],
  ['Masculino', 22, -0.0028, 11.7504, 0.11314, 86.0477],
  ['Masculino', 23, -0.0083, 11.9514, 0.11369, 86.941],
  ['Masculino', 24, -0.0137, 12.1515, 0.11426, 87.1161],
  ['Masculino', 25, -0.0189, 12.3502, 0.11485, 87.972],
  ['Masculino', 26, -0.024, 12.5466, 0.11544, 88.8065],
  ['Masculino', 27, -0.0289, 12.7401, 0.11604, 89.6197],
  ['Masculino', 28, -0.0337, 12.9303, 0.11664, 90.412],
  ['Masculino', 29, -0.0385, 13.1169, 0.11723, 91.1828],
  ['Masculino', 30, -0.0431, 13.3, 0.11781, 91.9327],
  ['Masculino', 31, -0.0476, 13.4798, 0.11839, 92.6631],
  ['Masculino', 32, -0.052, 13.6567, 0.11896, 93.3753],
  ['Masculino', 33, -0.0564, 13.8309, 0.11953, 94.0711],
  ['Masculino', 34, -0.0606, 14.0031, 0.12008, 94.7532],
  ['Masculino', 35, -0.0648, 14.1736, 0.12062, 95.4236],
  ['Masculino', 36, -0.0689, 14.3429, 0.12116, 96.0835],
  ['Masculino', 37, -0.0729, 14.5113, 0.12168, 96.7337],
  ['Masculino', 38, -0.0769, 14.6791, 0.1222, 97.3749],
  ['Masculino', 39, -0.0808, 14.8466, 0.12271, 98.0073],
  ['Masculino', 40, -0.0846, 15.014, 0.12322, 98.631],
  ['Masculino', 41, -0.0883, 15.1813, 0.12373, 99.2459],
  ['Masculino', 42, -0.092, 15.3486, 0.12425, 99.8515],
  ['Masculino', 43, -0.0957, 15.5158, 0.12478, 100.4485],
  ['Masculino', 44, -0.0993, 15.6828, 0.12531, 101.0374],
  ['Masculino', 45, -0.1028, 15.8497, 0.12586, 101.6186],
  ['Masculino', 46, -0.1063, 16.0163, 0.12643, 102.1933],
  ['Masculino', 47, -0.1097, 16.1827, 0.127, 102.7625],
  ['Masculino', 48, -0.1131, 16.3489, 0.12759, 103.3273],
  ['Masculino', 49, -0.1165, 16.515, 0.12819, 103.8886],
  ['Masculino', 50, -0.1198, 16.6811, 0.1288, 104.4473],
  ['Masculino', 51, -0.123, 16.8471, 0.12943, 105.0041],
  ['Masculino', 52, -0.1262, 17.0132, 0.13005, 105.5596],
  ['Masculino', 53, -0.1294, 17.1792, 0.13069, 106.1138],
  ['Masculino', 54, -0.1325, 17.3452, 0.13133, 106.6668],
  ['Masculino', 55, -0.1356, 17.5111, 0.13197, 107.2188],
  ['Masculino', 56, -0.1387, 17.6768, 0.13261, 107.7697],
  ['Masculino', 57, -0.1417, 17.8422, 0.13325, 108.3198],
  ['Masculino', 58, -0.1447, 18.0073, 0.13389, 108.8689],
  ['Masculino', 59, -0.1477, 18.1722, 0.13453, 109.417],
  ['Masculino', 60, -0.1506, 18.3366, 0.13517, 109.9638],
  ['Femenino', 0, 0.3809, 3.2322, 0.14171, 49.1477],
  ['Femenino', 1, 0.1714, 4.1873, 0.13724, 53.6872],
  ['Femenino', 2, 0.0962, 5.1282, 0.13, 57.0673],
  ['Femenino', 3, 0.0402, 5.8458, 0.12619, 59.8029],
  ['Femenino', 4, -0.005, 6.4237, 0.12402, 62.0899],
  ['Femenino', 5, -0.043, 6.8985, 0.12274, 64.0301],
  ['Femenino', 6, -0.0756, 7.297, 0.12204, 65.7311],
  ['Femenino', 7, -0.1039, 7.6422, 0.12178, 67.2873],
  ['Femenino', 8, -0.1288, 7.9487, 0.12181, 68.7498],
  ['Femenino', 9, -0.1507, 8.2254, 0.12199, 70.1435],
  ['Femenino', 10, -0.17, 8.48, 0.12223, 71.4818],
  ['Femenino', 11, -0.1872, 8.7192, 0.12247, 72.771],
  ['Femenino', 12, -0.2024, 8.9481, 0.12268, 74.015],
  ['Femenino', 13, -0.2158, 9.1699, 0.12283, 75.2176],
  ['Femenino', 14, -0.2278, 9.387, 0.12294, 76.3817],
  ['Femenino', 15, -0.2384, 9.6008, 0.12299, 77.5099],
  ['Femenino', 16, -0.2478, 9.8124, 0.12303, 78.6055],
  ['Femenino', 17, -0.2562, 10.0226, 0.12306, 79.671],
  ['Femenino', 18, -0.2637, 10.2315, 0.12309, 80.7079],
  ['Femenino', 19, -0.2703, 10.4393, 0.12315, 81.7182],
  ['Femenino', 20, -0.2762, 10.6464, 0.12323, 82.7036],
  ['Femenino', 21, -0.2815, 10.8534, 0.12335, 83.6654],
  ['Femenino', 22, -0.2862, 11.0608, 0.1235, 84.604],
  ['Femenino', 23, -0.2903, 11.2688, 0.12369, 85.5202],
  ['Femenino', 24, -0.2941, 11.4775, 0.1239, 85.7153],
  ['Femenino', 25, -0.2975, 11.6864, 0.12414, 86.5904],
  ['Femenino', 26, -0.3005, 11.8947, 0.12441, 87.4462],
  ['Femenino', 27, -0.3032, 12.1015, 0.12472, 88.283],
  ['Femenino', 28, -0.3057, 12.3059, 0.12506, 89.1004],
  ['Femenino', 29, -0.308, 12.5073, 0.12545, 89.8991],
  ['Femenino', 30, -0.3101, 12.7055, 0.12587, 90.6797],
  ['Femenino', 31, -0.312, 12.9006, 0.12633, 91.443],
  ['Femenino', 32, -0.3138, 13.093, 0.12683, 92.1906],
  ['Femenino', 33, -0.3155, 13.2837, 0.12737, 92.9239],
  ['Femenino', 34, -0.3171, 13.4731, 0.12794, 93.6444],
  ['Femenino', 35, -0.3186, 13.6618, 0.12855, 94.3533],
  ['Femenino', 36, -0.3201, 13.8503, 0.12919, 95.0515],
  ['Femenino', 37, -0.3216, 14.0385, 0.12988, 95.7399],
  ['Femenino', 38, -0.323, 14.2265, 0.13059, 96.4187],
  ['Femenino', 39, -0.3243, 14.414, 0.13135, 97.0885],
  ['Femenino', 40, -0.3257, 14.601, 0.13213, 97.7493],
  ['Femenino', 41, -0.327, 14.7873, 0.13293, 98.4015],
  ['Femenino', 42, -0.3283, 14.9727, 0.13376, 99.0448],
  ['Femenino', 43, -0.3296, 15.1573, 0.1346, 99.6795],
  ['Femenino', 44, -0.3309, 15.341, 0.13545, 100.3058],
  ['Femenino', 45, -0.3322, 15.524, 0.1363, 100.9238],
  ['Femenino', 46, -0.3335, 15.7064, 0.13716, 101.5337],
  ['Femenino', 47, -0.3348, 15.8882, 0.138, 102.136],
  ['Femenino', 48, -0.3361, 16.0697, 0.13884, 102.7312],
  ['Femenino', 49, -0.3374, 16.2511, 0.13968, 103.3197],
  ['Femenino', 50, -0.3387, 16.4322, 0.14051, 103.9021],
  ['Femenino', 51, -0.34, 16.6133, 0.14132, 104.4786],
  ['Femenino', 52, -0.3414, 16.7942, 0.14213, 105.0494],
  ['Femenino', 53, -0.3427, 16.9748, 0.14293, 105.6148],
  ['Femenino', 54, -0.344, 17.1551, 0.14371, 106.1748],
  ['Femenino', 55, -0.3453, 17.3347, 0.14448, 106.7295],
  ['Femenino', 56, -0.3466, 17.5136, 0.14525, 107.2788],
  ['Femenino', 57, -0.3479, 17.6916, 0.146, 107.8227],
  ['Femenino', 58, -0.3492, 17.8686, 0.14675, 108.3613],
  ['Femenino', 59, -0.3505, 18.0445, 0.14748, 108.8948],
  ['Femenino', 60, -0.3518, 18.2193, 0.14821, 109.4233],
];

async function up() {
  try {
    console.log("Agregando columnas L, M, S a oms_percentiles...");
    await query(`
      ALTER TABLE oms_percentiles
      ADD COLUMN IF NOT EXISTS l_valor DECIMAL(8,5),
      ADD COLUMN IF NOT EXISTS m_valor DECIMAL(8,4),
      ADD COLUMN IF NOT EXISTS s_valor DECIMAL(8,5);
    `);

    console.log(`Insertando ${LMS_OMS.length} filas de datos oficiales OMS (peso y talla por edad)...`);
    for (const [sexo, mes, L, M, S, tallaM] of LMS_OMS) {
      await query(
        `INSERT INTO oms_percentiles (mes_vida, sexo, peso_esperado_kg, talla_esperada_cm, l_valor, m_valor, s_valor)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (mes_vida, sexo)
         DO UPDATE SET
           peso_esperado_kg = EXCLUDED.peso_esperado_kg,
           talla_esperada_cm = EXCLUDED.talla_esperada_cm,
           l_valor = EXCLUDED.l_valor,
           m_valor = EXCLUDED.m_valor,
           s_valor = EXCLUDED.s_valor`,
        [mes, sexo, M, tallaM, L, M, S],
      );
    }

    console.log("Migración de percentiles OMS (LMS) completada con éxito.");
    process.exit(0);
  } catch (e) {
    console.error("Migración fallida:", e);
    process.exit(1);
  }
}

up();
