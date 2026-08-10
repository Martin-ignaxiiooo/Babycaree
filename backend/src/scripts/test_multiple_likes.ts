import axios from 'axios';
import { query } from '../config/db';
import jwt from 'jsonwebtoken';

async function testMultipleAccountsLike() {
  try {
    const usersRes = await query("SELECT * FROM usuarios LIMIT 2");
    if (usersRes.rows.length < 2) {
      console.log("Need 2 users to test.");
      return;
    }
    const user1 = usersRes.rows[0];
    const user2 = usersRes.rows[1];
    
    const token1 = jwt.sign({ id: user1.id, email: user1.email, rol: user1.rol }, process.env.JWT_SECRET || "supersecret_fallback_key", { expiresIn: "7d" });
    const token2 = jwt.sign({ id: user2.id, email: user2.email, rol: user2.rol }, process.env.JWT_SECRET || "supersecret_fallback_key", { expiresIn: "7d" });

    const foroRes = await query("SELECT id FROM comunidad_foros LIMIT 1");
    const foroId = foroRes.rows[0].id;

    console.log("Clearing previous likes for foro:", foroId);
    await query("DELETE FROM comunidad_likes WHERE foro_id = $1", [foroId]);
    await query("UPDATE comunidad_foros SET likes = 0 WHERE id = $1", [foroId]);

    console.log("User 1 Liking...");
    await axios.post(`http://localhost:3000/api/v1/comunidad/foros/${foroId}/like`, {}, { headers: { Authorization: `Bearer ${token1}` } });

    const res1 = await axios.get(`http://localhost:3000/api/v1/comunidad/foros/${foroId}`, { headers: { Authorization: `Bearer ${token1}` } });
    console.log("After User 1 likes, total likes:", res1.data.foro.likes);

    console.log("User 2 Liking...");
    await axios.post(`http://localhost:3000/api/v1/comunidad/foros/${foroId}/like`, {}, { headers: { Authorization: `Bearer ${token2}` } });

    const res2 = await axios.get(`http://localhost:3000/api/v1/comunidad/foros/${foroId}`, { headers: { Authorization: `Bearer ${token2}` } });
    console.log("After User 2 likes, total likes:", res2.data.foro.likes);

  } catch (error: any) {
    console.error("Test failed:", error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}
testMultipleAccountsLike();
