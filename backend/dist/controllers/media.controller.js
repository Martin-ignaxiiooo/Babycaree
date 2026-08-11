"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const uploadFile = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se subió ningún archivo" });
        }
        // Devolver la ruta relativa estática
        const fileUrl = `/uploads/${req.file.filename}`;
        res.status(201).json({
            message: "Archivo subido con éxito",
            url: fileUrl,
        });
    }
    catch (error) {
        console.error("Error en uploadFile:", error);
        res.status(500).json({ error: "Error al subir el archivo" });
    }
};
exports.uploadFile = uploadFile;
