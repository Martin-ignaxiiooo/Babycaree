const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_cXjoFgmi8aR7@ep-gentle-sound-ay9kiisy.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'
  });
  await client.connect();
  await client.query("DELETE FROM codigos_recuperacion WHERE id_usuario = '1cf3b53c-c6e3-4080-b472-65ac16bc85aa'");
  console.log("DELETED");
  await client.end();
}
test();
