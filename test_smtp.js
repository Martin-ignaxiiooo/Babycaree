// Test de recuperación de contraseña en producción
async function test() {
  const response = await fetch("https://babycare-backend-msyq.onrender.com/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "el.martin.pena@gmail.com" }),
  });
  const data = await response.json();
  console.log("Status:", response.status);
  console.log("Response:", data);
}
test();
