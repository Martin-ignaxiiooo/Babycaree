const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'iniciativa_baby',
  password: 'password',
  port: 5433,
});

async function run() {
  try {
    const res = await pool.query('SELECT DISTINCT prevision_salud FROM perfiles_bebes');
    console.log("Valores en DB:", res.rows.map(r => r.prevision_salud));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
