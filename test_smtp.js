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
    await transporter.verify();
    console.log("SUCCESS: Gmail auth works!");
  } catch (error) {
    console.error("FAILED:", error);
  }
}
test();
