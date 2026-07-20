import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_fallback_key';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, nombre, apellidos } = req.body;

    if (!email || !password || !nombre || !apellidos) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Verificar si el usuario ya existe
    const userExists = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insertar usuario
    const result = await query(
      'INSERT INTO usuarios (email, password_hash, nombre, apellidos) VALUES ($1, $2, $3, $4) RETURNING id, email, nombre, apellidos, rol',
      [email, passwordHash, nombre, apellidos]
    );

    const newUser = result.rows[0];

    // Generar JWT
    const token = jwt.sign({ id: newUser.id, email: newUser.email, rol: newUser.rol }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const result = await query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Actualizar última conexión
    await query('UPDATE usuarios SET ultima_conexion = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generar JWT
    const token = jwt.sign({ id: user.id, email: user.email, rol: user.rol }, JWT_SECRET, {
      expiresIn: '7d',
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellidos: user.apellidos,
      rol: user.rol,
    };

    res.json({ user: userResponse, token });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
