import { query } from '../src/config/db';

const seedUsers = async () => {
  try {
    const check = await query('SELECT count(*) FROM usuarios');
    if (parseInt(check.rows[0].count) === 0) {
      console.log('No hay usuarios, insertando datos de prueba...');
      const users = [
        ['María', 'Pérez', 'maria@ejemplo.com', 'madre', 'activo'],
        ['Juan', 'González', 'juan@ejemplo.com', 'padre', 'activo'],
        ['Ana', 'Soto', 'ana@ejemplo.com', 'abuela', 'inactivo']
      ];
      for (const u of users) {
        await query(
          'INSERT INTO usuarios (nombre, apellidos, email, rol, password_hash) VALUES ($1, $2, $3, $4, $5)',
          [u[0], u[1], u[2], u[3], 'fake_hash']
        );
      }
      console.log('Usuarios de prueba insertados.');
    } else {
      console.log(`Ya existen ${check.rows[0].count} usuarios en la base de datos.`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error al insertar usuarios:', error);
    process.exit(1);
  }
};

seedUsers();
