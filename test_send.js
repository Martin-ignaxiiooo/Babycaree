const nodemailer = require("nodemailer");

async function test() {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "babyyycareee@gmail.com",
      pass: "jznwgpfhzffmwvia",
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"Iniciativa Baby" <babyyycareee@gmail.com>',
      to: 'el.martin.pena@gmail.com',
      subject: "Prueba de recuperación",
      text: "Este es un correo de prueba"
    });
    console.log("SUCCESS:", info.messageId);
  } catch (error) {
    console.error("FAILED:", error);
  }
}
test();
