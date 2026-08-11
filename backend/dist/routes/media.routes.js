"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const media_controller_1 = require("../controllers/media.controller");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
// Endpoint protegido para subir imágenes
router.post("/upload", auth_middleware_1.verifyToken, upload_middleware_1.upload.single("file"), media_controller_1.uploadFile);
exports.default = router;
