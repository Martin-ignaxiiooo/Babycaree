import axios from 'axios';
import { query } from '../config/db';
import jwt from 'jsonwebtoken';

async function testFetchArticulos() {
  try {
    const userRes = await query("SELECT * FROM usuarios LIMIT 1");
    if (!userRes.rows.length) return;
    const user = userRes.rows[0];
    
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET || "supersecret_fallback_key",
      { expiresIn: "7d" }
    );

    console.log("Fetching /articulos with token for user:", user.email);
    const artRes = await axios.get('http://localhost:3000/api/v1/comunidad/articulos', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("Success! Articulos count:", artRes.data.length);
  } catch (error: any) {
    console.error("Test failed:", error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}
testFetchArticulos();
