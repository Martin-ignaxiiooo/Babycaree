import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Lineas, duracion } from "./EstadisticasDiario";

import { API_URL } from "../config/api";

/**
 * Versión compacta de los gráficos de Patrones del Diario, para el
 * Dashboard: siempre muestra los últimos 7 días, sin selector (a
 * diferencia de la versión completa en /diario, que permite elegir
 * 7/14/30 días). Reutiliza el mismo componente Lineas para no duplicar
 * la lógica de dibujo del gráfico.
 */
export default function DiarioResumenMini({ bebeId, token, refreshKey }: { bebeId: string; token: string; refreshKey?: number }) {
  const [datos, setDatos] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v1/diario/${bebeId}/registros/estadisticas?dias=7`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setDatos(await res.json());
    } catch {
      // Si falla, simplemente no se muestran los gráficos: no es
      // suficientemente crítico como para mostrar un error en el home.
    } finally {
      setCargando(false);
    }
  }, [bebeId, token]);

  // refreshKey cambia cada vez que se registra algo desde Accesos
  // Rápidos, para que estos gráficos se actualicen sin recargar la
  // página (tienen su propio fetch, aparte del del Dashboard).
  useEffect(() => { cargar(); }, [cargar, refreshKey]);

  if (cargando) {
    return <div style={{ textAlign: "center", padding: "30px" }}><Loader2 size={22} className="spin-icon" color="var(--theme-primary)" /></div>;
  }

  if (!datos || !datos.por_dia || datos.por_dia.length === 0) {
    return (
      <p style={{ fontSize: "13.5px", color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
        Todavía no hay registros esta semana.
      </p>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text)", marginBottom: "4px" }}>Alimentación</div>
        <Lineas datos={datos.por_dia} campo="tomas" color="#64B5F6" formato={(v: number) => `${v} tomas`} />
      </div>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text)", marginBottom: "4px" }}>Sueño</div>
        <Lineas datos={datos.por_dia} campo="sueno_min" color="#A07ADF" formato={duracion} />
      </div>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text)", marginBottom: "4px" }}>Cambio de pañales</div>
        <Lineas datos={datos.por_dia} campo="panales" color="#F7C873" formato={(v: number) => `${v} pañales`} />
      </div>
    </div>
  );
}
