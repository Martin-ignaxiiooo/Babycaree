import axios from 'axios';
import { query } from '../config/db';
import jwt from 'jsonwebtoken';

async function testApi() {
  try {
    const userRes = await query("SELECT * FROM usuarios LIMIT 1");
    if (!userRes.rows.length) return;
    const user = userRes.rows[0];
    
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET || "supersecret_fallback_key",
      { expiresIn: "7d" }
    );

    const foroRes = await query("SELECT id FROM comunidad_foros LIMIT 1");
    const foroId = foroRes.rows[0].id;

    console.log("Fetching foro:", foroId, "with token:", token);

    const res = await axios.get(`http://localhost:3000/api/v1/comunidad/foros/${foroId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("API Success:", res.data.foro.titulo);
  } catch (error: any) {
    console.error("API Error:", error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}
testApi();
