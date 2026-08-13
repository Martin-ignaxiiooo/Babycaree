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
  const res = await client.query("SELECT email FROM usuarios WHERE id = '1cf3b53c-c6e3-4080-b472-65ac16bc85aa'");
  console.log(res.rows[0]);
  await client.end();
}
test();
