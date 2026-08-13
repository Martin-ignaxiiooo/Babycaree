interface BabyGrowthIconProps {
  /** Semana de embarazo (1 a 40) */
  semanas: number;
  /** 0 a 100, porcentaje de las 40 semanas (usado para tamaño y color) */
  porcentaje: number;
}

function lerpColor(hexA: string, hexB: string, t: number): string {
  const a = [1, 3, 5].map((i) => parseInt(hexA.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(hexB.slice(i, i + 2), 16));
  const rgb = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${rgb.join(",")})`;
}

/**
 * Ilustración propia (SVG, no una foto) del bebé que cambia de FORMA según
 * la etapa real del embarazo, no solo de tamaño/color:
 *  - Semanas 1-8:   embrión (una forma simple, apenas curvada)
 *  - Semanas 9-16:  feto temprano (cabeza + cuerpo curvado, sin
 *                    extremidades definidas todavía)
 *  - Semanas 17-28: feto (piernas y brazo ya se distinguen)
 *  - Semanas 29-40: bebé a término (orejita, ojitos cerrados durmiendo,
 *                    extremidades bien definidas)
 * Tamaño y color siguen escalando de forma continua dentro de cada etapa.
 */
export default function BabyGrowthIcon({ semanas, porcentaje }: BabyGrowthIconProps) {
  const clamped = Math.max(0, Math.min(100, porcentaje));
  const t = clamped / 100;

  const size = 30 + (128 - 30) * t;
  const bodyColor = lerpColor("#C9BEE8", "#E8607F", t);
  const shadowColor = lerpColor("#A79BD1", "#C94764", t);
  const opacity = 0.55 + 0.45 * t;

  const stage = semanas <= 8 ? 1 : semanas <= 16 ? 2 : semanas <= 28 ? 3 : 4;

  return (
    <div
      style={{
        width: "148px",
        height: "148px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ transition: "width 0.4s ease, height 0.4s ease", opacity }}
      >
        {stage === 1 && (
          // Embrión: una sola forma simple, apenas curvada, sin cabeza
          // ni extremidades diferenciadas
          <g transform="translate(50,52)">
            <path
              d="M -10,-14 C 8,-18 16,-4 10,10 C 6,18 -8,20 -14,10
                 C -18,2 -16,-10 -10,-14 Z"
              fill={bodyColor}
            />
          </g>
        )}

        {stage === 2 && (
          // Feto temprano: cabeza y cuerpo curvado, sin brazos/piernas
          <g transform="translate(50,54)">
            <path
              d="M -6,-6 C 14,-11 24,4 18,18 C 14,28 -2,31 -13,23
                 C -22,16 -19,-2 -6,-6 Z"
              fill={bodyColor}
            />
            <circle cx="-4" cy="-16" r="13" fill={bodyColor} />
          </g>
        )}

        {stage === 3 && (
          // Feto: cuerpo, una pierna doblada y un brazo ya se distinguen
          <g transform="translate(50,56)">
            <path
              d="M 4,2 C 18,1 23,15 18,25 C 15,32 4,34 -3,31
                 C -11,28 -13,18 -9,12 C -7,6 -1,2 4,2 Z"
              fill={bodyColor}
            />
            <path
              d="M -6,4 C 2,-4 4,-13 -3,-16"
              stroke={bodyColor}
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 8,14 C 17,17 21,26 16,33"
              stroke={bodyColor}
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="-10" cy="-12" r="16" fill={bodyColor} />
          </g>
        )}

        {stage === 4 && (
          // Bebé a término: cabeza grande con orejita, ojitos cerrados,
          // brazo cruzado y las dos piernas dobladas
          <g transform="translate(43,42) scale(0.62)">
            <path
              d="M 6,4 C 24,2 30,20 24,34 C 20,44 6,46 -4,42
                 C -14,38 -16,26 -12,18 C -10,10 -2,4 6,4 Z"
              fill={bodyColor}
            />
            <path
              d="M -6,6 C 6,-4 8,-16 -2,-20"
              stroke={bodyColor}
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 10,18 C 22,20 30,30 26,42 C 24,50 16,54 8,52"
              stroke={bodyColor}
              strokeWidth="11"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M -8,22 C -20,26 -26,38 -20,48 C -17,54 -8,56 -2,52"
              stroke={bodyColor}
              strokeWidth="11"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="-14" cy="-16" r="23" fill={bodyColor} />
            <circle cx="-32" cy="-14" r="7" fill={bodyColor} />
            <path
              d="M -24,-18 Q -20,-15 -16,-18"
              stroke={shadowColor}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M -10,-18 Q -6,-15 -2,-18"
              stroke={shadowColor}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="-22" cy="-10" r="4" fill={shadowColor} opacity="0.35" />
          </g>
        )}
      </svg>
    </div>
  );
}
