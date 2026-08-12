import { Router, Request, Response } from "express";
import { query } from "../config/db";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// Eliminar verifyToken para que sea público y pueda usarse en Onboarding (antes de iniciar sesión)
// router.use(verifyToken);

router.get("/previsiones", async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT codigo, nombre_visible 
       FROM tipos_prevision 
       WHERE estado = 'activo'
       ORDER BY orden_visualizacion ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching previsiones:", error);
    res.status(500).json({ error: "Error al obtener previsiones" });
  }
});

router.get("/medicos", async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT m.*, e.nombre_visible as especialidad_nombre, c.icono as centro_icono
       FROM medicos_directorio m
       LEFT JOIN especialidades_medicas e ON m.especialidad = e.codigo
       LEFT JOIN tipos_centro_atencion c ON m.id_tipo_centro = c.codigo
       WHERE m.estado_verificacion = 'verificado'
       ORDER BY m.calificacion_promedio DESC, m.fecha_creacion DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching medicos:", error);
    res.status(500).json({ error: "Error al obtener médicos" });
  }
});

router.get("/especialidades", async (req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT * FROM especialidades_medicas WHERE estado = 'activa' ORDER BY orden_visualizacion ASC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching especialidades:", error);
    res.status(500).json({ error: "Error al obtener especialidades" });
  }
});

export default router;
