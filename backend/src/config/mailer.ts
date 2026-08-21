import dotenv from "dotenv";

dotenv.config();

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const SENDER_EMAIL = process.env.SMTP_FROM_EMAIL || "babyyycareee@gmail.com";
const SENDER_NAME = "Baby Care";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  const data = await response.json() as any;

  if (!response.ok) {
    throw new Error(`Brevo API error ${response.status}: ${JSON.stringify(data)}`);
  }

  console.log(`[Brevo] Email sent to ${to} | messageId: ${data.messageId}`);
}

export const sendRecoveryCode = async (
  email: string,
  codigo: string,
  nombre: string,
): Promise<void> => {
  await sendEmail(
    email,
    "Tu código de recuperación — Baby Care",
    `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f9fc; border-radius: 16px; overflow: hidden;">
        <div style="background: #1B3A6B; padding: 32px 40px; text-align: center;">
          <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 900; letter-spacing: -0.5px;">Baby<span style="color: #7FC8F8;">Care</span></h1>
          <p style="color: rgba(255,255,255,0.65); font-size: 13px; margin: 6px 0 0;">Recuperación de contraseña</p>
        </div>
        <div style="padding: 40px;">
          <p style="color: #374151; font-size: 15px; margin-bottom: 8px;">Hola <strong>${nombre}</strong>,</p>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-bottom: 28px;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa el siguiente código de verificación:
          </p>
          <div style="background: #EEF4FA; border-radius: 14px; padding: 28px; text-align: center; margin-bottom: 28px;">
            <div style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #1B3A6B; font-family: monospace;">${codigo}</div>
            <p style="color: #6B7280; font-size: 12px; margin: 12px 0 0;">⏱️ Este código expira en <strong>10 minutos</strong></p>
          </div>
          <p style="color: #9CA3AF; font-size: 12px; line-height: 1.6;">
            Si no solicitaste este código, puedes ignorar este correo. Tu contraseña no cambiará.<br><br>
            Por seguridad, este código es de un solo uso y nunca te lo pediremos por teléfono.
          </p>
        </div>
        <div style="background: #F3F4F6; padding: 16px 40px; text-align: center;">
          <p style="color: #9CA3AF; font-size: 11px; margin: 0;">Baby Care · Cumple con Ley 19.628 y Ley 21.719</p>
        </div>
      </div>
    `
  );
};

export const sendPasswordChangedAlert = async (
  email: string,
  nombre: string,
): Promise<void> => {
  await sendEmail(
    email,
    "Tu contraseña fue cambiada — Baby Care",
    `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f9fc; border-radius: 16px; overflow: hidden;">
        <div style="background: #1B3A6B; padding: 32px 40px; text-align: center;">
          <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 900;">Baby<span style="color: #7FC8F8;">Care</span></h1>
        </div>
        <div style="padding: 40px;">
          <div style="text-align: center; margin-bottom: 24px; font-size: 40px;">🔐</div>
          <p style="color: #374151; font-size: 15px; margin-bottom: 8px;">Hola <strong>${nombre}</strong>,</p>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Tu contraseña fue cambiada exitosamente. Por seguridad, cerramos todas las sesiones activas en otros dispositivos.
          </p>
          <div style="background: #DCFCE7; border-left: 4px solid #16A34A; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
            <p style="color: #166534; font-size: 13px; margin: 0; font-weight: 600;">✅ Contraseña actualizada correctamente</p>
          </div>
          <p style="color: #9CA3AF; font-size: 12px; line-height: 1.6;">
            Si <strong>no realizaste este cambio</strong>, contacta inmediatamente a soporte@iniciativababy.cl
          </p>
        </div>
      </div>
    `
  );
};

