import { query } from "../config/db";

async function checkForos() {
  try {
    const res = await query("SELECT id, titulo, estado, likes FROM comunidad_foros");
    console.log("Foros:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
checkForos();
