// Script manual para probar el envío de correo vía SMTP (Gmail).
// Uso: SMTP_USER=correo@gmail.com SMTP_PASS=xxxx TEST_EMAIL_TO=destino@gmail.com node test_send.js
// Nunca hardcodees credenciales acá. Las de este proyecto se rotaron tras quedar expuestas en el historial de git.
require('dotenv').config();
const nodemailer = require("nodemailer");

const { SMTP_USER, SMTP_PASS, TEST_EMAIL_TO } = process.env;

if (!SMTP_USER || !SMTP_PASS) {
  console.error('ERROR: definí SMTP_USER y SMTP_PASS como variables de entorno antes de correr este script.');
  process.exit(1);
}

async function test() {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Iniciativa Baby" <${SMTP_USER}>`,
      to: TEST_EMAIL_TO || SMTP_USER,
      subject: "Prueba de recuperación",
      text: "Este es un correo de prueba"
    });
    console.log("SUCCESS:", info.messageId);
  } catch (error) {
    console.error("FAILED:", error);
  }
}
test();
