import axios from 'axios';
import { query } from '../config/db';
import jwt from 'jsonwebtoken';

async function testPasswordReset() {
  try {
    const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || "supersecret_admin_key_fallback";

    // 1. Get admin_general
    const userRes = await query("SELECT * FROM administradores WHERE rol = 'admin_general' LIMIT 1");
    if (!userRes.rows.length) {
      console.log("No admin_general found.");
      process.exit(1);
    }
    const admin = userRes.rows[0];
    
    // 2. Create token
    const token = jwt.sign(
      { id: admin.id, email: admin.correo_corporativo, rol: admin.rol },
      JWT_ADMIN_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Testing PUT /api/v1/admin/administradores/" + admin.id + "/password");

    const res = await axios.put(
      `http://localhost:3000/api/v1/admin/administradores/${admin.id}/password`,
      { nueva_contrasena: "nueva_clave_test" },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("Success:", res.data);
  } catch (error: any) {
    console.error("Test failed:", error.response?.status, error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}
testPasswordReset();
