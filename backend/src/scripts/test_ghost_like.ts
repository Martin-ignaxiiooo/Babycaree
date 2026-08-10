import axios from 'axios';
import { query } from '../config/db';
import jwt from 'jsonwebtoken';

async function testGhostLike() {
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

    console.log("Liking foro:", foroId);
    await axios.post(`http://localhost:3000/api/v1/comunidad/foros/${foroId}/like`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("Fetching /foros");
    const forosRes = await axios.get('http://localhost:3000/api/v1/comunidad/foros', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("Success! Foros count:", forosRes.data.length);
    console.log("First foro likes:", forosRes.data[0].likes);
  } catch (error: any) {
    console.error("Test failed:", error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}
testGhostLike();
