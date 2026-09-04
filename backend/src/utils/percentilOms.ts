import { query } from "../config/db";

/**
 * Cálculo de percentil de crecimiento usando el método LMS de la OMS
 * (WHO Child Growth Standards). Reemplaza la aproximación lineal que
 * existía antes en home.controller.ts.
 *
 * Referencia del método: cada mes de vida tiene tres parámetros (L, M, S)
 * publicados por la OMS. Con ellos se calcula el z-score del valor medido:
 *
 *   z = ((valor / M) ^ L - 1) / (L * S)     si L != 0
 *   z = ln(valor / M) / S                   si L == 0
 *
 * y el percentil es el valor de la función de distribución acumulada
 * normal estándar evaluada en ese z-score.
 */

export interface LMS {
  l: number;
  m: number;
  s: number;
}

/** Aproximación numérica de la función error (erf), usada para la CDF normal. */
function erf(x: number): number {
  // Abramowitz & Stegun, fórmula 7.1.26 (precisión ~1.5e-7)
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);

  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);

  return sign * y;
}

/** Función de distribución acumulada de la normal estándar. */
function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/** Calcula el z-score de un valor medido dado L, M, S. */
export function calcularZScore(valor: number, { l, m, s }: LMS): number {
  if (l === 0) {
    return Math.log(valor / m) / s;
  }
  return (Math.pow(valor / m, l) - 1) / (l * s);
}

/** Calcula el percentil (0-100) de un valor medido dado L, M, S. */
export function calcularPercentil(valor: number, lms: LMS): number {
  const z = calcularZScore(valor, lms);
  const percentil = normalCDF(z) * 100;
  // Se acota a un rango [1, 99] para no mostrar percentiles extremos
  // engañosamente precisos (ej. "99.98") cuando el z-score es muy alto.
  return Math.max(1, Math.min(99, Math.round(percentil)));
}

/** Normaliza el campo "sexo" del perfil del bebé a las categorías de la OMS. */
export function mapearSexoOms(sexo: string | null | undefined): "Masculino" | "Femenino" {
  const s = (sexo || "").toLowerCase();
  if (s === "femenino" || s === "niña" || s === "f") return "Femenino";
  return "Masculino";
}

/**
 * Obtiene los parámetros L, M, S de peso-por-edad para un mes de vida y
 * sexo determinados. Si no hay datos (por ejemplo, la migración de LMS
 * aún no se ejecutó), devuelve null.
 */
export async function obtenerLMSPeso(mesVida: number, sexo: string | null | undefined): Promise<LMS | null> {
  const sexoOms = mapearSexoOms(sexo);
  const mesClamp = Math.max(0, Math.min(60, mesVida));

  const res = await query(
    `SELECT l_valor, m_valor, s_valor FROM oms_percentiles
     WHERE mes_vida = $1 AND sexo = $2 AND l_valor IS NOT NULL
     LIMIT 1`,
    [mesClamp, sexoOms],
  );

  if (res.rows.length === 0) return null;

  const { l_valor, m_valor, s_valor } = res.rows[0];
  return { l: parseFloat(l_valor), m: parseFloat(m_valor), s: parseFloat(s_valor) };
}

/**
 * Obtiene el peso y la talla medianos (P50) publicados por la OMS para un
 * mes de vida y sexo determinados. A diferencia de obtenerLMSPeso, esta
 * consulta no requiere que la migración de LMS se haya corrido: funciona
 * incluso con las 7 filas "dummy" antiguas (cae a 'Unisex' si no hay
 * datos para el sexo exacto), y sigue funcionando con los datos oficiales
 * una vez migrados.
 */
export async function obtenerMedianasOms(
  mesVida: number,
  sexo: string | null | undefined,
): Promise<{ pesoMediano: number; tallaMediana: number } | null> {
  const sexoOms = mapearSexoOms(sexo);
  const mesClamp = Math.max(0, Math.min(60, mesVida));

  const res = await query(
    `SELECT peso_esperado_kg, talla_esperada_cm FROM oms_percentiles
     WHERE mes_vida = $1 AND (sexo = $2 OR sexo = 'Unisex')
     ORDER BY sexo DESC LIMIT 1`,
    [mesClamp, sexoOms],
  );

  if (res.rows.length === 0) return null;

  const { peso_esperado_kg, talla_esperada_cm } = res.rows[0];
  return {
    pesoMediano: parseFloat(peso_esperado_kg),
    tallaMediana: parseFloat(talla_esperada_cm),
  };
}
