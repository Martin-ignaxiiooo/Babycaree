import multer from "multer";

// A diferencia de middlewares/upload.middleware.ts (que guarda en disco),
// esta instancia guarda el archivo en memoria (req.file.buffer) porque la
// foto de perfil del bebé se codifica en base64 y se guarda directo en la
// base de datos, no en el filesystem del servidor (que en Render es efímero
// y se borra en cada redeploy).
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export const uploadFotoMemoria = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB de margen; el frontend ya la comprime antes de enviarla
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes (jpg, jpeg, png, webp, gif)"));
    }
  },
});