export const sendLoginBlockedAlert = async (
  email: string,
  nombre: string,
): Promise<void> => {
  await sendEmail(
    email,
    "Alerta de seguridad: múltiples intentos fallidos — Baby Care",
    `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f9fc; border-radius: 16px; overflow: hidden;">
        <div style="background: #1B3A6B; padding: 32px 40px; text-align: center;">
          <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 900;">Baby<span style="color: #7FC8F8;">Care</span></h1>
        </div>
        <div style="padding: 40px;">
          <div style="text-align: center; margin-bottom: 24px; font-size: 40px;">⚠️</div>
          <p style="color: #374151; font-size: 15px; margin-bottom: 8px;">Hola <strong>${nombre}</strong>,</p>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Detectamos 5 intentos fallidos de inicio de sesión en tu cuenta. Por tu seguridad, hemos bloqueado el acceso temporalmente por 15 minutos.
          </p>
          <div style="background: #FEE2E2; border-left: 4px solid #DC2626; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
            <p style="color: #991B1B; font-size: 13px; margin: 0; font-weight: 600;">🔒 Cuenta bloqueada por 15 minutos</p>
          </div>
          <p style="color: #9CA3AF; font-size: 12px; line-height: 1.6;">
            Si no fuiste tú, te recomendamos cambiar tu contraseña apenas puedas acceder.<br>
            Escríbenos a soporte@iniciativababy.cl si necesitas ayuda urgente.
          </p>
        </div>
      </div>
    `
  );
};

export const sendInvitationAlert = async (
  email: string,
  nombreFamiliar: string,
  nombreBebe: string,
): Promise<void> => {
  await sendEmail(
    email,
    `Has sido invitado a ver el perfil de ${nombreBebe} — Baby Care`,
    `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f9fc; border-radius: 16px; overflow: hidden;">
        <div style="background: #1B3A6B; padding: 32px 40px; text-align: center;">
          <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 900;">Baby<span style="color: #7FC8F8;">Care</span></h1>
        </div>
        <div style="padding: 40px;">
          <div style="text-align: center; margin-bottom: 24px; font-size: 40px;">💌</div>
          <p style="color: #374151; font-size: 15px; margin-bottom: 8px;">Hola,</p>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            <strong>${nombreFamiliar}</strong> te ha invitado a ver el perfil de su bebé <strong>${nombreBebe}</strong> en Baby Care.
          </p>
          <a href="https://babycaree-web.vercel.app/seleccionar-perfil" style="display: block; text-decoration: none;">
            <div style="background: #E0E7FF; border-left: 4px solid #4F46E5; border-radius: 10px; padding: 18px 20px; margin-bottom: 12px; text-align: center;">
              <p style="color: #3730A3; font-size: 14px; margin: 0; font-weight: 700;">👉 Ya tengo cuenta (Iniciar sesión)</p>
            </div>
          </a>
          <a href="https://babycaree-web.vercel.app/registro" style="display: block; text-decoration: none;">
            <div style="background: #F3E8FF; border-left: 4px solid #9333EA; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px; text-align: center;">
              <p style="color: #6B21A8; font-size: 14px; margin: 0; font-weight: 700;">✨ Crear una cuenta nueva</p>
            </div>
          </a>
          <p style="color: #9CA3AF; font-size: 12px;">Si no conoces a ${nombreFamiliar}, puedes ignorar este correo.</p>
        </div>
      </div>
    `
  );
};

