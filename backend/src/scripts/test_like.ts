import axios from 'axios';
import { query } from '../config/db';
import jwt from 'jsonwebtoken';

async function testLike() {
  try {
    const userRes = await query("SELECT * FROM usuarios LIMIT 1");
    if (!userRes.rows.length) return;
    const user = userRes.rows[0];
    
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET || "supersecret_fallback_key",
      { expiresIn: "7d" }
    );

    const foroRes = await query("SELECT id, likes FROM comunidad_foros LIMIT 1");
    const foroId = foroRes.rows[0].id;

    console.log("Initial Likes:", foroRes.rows[0].likes);

    for (let i = 0; i < 5; i++) {
      const res = await axios.post(`http://localhost:3000/api/v1/comunidad/foros/${foroId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Click ${i+1}: liked=${res.data.liked}`);
    }

    const finalRes = await axios.get(`http://localhost:3000/api/v1/comunidad/foros/${foroId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Final Likes dynamically calculated:", finalRes.data.foro.likes);
    console.log("Has liked:", finalRes.data.foro.has_liked);

  } catch (error: any) {
    console.error("Test failed:", error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}
testLike();
