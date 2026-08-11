import { query } from '../src/config/db';

const seedVacunas = async () => {
  try {
    console.log('Limpiando vacunas_pni...');
    await query('TRUNCATE TABLE vacunas_pni RESTART IDENTITY CASCADE');

    const vacunas = [
      ['BCG', 'Tuberculosis', 0],
      ['Hepatitis B', 'Hepatitis B', 0],
      ['Hexavalente', 'Hepatitis B, Difteria, Tétanos, Tos Convulsiva, Hib, Polio', 2],
      ['Neumocócica conjugada', 'Enfermedades por Neumococo', 2],
      ['Hexavalente', 'Hepatitis B, Difteria, Tétanos, Tos Convulsiva, Hib, Polio', 4],
      ['Neumocócica conjugada', 'Enfermedades por Neumococo', 4],
      ['Hexavalente', 'Hepatitis B, Difteria, Tétanos, Tos Convulsiva, Hib, Polio', 6],
      ['Neumocócica conjugada', 'Enfermedades por Neumococo', 6],
      ['Tresvírica', 'Sarampión, Rubéola, Parotiditis', 12],
      ['Meningocócica recombinante', 'Enfermedad Meningocócica por serogrupo B', 12],
      ['Neumocócica conjugada', 'Enfermedades por Neumococo', 12],
      ['Hexavalente', 'Hepatitis B, Difteria, Tétanos, Tos Convulsiva, Hib, Polio', 18],
      ['Hepatitis A', 'Hepatitis A', 18],
      ['Varicela', 'Varicela', 18],
      ['Fiebre Amarilla', 'Fiebre Amarilla (Solo Isla de Pascua)', 18]
    ];

    for (const v of vacunas) {
      await query(
        'INSERT INTO vacunas_pni (nombre, enfermedades_previene, meses_edad_recomendada) VALUES ($1, $2, $3)',
        v
      );
    }
    console.log('Vacunas insertadas correctamente en vacunas_pni.');
    process.exit(0);
  } catch (error) {
    console.error('Error al insertar vacunas:', error);
    process.exit(1);
  }
};

seedVacunas();
