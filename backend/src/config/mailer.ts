import dotenv from "dotenv";

dotenv.config();

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const SENDER_EMAIL = process.env.SMTP_FROM_EMAIL || "babyyycareee@gmail.com";
const SENDER_NAME = "Iniciativa Baby";

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
    "Tu código de recuperación — Iniciativa Baby",
    `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f9fc; border-radius: 16px; overflow: hidden;">
        <div style="background: #1B3A6B; padding: 32px 40px; text-align: center;">
          <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 900; letter-spacing: -0.5px;">Iniciativa<span style="color: #7FC8F8;">Baby</span></h1>
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
          <p style="color: #9CA3AF; font-size: 11px; margin: 0;">Iniciativa Baby · Cumple con Ley 19.628 y Ley 21.719</p>
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
    "Tu contraseña fue cambiada — Iniciativa Baby",
    `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f9fc; border-radius: 16px; overflow: hidden;">
        <div style="background: #1B3A6B; padding: 32px 40px; text-align: center;">
          <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 900;">Iniciativa<span style="color: #7FC8F8;">Baby</span></h1>
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
    "Alerta de seguridad: múltiples intentos fallidos — Iniciativa Baby",
    `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f9fc; border-radius: 16px; overflow: hidden;">
        <div style="background: #1B3A6B; padding: 32px 40px; text-align: center;">
          <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 900;">Iniciativa<span style="color: #7FC8F8;">Baby</span></h1>
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
    `Has sido invitado a ver el perfil de ${nombreBebe} — Iniciativa Baby`,
    `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f9fc; border-radius: 16px; overflow: hidden;">
        <div style="background: #1B3A6B; padding: 32px 40px; text-align: center;">
          <h1 style="color: #fff; font-size: 22px; margin: 0; font-weight: 900;">Iniciativa<span style="color: #7FC8F8;">Baby</span></h1>
        </div>
        <div style="padding: 40px;">
          <div style="text-align: center; margin-bottom: 24px; font-size: 40px;">💌</div>
          <p style="color: #374151; font-size: 15px; margin-bottom: 8px;">Hola,</p>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            <strong>${nombreFamiliar}</strong> te ha invitado a ver el perfil de su bebé <strong>${nombreBebe}</strong> en Iniciativa Baby.
          </p>
          <a href="https://babycaree-web.vercel.app/seleccionar-perfil" style="display: block; text-decoration: none;">
            <div style="background: #E0E7FF; border-left: 4px solid #4F46E5; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px; text-align: center;">
              <p style="color: #3730A3; font-size: 14px; margin: 0; font-weight: 700;">👉 Ingresar a Iniciativa Baby</p>
            </div>
          </a>
          <p style="color: #9CA3AF; font-size: 12px;">Si no conoces a ${nombreFamiliar}, puedes ignorar este correo.</p>
        </div>
      </div>
    `
  );
};
