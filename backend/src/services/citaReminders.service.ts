import { query } from "../config/db";
import { sendAppointmentReminder } from "../config/mailer";

// Cada "ventana" define cuándo se dispara un recordatorio, en base a cuánto
// falta para la cita. Al no superponerse, un cron corriendo cada cierto
// tiempo dispara cada recordatorio una sola vez por cita (el flag en la BD
// evita reenvíos si el job corre varias veces dentro de la misma ventana).
const VENTANAS = [
  { columna: "recordatorio_7d_enviado", desde: "1 day", hasta: "7 days", etiqueta: "1 semana" },
  { columna: "recordatorio_1d_enviado", desde: "2 hours", hasta: "1 day", etiqueta: "1 día" },
  { columna: "recordatorio_2h_enviado", desde: "0 minutes", hasta: "2 hours", etiqueta: "2 horas" },
] as const;

// Revisa las 3 ventanas y envía los correos correspondientes. Se llama desde
// un cron job (ver index.ts) cada cierto tiempo mientras el servidor esté
// corriendo — no depende de infraestructura externa de Render.
export async function revisarYEnviarRecordatorios(): Promise<void> {
  for (const ventana of VENTANAS) {
    try {
      // Nota: ventana.columna se interpola directo porque es un nombre de
      // columna fijo definido en VENTANAS (arriba, en este mismo archivo),
      // nunca proviene de datos externos/usuario — Postgres no permite
      // parametrizar nombres de columna. Los intervalos sí van parametrizados.
      const citasRes = await query(
        `SELECT c.id, c.especialidad, c.medico, c.lugar, c.fecha_cita,
                b.id as bebe_id, b.nombre as bebe_nombre, b.usuario_id
         FROM citas_medicas c
         JOIN perfiles_bebes b ON c.bebe_id = b.id
         WHERE c.estado = 'programada'
           AND c.${ventana.columna} = FALSE
           AND c.fecha_cita > NOW() + $1::interval
           AND c.fecha_cita <= NOW() + $2::interval`,
        [ventana.desde, ventana.hasta],
      );

      for (const cita of citasRes.rows) {
        // Destinatarios: el dueño de la cuenta + familiares con acceso
        // compartido que hayan activado "recibir_notificaciones"
        const destinatariosRes = await query(
          `SELECT u.email, u.nombre FROM usuarios u WHERE u.id = $1
           UNION
           SELECT u.email, u.nombre
           FROM accesos_compartidos_bebe acb
           JOIN usuarios u ON u.id = acb.id_usuario_invitado
           WHERE acb.id_perfil_bebe = $2 AND acb.estado = 'activo' AND acb.recibir_notificaciones = TRUE`,
          [cita.usuario_id, cita.bebe_id],
        );

        for (const destinatario of destinatariosRes.rows) {
          try {
            await sendAppointmentReminder(
              destinatario.email,
              destinatario.nombre,
              cita.bebe_nombre,
              { especialidad: cita.especialidad, medico: cita.medico, lugar: cita.lugar, fecha_cita: cita.fecha_cita },
              ventana.etiqueta,
            );
          } catch (emailError) {
            console.error(`[recordatorios] Error enviando a ${destinatario.email}:`, emailError);
          }
        }

        await query(
          `UPDATE citas_medicas SET ${ventana.columna} = TRUE WHERE id = $1`,
          [cita.id],
        );
      }

      if (citasRes.rows.length > 0) {
        console.log(`[recordatorios] Enviados ${citasRes.rows.length} recordatorio(s) de "${ventana.etiqueta}"`);
      }
    } catch (error) {
      console.error(`[recordatorios] Error revisando ventana "${ventana.etiqueta}":`, error);
    }
  }
}
