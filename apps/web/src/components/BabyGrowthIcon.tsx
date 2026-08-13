import mes1 from "../assets/baby/mes_1.png";
import mes2 from "../assets/baby/mes_2.png";
import mes3 from "../assets/baby/mes_3.png";
import mes4 from "../assets/baby/mes_4.png";
import mes5 from "../assets/baby/mes_5.png";
import mes6 from "../assets/baby/mes_6.png";
import mes7 from "../assets/baby/mes_7.png";
import mes8 from "../assets/baby/mes_8.png";
import mes9 from "../assets/baby/mes_9.png";

const IMAGENES_POR_MES: Record<number, string> = {
  1: mes1, 2: mes2, 3: mes3, 4: mes4, 5: mes5,
  6: mes6, 7: mes7, 8: mes8, 9: mes9,
};

export const HITOS_POR_MES: Record<number, string> = {
  1: "Tu bebé es apenas un embrión pequeño",
  2: "Se están formando los órganos principales.",
  3: "¡Ya es un feto! Empieza a moverse suavemente",
  4: "Tu bebé ya puede gesticular y succionar",
  5: "¡Mitad de camino! El bebé ya tiene pelo y cejas",
  6: "La piel es traslúcida y los pulmones se desarrollan",
  7: "El bebé ya abre los ojos y percibe la luz",
  8: "Ganando peso rápidamente para el nacimiento",
  9: "¡Casi listo para conocerte! El desarrollo está completo",
};

export const ETIQUETA_POR_MES: Record<number, string> = {
  1: "Embrión",
  2: "Desarrollo",
  3: "Feto",
  4: "Gesticulación",
  5: "Crecimiento",
  6: "Pulmones",
  7: "Sentidos",
  8: "Peso",
  9: "Final",
};

export const SEMANA_RANGO_POR_MES: Record<number, string> = {
  1: "Semana 4", 2: "Semana 8", 3: "Semana 12", 4: "Semana 16",
  5: "Semana 20", 6: "Semana 24", 7: "Semana 28", 8: "Semana 32",
  9: "Semana 36-40",
};

/** Calcula el mes de embarazo (1 a 9) a partir de la semana */
export function mesDesdeSemanas(semanas: number): number {
  if (semanas <= 4) return 1;
  if (semanas <= 8) return 2;
  if (semanas <= 12) return 3;
  if (semanas <= 16) return 4;
  if (semanas <= 20) return 5;
  if (semanas <= 24) return 6;
  if (semanas <= 28) return 7;
  if (semanas <= 32) return 8;
  return 9;
}

interface BabyGrowthIconProps {
  /** Semana de embarazo (1 a 40) */
  semanas: number;
  /** 0 a 100, porcentaje de las 40 semanas (usado para el tamaño) */
  porcentaje: number;
}

/**
 * Muestra la ilustración real del bebé (hecha en Stitch por el dueño del
 * proyecto, 9 imágenes, una por mes de embarazo) correspondiente al mes
 * actual. El tamaño del contenedor escala según el porcentaje de las 40
 * semanas, para que la imagen represente qué tan grande está el bebé.
 */
export default function BabyGrowthIcon({ semanas, porcentaje }: BabyGrowthIconProps) {
  const clamped = Math.max(0, Math.min(100, porcentaje));
  const t = clamped / 100;
  const size = 118 + (168 - 118) * t;
  const mes = mesDesdeSemanas(semanas);

  return (
    <div
      style={{
        width: "168px",
        height: "168px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={IMAGENES_POR_MES[mes]}
        alt={`Ilustración del bebé en el mes ${mes} de embarazo`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          objectFit: "cover",
          transition: "width 0.4s ease, height 0.4s ease",
        }}
      />
    </div>
  );
}
