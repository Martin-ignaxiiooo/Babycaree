const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_cXjoFgmi8aR7@ep-gentle-sound-ay9kiisy.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'
  });
  await client.connect();
  const res = await client.query('SELECT * FROM codigos_recuperacion ORDER BY creado_en DESC LIMIT 10');
  console.log(res.rows);
  await client.end();
}
test();
