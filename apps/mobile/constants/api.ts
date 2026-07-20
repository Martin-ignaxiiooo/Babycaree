import { Platform } from 'react-native';

// Para Android emulator, localhost es 10.0.2.2.
// Para Expo Go en un teléfono físico, debes poner la IP local de tu computador en la red WiFi.
// Por ejemplo: 'http://192.168.1.100:3000/api'
// Aquí intentaremos deducir si es web o dispositivo
const LOCAL_IP = '192.168.1.100'; // CAMBIAR A LA IP LOCAL DEL USUARIO SI ES NECESARIO

export const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000/api' 
  : `http://${LOCAL_IP}:3000/api`;
