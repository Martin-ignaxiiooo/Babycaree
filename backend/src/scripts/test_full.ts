import axios from 'axios';
import { query } from '../config/db';

async function fullTest() {
  try {
    // 1. Create a brand new user via API
    const rand = Math.random().toString(36).substring(7);
    const email = `test${rand}@example.com`;
    console.log("Registering new user:", email);
    
    const regRes = await axios.post('http://localhost:3000/api/v1/auth/register', {
      email: email,
      password: 'password123',
      nombre: 'Test',
      apellidos: 'User'
    });
    const token = regRes.data.token;
    console.log("Registered. Token:", token.substring(0, 20) + "...");

    // 2. Fetch the list of forums
    const forosRes = await axios.get('http://localhost:3000/api/v1/comunidad/foros', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (forosRes.data.length === 0) {
      return console.log("No foros found");
    }
    const foroId = forosRes.data[0].id;
    console.log("Found foro:", foroId);

    // 3. Fetch the detail of the forum
    const detailRes = await axios.get(`http://localhost:3000/api/v1/comunidad/foros/${foroId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Detail success:", detailRes.data.foro.titulo);

  } catch (error: any) {
    console.error("Test failed:", error.response?.data || error.message);
  } finally {
    process.exit(0);
  }
}
fullTest();
