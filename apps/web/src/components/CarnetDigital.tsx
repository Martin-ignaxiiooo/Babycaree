import { useState, useRef } from "react";
import { X, RotateCw, Download, Droplet, Phone, AlertCircle, User } from "lucide-react";

interface CarnetDigitalProps {
  perfil: any;
  onClose: () => void;
}

// Colores fijos (no usan var(--theme-*)) porque el carnet se dibuja también
// en un <canvas> para exportarlo como PNG, y el canvas no puede leer
// variables CSS — así frente/dorso y la imagen exportada quedan idénticos.
const COLOR_PRIMARY = "#7C5CBF";
const COLOR_DARKER = "#2D2640";

function calcularEdad(fechaNacimiento: string): string {
  if (!fechaNacimiento) return "-";
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();
  let años = hoy.getFullYear() - nacimiento.getFullYear();
  let meses = hoy.getMonth() - nacimiento.getMonth();
  if (hoy.getDate() < nacimiento.getDate()) meses--;
  if (meses < 0) { años--; meses += 12; }
  if (años > 0) return `${años} año${años !== 1 ? "s" : ""} ${meses} mes${meses !== 1 ? "es" : ""}`;
  return `${meses} mes${meses !== 1 ? "es" : ""}`;
}

function formatFecha(fecha: string): string {
  if (!fecha) return "-";
  const d = new Date(fecha);
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function CarnetDigital({ perfil, onClose }: CarnetDigitalProps) {
  const [volteado, setVolteado] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const edad = calcularEdad(perfil.fecha_nacimiento);
  const nombreCompleto = perfil.apodo ? `${perfil.nombre} "${perfil.apodo}"` : perfil.nombre;

  // Dibuja el lado visible actualmente (frente o dorso) en un canvas y lo
  // descarga como PNG. Dibujar a mano en vez de usar una librería tipo
  // html2canvas evita agregar una dependencia pesada solo para esto.
  const descargarComoPNG = async () => {
    setDescargando(true);
    try {
      const W = 900, H = 560, R = 32;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      };

      // Fondo con degradado morado
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, COLOR_DARKER);
      grad.addColorStop(1, COLOR_PRIMARY);
      roundRect(0, 0, W, H, R);
      ctx.fillStyle = grad;
      ctx.fill();

      // Encabezado
      ctx.fillStyle = "#fff";
      ctx.font = "900 30px 'Nunito', sans-serif";
      ctx.fillText("Baby Care", 48, 64);
      ctx.font = "700 15px 'Nunito', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(volteado ? "Carnet Pediátrico Digital · Datos clínicos" : "Carnet Pediátrico Digital", 48, 88);

      if (!volteado) {
        // ── FRENTE ──
        const drawFrontBody = () => {
          ctx.fillStyle = "#fff";
          ctx.font = "900 40px 'Nunito', sans-serif";
          ctx.fillText(nombreCompleto, 48, 220);

          ctx.font = "700 20px 'Nunito', sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fillText(edad, 48, 254);

          const filas = [
            ["Fecha de nacimiento", formatFecha(perfil.fecha_nacimiento)],
            ["RUT", perfil.rut || "No registrado"],
            ["Tipo de sangre", perfil.tipo_sangre || "No registrado"],
            ["Previsión", perfil.nombre_prevision || perfil.prevision_salud || "No registrada"],
          ];
          let y = 320;
          filas.forEach(([label, val]) => {
            ctx.font = "700 13px 'Nunito', sans-serif";
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.fillText(label.toUpperCase(), 48, y);
            ctx.font = "800 22px 'Nunito', sans-serif";
            ctx.fillStyle = "#fff";
            ctx.fillText(String(val), 48, y + 28);
            y += 68;
          });

          ctx.font = "700 12px 'Nunito', sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          ctx.fillText("Generado en Baby Care · " + new Date().toLocaleDateString("es-CL"), 48, H - 32);

          const a = document.createElement("a");
          a.download = `carnet-${perfil.nombre.replace(/\s+/g, "-").toLowerCase()}.png`;
          a.href = canvas.toDataURL("image/png");
          a.click();
          setDescargando(false);
        };

        if (perfil.foto_perfil) {
          const img = new Image();
          img.onload = () => {
            const size = 140, cx = W - 210, cy = 100;
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx + size / 2, cy + size / 2, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, cx, cy, size, size);
            ctx.restore();
            drawFrontBody();
          };
          img.onerror = drawFrontBody;
          img.src = perfil.foto_perfil;
        } else {
          drawFrontBody();
        }
      } else {
        // ── DORSO ──
        const filas = [
          ["Alergias conocidas", perfil.alergias || "Ninguna registrada"],
          ["Condiciones crónicas", perfil.condiciones_cronicas || "Ninguna registrada"],
          ["Pediatra de cabecera", perfil.pediatra_nombre || "No registrado"],
          ["Centro de salud", perfil.centro_salud || "No registrado"],
          ["Contacto de emergencia", perfil.contacto_emergencia_nombre
            ? `${perfil.contacto_emergencia_nombre}${perfil.contacto_emergencia_telefono ? " · " + perfil.contacto_emergencia_telefono : ""}`
            : "No registrado"],
        ];
        let y = 150;
        filas.forEach(([label, val]) => {
          ctx.font = "700 13px 'Nunito', sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.fillText(label.toUpperCase(), 48, y);
          ctx.font = "800 19px 'Nunito', sans-serif";
          ctx.fillStyle = "#fff";
          wrapText(ctx, String(val), 48, y + 26, W - 96, 24);
          y += 84;
        });

        ctx.font = "700 12px 'Nunito', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillText("Generado en Baby Care · " + new Date().toLocaleDateString("es-CL"), 48, H - 32);

        const a = document.createElement("a");
        a.download = `carnet-${perfil.nombre.replace(/\s+/g, "-").toLowerCase()}-dorso.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
        setDescargando(false);
      }
    } catch (err) {
      console.error(err);
      setDescargando(false);
    }
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(" ");
    let line = "";
    let curY = y;
    for (const word of words) {
      const testLine = line + word + " ";
      if (ctx.measureText(testLine).width > maxWidth && line !== "") {
        ctx.fillText(line, x, curY);
        line = word + " ";
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, curY);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(45,38,64,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "20px",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ color: "#fff", fontSize: "18px", fontWeight: 800, margin: 0 }}>Carnet Digital</h3>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <X size={18} color="#fff" />
          </button>
        </div>

        {/* Carnet con perspectiva 3D para el volteo */}
        <div style={{ perspective: "1500px" }}>
          <div
            ref={cardRef}
            onClick={() => setVolteado(!volteado)}
            style={{
              position: "relative", width: "100%", aspectRatio: "900 / 560",
              transformStyle: "preserve-3d", transition: "transform 0.6s",
              transform: volteado ? "rotateY(180deg)" : "rotateY(0deg)",
              cursor: "pointer",
            }}
          >
            {/* FRENTE */}
            <div style={{
              position: "absolute", inset: 0, backfaceVisibility: "hidden",
              borderRadius: "20px", padding: "28px",
              background: `linear-gradient(135deg, ${COLOR_DARKER}, ${COLOR_PRIMARY})`,
              boxShadow: "0 20px 50px rgba(45,38,64,0.4)",
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(14px, 4vw, 20px)" }}>Baby Care</div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: "clamp(9px, 2.2vw, 11px)" }}>Carnet Pediátrico Digital</div>
                </div>
                {perfil.foto_perfil ? (
                  <img src={perfil.foto_perfil} alt={perfil.nombre} style={{ width: "clamp(50px, 15vw, 72px)", height: "clamp(50px, 15vw, 72px)", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.5)" }} />
                ) : (
                  <div style={{ width: "clamp(50px, 15vw, 72px)", height: "clamp(50px, 15vw, 72px)", borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={28} color="rgba(255,255,255,0.6)" />
                  </div>
                )}
              </div>

              <div style={{ marginTop: "clamp(8px, 3vw, 20px)" }}>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(18px, 5.5vw, 28px)", lineHeight: 1.1 }}>{nombreCompleto}</div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: "clamp(11px, 3vw, 14px)", marginTop: "2px" }}>{edad}</div>
              </div>

              <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(8px,2.5vw,16px)" }}>
                <CampoCarnet label="Fecha de nacimiento" valor={formatFecha(perfil.fecha_nacimiento)} />
                <CampoCarnet label="RUT" valor={perfil.rut || "No registrado"} />
                <CampoCarnet label="Tipo de sangre" valor={perfil.tipo_sangre || "No registrado"} />
                <CampoCarnet label="Previsión" valor={perfil.nombre_prevision || perfil.prevision_salud || "No registrada"} />
              </div>
            </div>

            {/* DORSO */}
            <div style={{
              position: "absolute", inset: 0, backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: "20px", padding: "28px",
              background: `linear-gradient(135deg, ${COLOR_DARKER}, ${COLOR_PRIMARY})`,
              boxShadow: "0 20px 50px rgba(45,38,64,0.4)",
              display: "flex", flexDirection: "column", gap: "clamp(8px,2.5vw,14px)",
              overflow: "hidden",
            }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(14px, 4vw, 18px)" }}>Datos clínicos</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: "clamp(9px, 2.2vw, 11px)" }}>Para uso del equipo de salud</div>
              </div>

              <CampoCarnetIcon icon={<AlertCircle size={14} color="#fff" />} label="Alergias conocidas" valor={perfil.alergias || "Ninguna registrada"} />
              <CampoCarnetIcon icon={<Droplet size={14} color="#fff" />} label="Condiciones crónicas" valor={perfil.condiciones_cronicas || "Ninguna registrada"} />
              <CampoCarnetIcon icon={<User size={14} color="#fff" />} label="Pediatra / Centro de salud" valor={[perfil.pediatra_nombre, perfil.centro_salud].filter(Boolean).join(" · ") || "No registrado"} />
              <CampoCarnetIcon icon={<Phone size={14} color="#fff" />} label="Contacto de emergencia" valor={perfil.contacto_emergencia_nombre ? `${perfil.contacto_emergencia_nombre}${perfil.contacto_emergencia_telefono ? " · " + perfil.contacto_emergencia_telefono : ""}` : "No registrado"} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
          <button
            onClick={() => setVolteado(!volteado)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "14px", padding: "14px", fontWeight: 800, fontSize: "14px", cursor: "pointer",
            }}
          >
            <RotateCw size={16} /> Voltear
          </button>
          <button
            onClick={descargarComoPNG}
            disabled={descargando}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              background: "var(--surface)", color: COLOR_PRIMARY, border: "none",
              borderRadius: "14px", padding: "14px", fontWeight: 800, fontSize: "14px",
              cursor: descargando ? "wait" : "pointer", opacity: descargando ? 0.7 : 1,
            }}
          >
            <Download size={16} /> {descargando ? "Generando..." : "Descargar imagen"}
          </button>
        </div>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "11px", textAlign: "center", marginTop: "10px" }}>
          Toca la tarjeta para ver el dorso · La descarga guarda el lado que estás viendo
        </p>
      </div>
    </div>
  );
}

function CampoCarnet({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <div style={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "clamp(8px, 2vw, 10px)", textTransform: "uppercase", letterSpacing: "0.02em" }}>{label}</div>
      <div style={{ color: "#fff", fontWeight: 800, fontSize: "clamp(11px, 3vw, 15px)", marginTop: "2px" }}>{valor}</div>
    </div>
  );
}

function CampoCarnetIcon({ icon, label, valor }: { icon: React.ReactNode; label: string; valor: string }) {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
      <div style={{ marginTop: "2px", flexShrink: 0, opacity: 0.8 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: "clamp(8px, 2vw, 10px)", textTransform: "uppercase" }}>{label}</div>
        <div style={{
          color: "#fff", fontWeight: 700, fontSize: "clamp(10px, 2.6vw, 13px)", marginTop: "1px",
          overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
        }}>{valor}</div>
      </div>
    </div>
  );
}
