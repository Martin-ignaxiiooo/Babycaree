import { query } from "../config/db";
import bcrypt from "bcrypt";

async function run() {
  const hashedPassword = await bcrypt.hash("Prueba123", 10);
  
  await query(
    `INSERT INTO usuarios (id, email, password_hash, nombre, apellidos, rol) 
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO UPDATE SET password_hash = $3`,
    ["e0329b13-94c3-42e1-8fdb-000000000000", "test@iniciativababy.cl", hashedPassword, "Usuario", "Prueba", "user"]
  );
  
  console.log("✅ Usuario de prueba creado/actualizado con éxito");
  process.exit(0);
}
run();
