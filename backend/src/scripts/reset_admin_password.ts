import { query } from "../config/db";
import bcrypt from "bcrypt";

async function resetPassword() {
  try {
    const password = "Administrador2026";
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);

    await query("UPDATE administradores SET hash_contrasena = $1 WHERE correo_corporativo = 'cesar.pena@iniciativababy.cl'", [hash]);
    
    // Check if the user is active
    const res = await query("SELECT estado FROM administradores WHERE correo_corporativo = 'cesar.pena@iniciativababy.cl'");
    console.log("Estado:", res.rows[0].estado);
    console.log("Contraseña actualizada con éxito a:", password);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
resetPassword();
