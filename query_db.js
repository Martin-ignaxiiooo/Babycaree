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
  const res = await client.query('SELECT * FROM codigos_recuperacion ORDER BY creado_en DESC LIMIT 10');
  console.log(res.rows);
  await client.end();
}
test();