// ─── RECORDATORIO DE CITA MÉDICA ────────────────────────────────────────────
// antelacion: texto legible para el asunto/cuerpo ("1 semana", "1 día", "2 horas")
export const sendAppointmentReminder = async (
  email: string,
  nombreDestinatario: string,
  nombreBebe: string,
  cita: {
    especialidad?: string | null;
    medico?: string | null;
    lugar?: string | null;
    fecha_cita: string | Date;
  },
  antelacion: string,
): Promise<void> => {
  const fecha = new Date(cita.fecha_cita);
  const fechaFormateada = fecha.toLocaleDateString("es-CL", {
    weekday: "long", day: "numeric", month: "long",
  });
  const horaFormateada = fecha.toLocaleTimeString("es-CL", {
    hour: "2-digit", minute: "2-digit",
  });
  const tituloCita = cita.especialidad || "Control médico";

  await sendEmail(
    email,
    `Recordatorio: cita de ${nombreBebe} en ${antelacion} — Baby Care`,
    `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f9fc; border-radius: 16px; overflow: hidden;">
        <div style="background: #1B3A6B; padding: 32px 40px; text-align: center;">
          <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 900;">Baby<span style="color: #7FC8F8;">Care</span></h1>
        </div>
        <div style="padding: 40px;">
          <div style="text-align: center; margin-bottom: 24px; font-size: 40px;">📅</div>
          <p style="color: #374151; font-size: 15px; margin-bottom: 8px;">Hola <strong>${nombreDestinatario}</strong>,</p>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Te recordamos que <strong>${nombreBebe}</strong> tiene una cita en <strong>${antelacion}</strong>:
          </p>
          <div style="background: #EEF4FA; border-radius: 14px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #1B3A6B; font-size: 17px; font-weight: 800; margin: 0 0 6px;">${tituloCita}</p>
            <p style="color: #374151; font-size: 14px; margin: 0 0 4px; text-transform: capitalize;">🗓️ ${fechaFormateada} · ${horaFormateada} hrs</p>
            ${cita.medico ? `<p style="color: #6B7280; font-size: 13px; margin: 4px 0 0;">👨‍⚕️ ${cita.medico}</p>` : ""}
            ${cita.lugar ? `<p style="color: #6B7280; font-size: 13px; margin: 4px 0 0;">📍 ${cita.lugar}</p>` : ""}
          </div>
          <p style="color: #9CA3AF; font-size: 12px; line-height: 1.6;">
            Puedes revisar o modificar esta cita desde la sección de Salud en la app.
          </p>
        </div>
      </div>
    `
  );
};

/**
 * Seguimiento posterior a una cita: se envía unas horas después de la hora
 * agendada para preguntar cómo resultó.
 *
 * El tono cambia según el tipo: un control sano es rutina y se pregunta por
 * medidas y próximos pasos; una cita puntual suele venir de una preocupación,
 * así que se pregunta primero por cómo está el bebé.
 */
export const sendPostAppointmentFollowUp = async (
  email: string,
  nombreDestinatario: string,
  nombreBebe: string,
  cita: {
    especialidad?: string | null;
    medico?: string | null;
    lugar?: string | null;
    fecha_cita: string | Date;
    tipo?: string | null;
  },
): Promise<void> => {
  const esControl = cita.tipo === "control";
  const fecha = new Date(cita.fecha_cita);
  const fechaFormateada = fecha.toLocaleDateString("es-CL", {
    weekday: "long", day: "numeric", month: "long",
  });
  const tituloCita = cita.especialidad || (esControl ? "Control sano" : "Cita médica");

  const introduccion = esControl
    ? `Esperamos que el control de <strong>${nombreBebe}</strong> haya salido bien. Si te entregaron nuevas medidas de peso o talla, puedes registrarlas en la app para seguir su curva de crecimiento.`
    : `Esperamos que <strong>${nombreBebe}</strong> se encuentre mejor. Si el médico dejó indicaciones o un tratamiento, puedes anotarlo en la app para no perderlo de vista.`;

  const sugerencia = esControl
    ? "Anota el peso y la talla del control"
    : "Anota las indicaciones del médico";

  await sendEmail(
    email,
    `¿Cómo le fue a ${nombreBebe} en su ${esControl ? "control" : "cita"}? — Baby Care`,
    `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f9fc; border-radius: 16px; overflow: hidden;">
        <div style="background: #1B3A6B; padding: 32px 40px; text-align: center;">
          <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 900;">Baby<span style="color: #7FC8F8;">Care</span></h1>
        </div>
        <div style="padding: 40px;">
          <div style="text-align: center; margin-bottom: 24px; font-size: 40px;">${esControl ? "🩺" : "💙"}</div>
          <p style="color: #374151; font-size: 15px; margin-bottom: 8px;">Hola <strong>${nombreDestinatario}</strong>,</p>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            ${introduccion}
          </p>
          <div style="background: #EEF4FA; border-radius: 14px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #1B3A6B; font-size: 17px; font-weight: 800; margin: 0 0 6px;">${tituloCita}</p>
            <p style="color: #374151; font-size: 14px; margin: 0 0 4px; text-transform: capitalize;">🗓️ ${fechaFormateada}</p>
            ${cita.medico ? `<p style="color: #6B7280; font-size: 13px; margin: 4px 0 0;">👨‍⚕️ ${cita.medico}</p>` : ""}
            ${cita.lugar ? `<p style="color: #6B7280; font-size: 13px; margin: 4px 0 0;">📍 ${cita.lugar}</p>` : ""}
          </div>
          <div style="background: #fff; border: 1px solid #E5EAF2; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
            <p style="color: #1B3A6B; font-size: 14px; font-weight: 700; margin: 0 0 10px;">Para no olvidar</p>
            <p style="color: #6B7280; font-size: 13.5px; line-height: 1.6; margin: 0;">
              ✔️ ${sugerencia}<br/>
              ✔️ Agenda la próxima cita si te la indicaron<br/>
              ✔️ Marca la cita como completada en la app
            </p>
          </div>
          <p style="color: #9CA3AF; font-size: 12px; line-height: 1.6;">
            Puedes registrar cómo te fue desde la sección de Salud en la app.
            Si no asististe, también puedes reagendar desde ahí.
          </p>
        </div>
      </div>
    `
  );
};

