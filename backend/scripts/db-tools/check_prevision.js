require('dotenv').config();
const { Client } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('ERROR: falta la variable de entorno DATABASE_URL (definila en un archivo .env local, nunca hardcodeada).');
  process.exit(1);
}


async function test() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  const res = await client.query(`
    SELECT b.prevision_salud, t.nombre_visible as nombre_prevision 
    FROM perfiles_bebes b 
    LEFT JOIN tipos_prevision t ON b.prevision_salud = t.codigo
  `);
  console.log("JOIN Result:", res.rows);
  await client.end();
}
test();
