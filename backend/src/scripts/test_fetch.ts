import axios from 'axios';
import { query } from '../config/db';
import jwt from 'jsonwebtoken';

async function testFetch() {
  try {
    const userRes = await query("SELECT * FROM usuarios LIMIT 1");
    if (!userRes.rows.length) return;
    const user = userRes.rows[0];
    
    if (!process.env.JWT_SECRET) {
      console.error("Definí JWT_SECRET como variable de entorno para correr este script.");
      process.exit(1);
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Fetching /foros with token for user:", user.email);
    const forosRes = await axios.get('http://localhost:3000/api/v1/comunidad/foros', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("Success! Foros count:", forosRes.data.length);
  } catch (error: any) {
    console.error("Test failed:", error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}
testFetch();
