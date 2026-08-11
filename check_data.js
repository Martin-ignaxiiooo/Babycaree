const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_cXjoFgmi8aR7@ep-gentle-sound-ay9kiisy.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'
  });
  await client.connect();
  const v = await client.query("SELECT count(*) FROM vacunas_pni");
  const a = await client.query("SELECT count(*) FROM articulos");
  const f = await client.query("SELECT count(*) FROM foros");
  const m = await client.query("SELECT count(*) FROM medicos");
  console.log("Vacunas:", v.rows[0].count);
  console.log("Articulos:", a.rows[0].count);
  console.log("Foros:", f.rows[0].count);
  console.log("Medicos:", m.rows[0].count);
  await client.end();
}
test();
