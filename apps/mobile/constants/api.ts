// Backend real (el mismo que usa la web, en Render). Es la misma base de
// datos y los mismos endpoints — no hay nada separado para mobile.
const PRODUCTION_API_URL = 'https://babycare-backend-msyq.onrender.com/api';

// Para desarrollo local contra tu backend corriendo en tu compu, definí
// EXPO_PUBLIC_API_URL en un archivo .env dentro de apps/mobile, por ejemplo:
//   EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api   (tu IP local en la red WiFi)
// Si no lo definís, se usa el backend real de producción por defecto.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL;
