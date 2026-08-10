import axios from 'axios';
import { query } from '../config/db';
import jwt from 'jsonwebtoken';

async function testAdminComunidad() {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || "supersecret_fallback_key";

    // 1. Get an admin user
    let userRes = await query("SELECT * FROM administradores LIMIT 1");
    if (!userRes.rows.length) {
      console.log("No admins found, trying seed...");
      await axios.get('http://localhost:3000/api/v1/admin/seed');
      userRes = await query("SELECT * FROM administradores LIMIT 1");
    }
    const admin = userRes.rows[0];
    
    // 2. Create token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, rol: admin.rol },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Admin token:", token);

    // 3. Test /stats
    const statsRes = await axios.get('http://localhost:3000/api/v1/admin/comunidad/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Stats:", statsRes.data);

    // 4. Test /foros
    const forosRes = await axios.get('http://localhost:3000/api/v1/admin/comunidad/foros', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Foros fetched:", forosRes.data.length);
    if (forosRes.data.length === 0) {
      console.log("No foros found to test further.");
      process.exit(0);
    }
    const foroId = forosRes.data[0].id;

    // 5. Test /comentarios
    const comentariosRes = await axios.get(`http://localhost:3000/api/v1/admin/comunidad/foros/${foroId}/comentarios`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Comentarios for ${foroId}:`, comentariosRes.data.length);

    // 6. Test delete (only if comments exist)
    if (comentariosRes.data.length > 0) {
      const commentId = comentariosRes.data[0].id;
      console.log(`Deleting comment ${commentId}...`);
      await axios.delete(`http://localhost:3000/api/v1/admin/comunidad/comentarios/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Comment deleted successfully!");
    } else {
      console.log("No comments to delete.");
    }

  } catch (error: any) {
    console.error("Test failed:", error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}
testAdminComunidad();
