interface BabyGrowthIconProps {
  /** 0 a 100, porcentaje de las 40 semanas */
  porcentaje: number;
}

/**
 * Ilustración simple y propia (no una foto) de un bebé en posición fetal.
 * El tamaño del contenedor escala según la semana de embarazo, para que la
 * imagen realmente represente "qué tan grande" está el bebé en vez de
 * mostrarse siempre igual de grande sin importar la semana.
 */
export default function BabyGrowthIcon({ porcentaje }: BabyGrowthIconProps) {
  const clamped = Math.max(0, Math.min(100, porcentaje));
  // Tamaño mínimo bien chico al inicio (semana 1) y máximo al final (semana 40)
  const size = 34 + (128 - 34) * (clamped / 100);

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
        style={{ transition: "width 0.4s ease, height 0.4s ease" }}
      >
        <g transform="translate(50,52)">
          {/* Cuerpo curvado en posición fetal */}
          <path
            d="M -8,-2
               C 18,-14 30,10 18,28
               C 10,40 -12,40 -20,26
               C -28,12 -24,-6 -8,-2 Z"
            fill="#F7C9B6"
          />
          {/* Cabeza */}
          <circle cx="-6" cy="-20" r="17" fill="#FBDCCB" />
          {/* Bracito */}
          <path
            d="M 6,-6 C 16,-2 18,8 10,12"
            stroke="#F7C9B6"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
}
