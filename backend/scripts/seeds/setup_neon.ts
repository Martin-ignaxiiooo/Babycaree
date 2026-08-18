import { query, pool } from '../src/config/db';
import fs from 'fs';
import path from 'path';

const setupDatabase = async () => {
  try {
    console.log('Conectando a la base de datos (Neon)...');
    
    // Leer el archivo de esquema
    const schemaPath = path.join(__dirname, '../src/db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Ejecutando schema.sql...');
    await query(schemaSql);
    console.log('¡Tablas base creadas correctamente!');

    process.exit(0);
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
};

setupDatabase();
