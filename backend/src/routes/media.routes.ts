import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware";
import { uploadFile } from "../controllers/media.controller";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

// Endpoint protegido para subir imágenes
router.post("/upload", verifyToken, upload.single("file"), uploadFile);

export default router;
