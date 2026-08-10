import { query } from "../config/db";

async function check() {
  try {
    const res = await query(`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'comunidad_likes')
    `);
    console.log("Constraints:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
