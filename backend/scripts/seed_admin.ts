import { query } from '../src/config/db';
import bcrypt from 'bcrypt';

// Uso: ADMIN_NAME="Nombre" ADMIN_EMAIL=correo@dominio.cl ADMIN_PASSWORD=claveSegura npx ts-node seed_admin.ts
const seedAdmin = async () => {
  const nombre = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!nombre || !email || !password) {
    console.error('ERROR: definí ADMIN_NAME, ADMIN_EMAIL y ADMIN_PASSWORD como variables de entorno antes de correr este script. Nunca hardcodees credenciales acá.');
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    await query(`INSERT INTO administradores (nombre_completo, correo_corporativo, rol, hash_contrasena, requiere_2fa) 
                 VALUES ($1, $2, 'admin_general', $3, false)`, [nombre, email, hash]);
    console.log(`Admin creado exitosamente: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedAdmin();
