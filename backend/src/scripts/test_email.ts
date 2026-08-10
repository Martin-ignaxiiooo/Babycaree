import { sendRecoveryCode } from "../config/mailer";

async function test() {
  console.log("📧 Enviando correo de prueba...");
  await sendRecoveryCode("babyyycareee@gmail.com", "123456", "Admin Test");
  console.log("✅ Correo enviado exitosamente. Revisa tu bandeja de entrada.");
  process.exit(0);
}

test().catch((e) => {
  console.error("❌ Error al enviar correo:", e.message);
  process.exit(1);
});
