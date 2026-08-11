const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_cXjoFgmi8aR7@ep-gentle-sound-ay9kiisy.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'
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
