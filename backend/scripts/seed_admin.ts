import { query } from '../src/config/db';
import bcrypt from 'bcrypt';

const seedAdmin = async () => {
  try {
    const hash = await bcrypt.hash('admin123', 12);
    await query(`INSERT INTO administradores (nombre_completo, correo_corporativo, rol, hash_contrasena, requiere_2fa) 
                 VALUES ('César Peña', 'cesar.pena@iniciativababy.cl', 'admin_general', $1, false)`, [hash]);
    console.log('Admin creado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedAdmin();
