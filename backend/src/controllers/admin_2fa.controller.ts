import { Response } from "express";
import { AdminAuthRequest } from "../middlewares/adminAuth.middleware";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { query } from "../config/db";

export const generate2fa = async (req: AdminAuthRequest, res: Response) => {
  try {
    const adminId = req.admin.id;
    const adminEmail = req.admin.email || "admin@iniciativababy.cl";

    // Generar un nuevo secreto
    const secret = speakeasy.generateSecret({
      name: `BabyCare (${adminEmail})`
    });

    // Guardar el secreto (aún inactivo hasta verificar)
    await query("UPDATE administradores SET dos_fa_secret = $1 WHERE id = $2", [
      secret.base32,
      adminId
    ]);

    // Generar código QR
    if (secret.otpauth_url) {
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
      res.json({
        secret: secret.base32,
        qrCodeUrl
      });
    } else {
      res.status(500).json({ error: "No se pudo generar la URL OTP" });
    }
  } catch (error) {
    console.error("Error generating 2FA:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const enable2fa = async (req: AdminAuthRequest, res: Response) => {
  try {
    const adminId = req.admin.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token es requerido" });
    }

    const result = await query("SELECT dos_fa_secret FROM administradores WHERE id = $1", [adminId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Administrador no encontrado" });
    }

    const dos_fa_secret = result.rows[0].dos_fa_secret;
    if (!dos_fa_secret) {
      return res.status(400).json({ error: "2FA no ha sido generado" });
    }

    const verified = speakeasy.totp.verify({
      secret: dos_fa_secret,
      encoding: "base32",
      token
    });

    if (verified) {
      await query("UPDATE administradores SET dos_fa_activo = TRUE, requiere_2fa = TRUE WHERE id = $1", [adminId]);
      res.json({ message: "2FA activado correctamente" });
    } else {
      res.status(400).json({ error: "El token es inválido" });
    }
  } catch (error) {
    console.error("Error enabling 2FA:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