/**
 * Recordatorio de examen pendiente: se envía cuando pasó la fecha sugerida
 * y el examen sigue sin marcarse como realizado.
 *
 * El tono es deliberadamente suave: puede que ya se lo hayan hecho y solo
 * falte registrarlo, o que haya razones para postergarlo. No corresponde
 * culpar a nadie.
 */
export const sendExamReminder = async (
  email: string,
  nombreDestinatario: string,
  nombreBebe: string,
  examen: {
    nombre: string;
    indicaciones?: string | null;
    fecha_sugerida?: string | Date | null;
  },
): Promise<void> => {
  const fechaTexto = examen.fecha_sugerida
    ? new Date(examen.fecha_sugerida).toLocaleDateString("es-CL", {
        day: "numeric", month: "long",
      })
    : null;

  await sendEmail(
    email,
    `¿Alcanzaste a hacer el examen de ${nombreBebe}? — Baby Care`,
    `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f9fc; border-radius: 16px; overflow: hidden;">
        <div style="background: #1B3A6B; padding: 32px 40px; text-align: center;">
          <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 900;">Baby<span style="color: #7FC8F8;">Care</span></h1>
        </div>
        <div style="padding: 40px;">
          <div style="text-align: center; margin-bottom: 24px; font-size: 40px;">🧪</div>
          <p style="color: #374151; font-size: 15px; margin-bottom: 8px;">Hola <strong>${nombreDestinatario}</strong>,</p>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Quedó anotado un examen pendiente para <strong>${nombreBebe}</strong>.
            Si ya se lo hicieron, puedes marcarlo como realizado en la app y guardar
            el resultado ahí para tenerlo a mano en el próximo control.
          </p>
          <div style="background: #EEF4FA; border-radius: 14px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #1B3A6B; font-size: 17px; font-weight: 800; margin: 0 0 6px;">${examen.nombre}</p>
            ${fechaTexto ? `<p style="color: #374151; font-size: 14px; margin: 0;">🗓️ Sugerido para el ${fechaTexto}</p>` : ""}
            ${examen.indicaciones ? `<p style="color: #6B7280; font-size: 13px; margin: 8px 0 0;">📋 ${examen.indicaciones}</p>` : ""}
          </div>
          <p style="color: #9CA3AF; font-size: 12px; line-height: 1.6;">
            Si decidieron no hacerlo o ya no corresponde, puedes descartarlo desde
            la sección de Salud y dejamos de recordártelo.
          </p>
        </div>
      </div>
    `
  );
};
