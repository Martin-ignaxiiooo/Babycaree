const nodemailer = require("nodemailer");

async function test() {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: "babyyycareee@gmail.com",
      pass: "jznwgpfhzffmwvia",
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"Iniciativa Baby" <babyyycareee@gmail.com>',
      to: "babyyycareee@gmail.com", // send to self
      subject: "Test SMTP",
      text: "If you get this, SMTP works.",
    });
    console.log("Success:", info.messageId);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
