import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  notif: any;
  onClose: () => void;
}

/**
 * Popup de detalle de una notificación (cita próxima, vacuna atrasada/
 * próxima, etc.). Se usa tanto desde el bloque "Lo que se viene" del
 * Dashboard como desde el dropdown de la campanita en TopNav, para que
 * hacer clic en cualquier notificación muestre el mismo detalle sin
 * duplicar este marcado en los dos lugares.
 */
export default function NotificacionDetalleModal({ notif, onClose }: Props) {
  const navigate = useNavigate();
  if (!notif) return null;

  const d = notif.detalle;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(45,38,64,0.55)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)", borderRadius: "24px", width: "100%", maxWidth: "420px",
          overflow: "hidden", fontFamily: "'Nunito', sans-serif",
        }}
      >
        <div style={{
          background: "linear-gradient(135deg, var(--theme-primary), var(--theme-light))",
          padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h3 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: "19px", color: "#fff", margin: 0 }}>
            {notif.titulo}
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: "rgba(255,255,255,0.22)", border: "none", borderRadius: "50%",
              width: "28px", height: "28px", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "#fff", flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "22px 24px" }}>
          {(() => {
            if (d?.fecha_cita) {
              const f = new Date(d.fecha_cita);
              const filas: [string, string][] = [
                ["Fecha", f.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })],
                ["Hora", f.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })],
                ["Tipo", d.es_control ? "Control sano" : "Cita médica"],
              ];
              if (d.especialidad) filas.push(["Especialidad", d.especialidad]);
              if (d.medico) filas.push(["Médico", d.medico]);
              if (d.lugar) filas.push(["Lugar", d.lugar]);
              if (d.notas) filas.push(["Notas", d.notas]);
              return (
                <>
                  {filas.map(([k, v]) => (
                    <div key={k} style={{ display: "flex", gap: "12px", padding: "9px 0", borderBottom: "1px solid #F5F2FC" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 800, color: "var(--text-muted)", minWidth: "92px", textTransform: "uppercase", letterSpacing: "0.3px" }}>{k}</span>
                      <span style={{ fontSize: "14px", color: "var(--text)", fontWeight: 600, textTransform: k === "Fecha" ? "capitalize" : "none" }}>{v}</span>
                    </div>
                  ))}
                </>
              );
            }

            if (d?.es_vacuna) {
              const semanas = d.meses_edad_recomendada != null
                ? Math.round(d.meses_edad_recomendada * 4.345)
                : null;
              const filas: [string, string][] = [["Vacuna", d.nombre]];
              if (d.meses_edad_recomendada != null) {
                filas.push([
                  "Edad",
                  d.meses_edad_recomendada === 0
                    ? "Al nacer"
                    : `${semanas} semanas (${d.meses_edad_recomendada} ${d.meses_edad_recomendada === 1 ? "mes" : "meses"})`,
                ]);
              }
              if (d.previene) filas.push(["Previene", d.previene]);
              if (d.fecha_programada) {
                filas.push(["Programada", new Date(d.fecha_programada).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })]);
              }
              return (
                <>
                  {filas.map(([k, v]) => (
                    <div key={k} style={{ display: "flex", gap: "12px", padding: "9px 0", borderBottom: "1px solid #F5F2FC" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 800, color: "var(--text-muted)", minWidth: "92px", textTransform: "uppercase", letterSpacing: "0.3px" }}>{k}</span>
                      <span style={{ fontSize: "14px", color: "var(--text)", fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </>
              );
            }

            return (
              <p style={{ fontSize: "14px", color: "#6B647F", lineHeight: 1.6, margin: 0 }}>
                {notif.mensaje}
              </p>
            );
          })()}

          <button
            onClick={() => { onClose(); navigate("/salud"); }}
            style={{
              width: "100%", marginTop: "20px", padding: "13px", borderRadius: "100px",
              border: "none", background: "var(--theme-primary)", color: "#fff",
              fontWeight: 800, fontSize: "14px", cursor: "pointer", fontFamily: "'Nunito', sans-serif",
            }}
          >
            Ir a Salud
          </button>
        </div>
      </div>
    </div>
  );
}
