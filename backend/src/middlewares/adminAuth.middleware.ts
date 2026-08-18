import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { query } from "../config/db";

const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET;
if (!JWT_ADMIN_SECRET) {
  throw new Error("JWT_ADMIN_SECRET no está definido en las variables de entorno. El servidor no puede iniciar sin esta clave.");
}

export interface AdminAuthRequest extends Request {
  admin?: any;
}

export const verifyAdminToken = async (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "No token provided or invalid format" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded: any = jwt.verify(token, JWT_ADMIN_SECRET, { algorithms: ["HS256"] });

    // Check if the session is still valid in DB
    const sessionRes = await query(
      "SELECT valido FROM sesiones_admin WHERE token_jti = $1 AND id_admin = $2",
      [decoded.jti, decoded.id],
    );
    if (sessionRes.rows.length === 0 || !sessionRes.rows[0].valido) {
      return res
        .status(401)
        .json({ error: "Sesión administrativa inválida o expirada" });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ error: "Fallo al autenticar el token administrativo" });
  }
};

export const requireRole = (rolesAllowed: string[]) => {
  return (req: AdminAuthRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ error: "No autenticado" });
    }

    if (
      rolesAllowed.includes(req.admin.rol) ||
      req.admin.rol === "admin_general"
    ) {
      next();
    } else {
      return res
        .status(403)
        .json({ error: "No tienes permiso para realizar esta acción" });
    }
  };
};

export const requireAdmin = verifyAdminToken;
