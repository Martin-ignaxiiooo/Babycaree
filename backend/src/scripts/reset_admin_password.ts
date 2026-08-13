import { query } from "../config/db";
import bcrypt from "bcrypt";

// Uso: ADMIN_EMAIL=correo@dominio.cl ADMIN_PASSWORD=nuevaClaveSegura npx ts-node reset_admin_password.ts
async function resetPassword() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("ERROR: definí ADMIN_EMAIL y ADMIN_PASSWORD como variables de entorno antes de correr este script. Nunca hardcodees credenciales acá.");
    process.exit(1);
  }

  try {
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);

    await query("UPDATE administradores SET hash_contrasena = $1 WHERE correo_corporativo = $2", [hash, email]);

    const res = await query("SELECT estado FROM administradores WHERE correo_corporativo = $1", [email]);
    if (!res.rows[0]) {
      console.error(`No existe un administrador con correo ${email}`);
      process.exit(1);
    }
    console.log("Estado:", res.rows[0].estado);
    console.log(`Contraseña actualizada con éxito para ${email}`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
resetPassword();
