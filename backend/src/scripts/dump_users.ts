import { query } from "../config/db";

async function dumpUsers() {
  try {
    const res = await query("SELECT id, email FROM usuarios");
    console.log("Usuarios:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
dumpUsers();
