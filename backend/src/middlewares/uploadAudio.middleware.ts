import multer from "multer";

// Audio de las notas de voz para agendar citas. Va en memoria (no a disco)
// porque el archivo se reenvía de inmediato al servicio de transcripción y
// no se conserva: es una grabación de la voz del usuario, así que guardarla
// sin necesidad sería recolectar datos personales de más.
const ALLOWED_MIME = new Set([
  "audio/m4a",
  "audio/x-m4a",
  "audio/mp4",
  "audio/mpeg",
  "audio/mpga",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
]);

export const uploadAudioMemoria = multer({
  storage: multer.memoryStorage(),
  // Una nota de voz para agendar una cita dura segundos, no minutos.
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato de audio no soportado."));
    }
  },
});
