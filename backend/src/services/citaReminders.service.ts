import { query } from "../config/db";
import { sendAppointmentReminder, sendPostAppointmentFollowUp, sendExamReminder } from "../config/mailer";
import { enviarPush } from "./push.service";

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
          `SELECT u.id, u.email, u.nombre FROM usuarios u WHERE u.id = $1
           UNION
           SELECT u.id, u.email, u.nombre
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

          // El push va además del correo, no en su lugar: no todos aceptan
          // el permiso, y en iOS solo llega si instalaron la PWA. Si falla,
          // el correo ya salió.
          enviarPush(destinatario.id, {
            titulo: `${cita.bebe_nombre}: ${cita.especialidad || "control médico"}`,
            cuerpo: `Es ${ventana.etiqueta}${cita.medico ? ` con ${cita.medico}` : ""}.`,
            url: "/salud",
            tag: `cita-${cita.id}`,
          }).catch(() => {});
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

/**
 * Seguimiento post-cita: unas horas después de la hora agendada, pregunta
 * cómo resultó.
 *
 * La ventana empieza a las 3 horas (para no escribir mientras la madre
 * todavía está en la consulta) y termina a los 3 días (si el cron estuvo
 * caído más tiempo que eso, ya no tiene sentido preguntar por algo tan
 * viejo, y es preferible no enviar a enviar tarde).
 *
 * Solo se envía para citas que siguen en estado 'programada': si la madre
 * ya la marcó como completada o cancelada, no hace falta preguntarle.
 */
export async function revisarYEnviarSeguimientos(): Promise<void> {
  try {
    const citasRes = await query(
      `SELECT c.id, c.especialidad, c.medico, c.lugar, c.fecha_cita, c.tipo,
              b.id as bebe_id, b.nombre as bebe_nombre, b.usuario_id
       FROM citas_medicas c
       JOIN perfiles_bebes b ON c.bebe_id = b.id
       WHERE c.estado = 'programada'
         AND c.seguimiento_enviado = FALSE
         AND c.fecha_cita <= NOW() - INTERVAL '3 hours'
         AND c.fecha_cita >  NOW() - INTERVAL '3 days'`,
    );

    for (const cita of citasRes.rows) {
      // Mismos destinatarios que los recordatorios: quien administra la
      // cuenta y los familiares que pidieron recibir notificaciones.
      const destinatariosRes = await query(
        `SELECT u.id, u.email, u.nombre FROM usuarios u WHERE u.id = $1
         UNION
         SELECT u.id, u.email, u.nombre
         FROM accesos_compartidos_bebe acb
         JOIN usuarios u ON u.id = acb.id_usuario_invitado
         WHERE acb.id_perfil_bebe = $2 AND acb.estado = 'activo' AND acb.recibir_notificaciones = TRUE`,
        [cita.usuario_id, cita.bebe_id],
      );

      for (const destinatario of destinatariosRes.rows) {
        try {
          await sendPostAppointmentFollowUp(
            destinatario.email,
            destinatario.nombre,
            cita.bebe_nombre,
            {
              especialidad: cita.especialidad,
              medico: cita.medico,
              lugar: cita.lugar,
              fecha_cita: cita.fecha_cita,
              tipo: cita.tipo,
            },
          );
        } catch (emailError) {
          console.error(`[seguimiento] Error enviando a ${destinatario.email}:`, emailError);
        }

        enviarPush(destinatario.id, {
          titulo: `¿Cómo le fue a ${cita.bebe_nombre}?`,
          cuerpo: "Registra el peso, el diagnóstico y la receta de la consulta.",
          url: "/salud",
          tag: `seguimiento-${cita.id}`,
        }).catch(() => {});
      }

      // Se marca aunque algún correo haya fallado: reintentar en la próxima
      // pasada spamearía a quienes sí lo recibieron.
      await query(
        `UPDATE citas_medicas SET seguimiento_enviado = TRUE WHERE id = $1`,
        [cita.id],
      );
    }

    if (citasRes.rows.length > 0) {
      console.log(`[seguimiento] Enviados ${citasRes.rows.length} seguimiento(s) post-cita`);
    }
  } catch (error) {
    console.error("[seguimiento] Error revisando seguimientos post-cita:", error);
  }
}

/**
 * Recordatorio de exámenes pendientes.
 *
 * Se envía cuando pasó la fecha sugerida y el examen sigue en 'pendiente'.
 * Se espera un día completo después de la fecha para no escribir el mismo
 * día en que quizá se lo están haciendo, y se deja de insistir a los 30
 * días: si no se hizo en un mes, un correo más no va a ayudar y solo molesta.
 *
 * Los exámenes sin fecha sugerida no generan recordatorio: no hay forma de
 * saber cuándo correspondía hacerlo.
 */
export async function revisarYEnviarRecordatoriosExamenes(): Promise<void> {
  try {
    const examenesRes = await query(
      `SELECT e.id, e.nombre, e.indicaciones, e.fecha_sugerida,
              b.id AS bebe_id, b.nombre AS bebe_nombre, b.usuario_id
       FROM examenes_medicos e
       JOIN perfiles_bebes b ON b.id = e.bebe_id
       WHERE e.estado = 'pendiente'
         AND e.recordatorio_enviado = FALSE
         AND e.fecha_sugerida IS NOT NULL
         AND e.fecha_sugerida <  CURRENT_DATE
         AND e.fecha_sugerida >= CURRENT_DATE - INTERVAL '30 days'`,
    );

    for (const examen of examenesRes.rows) {
      const destinatariosRes = await query(
        `SELECT u.id, u.email, u.nombre FROM usuarios u WHERE u.id = $1
         UNION
         SELECT u.id, u.email, u.nombre
         FROM accesos_compartidos_bebe acb
         JOIN usuarios u ON u.id = acb.id_usuario_invitado
         WHERE acb.id_perfil_bebe = $2 AND acb.estado = 'activo' AND acb.recibir_notificaciones = TRUE`,
        [examen.usuario_id, examen.bebe_id],
      );

      for (const destinatario of destinatariosRes.rows) {
        try {
          await sendExamReminder(
            destinatario.email,
            destinatario.nombre,
            examen.bebe_nombre,
            {
              nombre: examen.nombre,
              indicaciones: examen.indicaciones,
              fecha_sugerida: examen.fecha_sugerida,
            },
          );
        } catch (emailError) {
          console.error(`[examenes] Error enviando a ${destinatario.email}:`, emailError);
        }

        enviarPush(destinatario.id, {
          titulo: `Examen pendiente de ${examen.bebe_nombre}`,
          cuerpo: `${examen.nombre}: si ya se lo hicieron, márcalo como realizado.`,
          url: "/salud",
          tag: `examen-${examen.id}`,
        }).catch(() => {});
      }

      await query(
        `UPDATE examenes_medicos SET recordatorio_enviado = TRUE WHERE id = $1`,
        [examen.id],
      );
    }

    if (examenesRes.rows.length > 0) {
      console.log(`[examenes] Enviados ${examenesRes.rows.length} recordatorio(s) de examen`);
    }
  } catch (error) {
    console.error("[examenes] Error revisando recordatorios de exámenes:", error);
  }
}
