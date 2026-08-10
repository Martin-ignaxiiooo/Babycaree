import { query } from "../config/db";

async function checkSchema() {
  try {
    const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'comunidad_respuestas'");
    console.log("Columns:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
checkSchema();
