// Test script - usar con variables de entorno
// BREVO_API_KEY=tu_clave node test_smtp.js

async function test() {
  const API_KEY = process.env.BREVO_API_KEY;
  if (!API_KEY) {
    console.error("Falta BREVO_API_KEY en variables de entorno");
    process.exit(1);
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Iniciativa Baby", email: "babyyycareee@gmail.com" },
      to: [{ email: "el.martin.pena@gmail.com" }],
      subject: "✅ Test Brevo API",
      htmlContent: "<h1>Funciona!</h1>",
    }),
  });
  const data = await response.json();
  console.log("Status:", response.status, response.ok ? "✅ OK" : "❌ FAIL");
  console.log("Response:", data);
}

test();
