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
        <g transform="translate(50,54)">
          {/* Cuerpo curvado en posición fetal, superpuesto con la cabeza
              usando el MISMO color para que se lea como una sola silueta
              continua en vez de dos círculos separados */}
          <path
            d="M -6,-10
               C 18,-16 30,4 24,22
               C 19,36 -4,40 -18,30
               C -30,20 -24,-4 -6,-10 Z"
            fill="#F6C7AF"
          />
          {/* Cabeza, mismo color, bien superpuesta al cuerpo */}
          <circle cx="-4" cy="-22" r="18" fill="#F6C7AF" />
          {/* Mejilla / sombra suave para dar volumen sin romper la silueta */}
          <ellipse cx="4" cy="-16" rx="10" ry="8" fill="#F0AF8F" opacity="0.35" />
        </g>
      </svg>
    </div>
  );
}
