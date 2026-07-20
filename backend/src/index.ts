import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectRedis } from './config/redis';
import { globalLimiter } from './middlewares/rateLimit.middleware';
import { verifyToken } from './middlewares/auth.middleware';

import authRoutes from './routes/auth.routes';
import profilesRoutes from './routes/profiles.routes';
import mediaRoutes from './routes/media.routes';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configurar directorio público para uploads locales
const uploadDir = path.join(__dirname, '../../uploads');
app.use('/uploads', express.static(uploadDir));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(globalLimiter);

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/media', mediaRoutes);

// Iniciar servicios y servidor
const startServer = async () => {
  try {
    await connectRedis();
    
    // Rutas de prueba
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', message: 'Iniciativa Baby API is running' });
    });

    app.get('/api/protected', verifyToken, (req, res) => {
      res.json({ status: 'ok', message: 'You have access to protected route', user: (req as any).user });
    });

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
