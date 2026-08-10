import { query } from '../src/config/db';

const seedVacunas = async () => {
  try {
    console.log('Creando tabla vacunas_calendario si no existe...');
    await query(`
      CREATE TABLE IF NOT EXISTS vacunas_calendario (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        meses_edad INTEGER NOT NULL,
        obligatoria BOOLEAN DEFAULT true,
        enfermedades_previene VARCHAR(255)
      )
    `);

    console.log('Limpiando vacunas_calendario...');
    await query('TRUNCATE TABLE vacunas_calendario RESTART IDENTITY CASCADE');

    const vacunas = [
      ['BCG', 0, true, 'Tuberculosis'],
      ['Hepatitis B', 0, true, 'Hepatitis B'],
      ['Hexavalente', 2, true, 'Hepatitis B, Difteria, Tétanos, Tos Convulsiva, Hib, Polio'],
      ['Neumocócica conjugada', 2, true, 'Enfermedades por Neumococo'],
      ['Hexavalente', 4, true, 'Hepatitis B, Difteria, Tétanos, Tos Convulsiva, Hib, Polio'],
      ['Neumocócica conjugada', 4, true, 'Enfermedades por Neumococo'],
      ['Hexavalente', 6, true, 'Hepatitis B, Difteria, Tétanos, Tos Convulsiva, Hib, Polio'],
      ['Neumocócica conjugada', 6, true, 'Enfermedades por Neumococo'],
      ['Tresvírica', 12, true, 'Sarampión, Rubéola, Parotiditis'],
      ['Meningocócica recombinante', 12, true, 'Enfermedad Meningocócica por serogrupo B'],
      ['Neumocócica conjugada', 12, true, 'Enfermedades por Neumococo'],
      ['Hexavalente', 18, true, 'Hepatitis B, Difteria, Tétanos, Tos Convulsiva, Hib, Polio'],
      ['Hepatitis A', 18, true, 'Hepatitis A'],
      ['Varicela', 18, true, 'Varicela'],
      ['Fiebre Amarilla', 18, false, 'Fiebre Amarilla (Solo Isla de Pascua)']
    ];

    for (const v of vacunas) {
      await query(
        'INSERT INTO vacunas_calendario (nombre, meses_edad, obligatoria, enfermedades_previene) VALUES ($1, $2, $3, $4)',
        v
      );
    }
    console.log('Vacunas insertadas correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error al insertar vacunas:', error);
    process.exit(1);
  }
};

seedVacunas();
