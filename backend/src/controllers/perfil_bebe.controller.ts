import { Request, Response } from 'express';
import { query } from '../config/db';
import { sendInvitationAlert } from '../config/mailer';

export const getPerfil = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // TODO: Verify if user is owner or has active access
    const result = await query(
      `SELECT pb.*, tp.nombre_visible as nombre_prevision 
       FROM perfiles_bebes pb 
       LEFT JOIN tipos_prevision tp ON pb.prevision_salud = tp.codigo
       WHERE pb.id = $1 AND (pb.usuario_id = $2 OR EXISTS (SELECT 1 FROM accesos_compartidos_bebe WHERE id_perfil_bebe = $1 AND id_usuario_invitado = $2 AND estado = 'activo'))`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Perfil no encontrado o sin acceso' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
};

export const actualizarPerfil = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const {
      nombre, apodo, sexo, fecha_nacimiento, prevision_salud,
      peso_nacimiento_g, talla_nacimiento_cm, semanas_gestacion_nac,
      tipo_sangre, alergias, condiciones_cronicas, pediatra_nombre, centro_salud,
      foto_perfil,
      confirmado
    } = req.body;

    // Check ownership or 'ver_editar' access
    const accessCheck = await query(
      `SELECT 1 FROM perfiles_bebes pb 
       LEFT JOIN accesos_compartidos_bebe acb ON acb.id_perfil_bebe = pb.id AND acb.id_usuario_invitado = $2 AND acb.estado = 'activo'
       WHERE pb.id = $1 AND (pb.usuario_id = $2 OR acb.nivel_permiso = 'ver_editar')`,
      [id, userId]
    );

    if (accessCheck.rows.length === 0) {
      res.status(403).json({ error: 'No tienes permiso para editar este perfil' });
      return;
    }

    if (fecha_nacimiento && new Date(fecha_nacimiento) > new Date()) {
      res.status(400).json({ error: 'La fecha de nacimiento no puede ser futura' });
      return;
    }

    const currentProfile = await query(`SELECT * FROM perfiles_bebes WHERE id = $1`, [id]);
    const oldData = currentProfile.rows[0];

    // Check gestation threshold
    if (semanas_gestacion_nac !== undefined && oldData.semanas_gestacion_nac !== semanas_gestacion_nac) {
      const wasPremature = oldData.semanas_gestacion_nac < 37;
      const isPremature = semanas_gestacion_nac < 37;
      if (wasPremature !== isPremature && !confirmado) {
        res.status(409).json({ requiere_confirmacion: true, mensaje: 'El cambio de semanas de gestación afecta el estado de prematurez y el cálculo de percentiles. ¿Confirmas el cambio?' });
        return;
      }
    }

    // UPDATE
    const updateQuery = `
      UPDATE perfiles_bebes SET
        nombre = COALESCE($2, nombre),
        apodo = COALESCE($3, apodo),
        sexo = COALESCE($4, sexo),
        fecha_nacimiento = COALESCE($5, fecha_nacimiento),
        prevision_salud = COALESCE($6, prevision_salud),
        peso_nacimiento_g = COALESCE($7, peso_nacimiento_g),
        talla_nacimiento_cm = COALESCE($8, talla_nacimiento_cm),
        semanas_gestacion_nac = COALESCE($9, semanas_gestacion_nac),
        tipo_sangre = COALESCE($10, tipo_sangre),
        alergias = COALESCE($11, alergias),
        condiciones_cronicas = COALESCE($12, condiciones_cronicas),
        pediatra_nombre = COALESCE($13, pediatra_nombre),
        centro_salud = COALESCE($14, centro_salud),
        foto_perfil = COALESCE($15, foto_perfil)
      WHERE id = $1 RETURNING *
    `;
    const updated = await query(updateQuery, [
      id, nombre, apodo, sexo, fecha_nacimiento, prevision_salud,
      peso_nacimiento_g, talla_nacimiento_cm, semanas_gestacion_nac,
      tipo_sangre, alergias, condiciones_cronicas, pediatra_nombre, centro_salud,
      foto_perfil
    ]);

    // Audit
    const highImportanceFields = ['tipo_sangre', 'alergias', 'condiciones_cronicas'];
    for (const key of Object.keys(req.body)) {
      if (key !== 'confirmado' && req.body[key] !== oldData[key]) {
        const importancia = highImportanceFields.includes(key) ? 'alto' : 'normal';
        await query(
          `INSERT INTO auditoria_perfil_bebe (id_perfil_bebe, id_usuario_ejecutor, tipo_accion, campo_modificado, valor_anterior, valor_nuevo, nivel_importancia)
           VALUES ($1, $2, 'edicion_dato', $3, $4, $5, $6)`,
          [id, userId, key, JSON.stringify(oldData[key]), JSON.stringify(req.body[key]), importancia]
        );
      }
    }

    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
};


export const subirFotoPerfil = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      res.status(400).json({ error: "No se recibió ninguna imagen" });
      return;
    }

    // Mismo chequeo de permisos que actualizarPerfil (dueño o acceso ver_editar/papa/abuela)
    const accessCheck = await query(
      `SELECT 1 FROM perfiles_bebes pb
       LEFT JOIN accesos_compartidos_bebe acb ON acb.id_perfil_bebe = pb.id AND acb.id_usuario_invitado = $2 AND acb.estado = 'activo'
       WHERE pb.id = $1 AND (pb.usuario_id = $2 OR acb.nivel_permiso = 'ver_editar')`,
      [id, userId]
    );

    if (accessCheck.rows.length === 0) {
      res.status(403).json({ error: 'No tienes permiso para editar este perfil' });
      return;
    }

    // Guardamos la imagen como data URI base64 directo en la fila de la base
    // de datos (no en disco): así sobrevive a los redeploys de Render, que
    // borran el filesystem local en cada despliegue.
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    const updated = await query(
      `UPDATE perfiles_bebes SET foto_perfil = $2 WHERE id = $1 RETURNING foto_perfil`,
      [id, dataUri]
    );

    await query(
      `INSERT INTO auditoria_perfil_bebe (id_perfil_bebe, id_usuario_ejecutor, tipo_accion, campo_modificado, nivel_importancia)
       VALUES ($1, $2, 'edicion_dato', 'foto_perfil', 'normal')`,
      [id, userId]
    );

    res.json({ foto_perfil: updated.rows[0].foto_perfil });
  } catch (error) {
    console.error("Error en subirFotoPerfil:", error);
    res.status(500).json({ error: 'Error al subir la foto' });
  }
};

export const listarAccesos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Only owner
    const ownerCheck = await query(`SELECT 1 FROM perfiles_bebes WHERE id = $1 AND usuario_id = $2`, [id, userId]);
    if (ownerCheck.rows.length === 0) {
      res.status(403).json({ error: 'Solo el dueño puede listar accesos' });
      return;
    }

    const result = await query(
      `SELECT a.*, u.nombre, u.apellidos FROM accesos_compartidos_bebe a LEFT JOIN usuarios u ON a.id_usuario_invitado = u.id WHERE a.id_perfil_bebe = $1 AND a.estado != 'revocado' ORDER BY a.fecha_invitacion DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar accesos' });
  }
};

export const invitarAcceso = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const { correo_invitado, nivel_permiso } = req.body;

    const ownerCheck = await query(`SELECT p.nombre as nombre_bebe, u.nombre as nombre_familiar FROM perfiles_bebes p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = $1 AND p.usuario_id = $2`, [id, userId]);
    if (ownerCheck.rows.length === 0) {
      res.status(403).json({ error: 'Solo el dueño puede invitar' });
      return;
    }
    const { nombre_bebe, nombre_familiar } = ownerCheck.rows[0];

    const userCheck = await query(`SELECT id FROM usuarios WHERE email = $1`, [correo_invitado]);
    const id_usuario_invitado = userCheck.rows.length > 0 ? userCheck.rows[0].id : null;

    const estado = id_usuario_invitado ? 'activo' : 'pendiente';

    const insert = await query(
      `INSERT INTO accesos_compartidos_bebe (id_perfil_bebe, id_usuario_invitado, correo_invitado, nivel_permiso, invitado_por, fecha_expiracion, estado) 
       VALUES ($1, $2, $3, $4, $5, now() + interval '7 days', $6) RETURNING *`,
      [id, id_usuario_invitado, correo_invitado, nivel_permiso, userId, estado]
    );

    // Run email sending in the background without awaiting to prevent hanging the API request
    sendInvitationAlert(correo_invitado, nombre_familiar, nombre_bebe).catch(emailError => {
      console.error("Error sending email, but invitation was created:", emailError);
    });

    await query(
      `INSERT INTO auditoria_perfil_bebe (id_perfil_bebe, id_usuario_ejecutor, tipo_accion, nivel_importancia) VALUES ($1, $2, 'invitacion_creada', 'normal')`,
      [id, userId]
    );

    res.json(insert.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al invitar' });
  }
};

export const modificarPermiso = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, idAcceso } = req.params;
    const userId = (req as any).user.id;
    const { nivel_permiso, ver_salud, ver_galeria, ver_datos_personales, recibir_notificaciones } = req.body;

    const ownerCheck = await query(`SELECT 1 FROM perfiles_bebes WHERE id = $1 AND usuario_id = $2`, [id, userId]);
    if (ownerCheck.rows.length === 0) {
      res.status(403).json({ error: 'Solo el dueño puede modificar permisos' });
      return;
    }

    const updated = await query(
      `UPDATE accesos_compartidos_bebe SET nivel_permiso = COALESCE($1, nivel_permiso), ver_salud = COALESCE($2, ver_salud), ver_galeria = COALESCE($3, ver_galeria), ver_datos_personales = COALESCE($4, ver_datos_personales), recibir_notificaciones = COALESCE($5, recibir_notificaciones) WHERE id = $6 AND id_perfil_bebe = $7 RETURNING *`,
      [nivel_permiso, ver_salud, ver_galeria, ver_datos_personales, recibir_notificaciones, idAcceso, id]
    );

    await query(
      `INSERT INTO auditoria_perfil_bebe (id_perfil_bebe, id_usuario_ejecutor, tipo_accion, nivel_importancia) VALUES ($1, $2, 'permiso_modificado', 'normal')`,
      [id, userId]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al modificar permiso' });
  }
};

export const revocarAcceso = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, idAcceso } = req.params;
    const userId = (req as any).user.id;

    const ownerCheck = await query(`SELECT 1 FROM perfiles_bebes WHERE id = $1 AND usuario_id = $2`, [id, userId]);
    if (ownerCheck.rows.length === 0) {
      res.status(403).json({ error: 'Solo el dueño puede revocar accesos' });
      return;
    }

    await query(
      `UPDATE accesos_compartidos_bebe SET estado = 'revocado' WHERE id = $1 AND id_perfil_bebe = $2`,
      [idAcceso, id]
    );

    await query(
      `INSERT INTO auditoria_perfil_bebe (id_perfil_bebe, id_usuario_ejecutor, tipo_accion, nivel_importancia) VALUES ($1, $2, 'acceso_revocado', 'normal')`,
      [id, userId]
    );

    res.json({ message: 'Acceso revocado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al revocar acceso' });
  }
};


export const listarAuditoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Antes este endpoint no verificaba nada: cualquier usuario autenticado
    // podía leer el historial de auditoría (incluye datos de salud como
    // tipo de sangre, alergias, condiciones crónicas) de CUALQUIER bebé
    // solo conociendo su UUID. Ahora exige ser dueño o tener acceso activo.
    const accessCheck = await query(
      `SELECT 1 FROM perfiles_bebes pb
       LEFT JOIN accesos_compartidos_bebe acb ON acb.id_perfil_bebe = pb.id AND acb.id_usuario_invitado = $2 AND acb.estado = 'activo'
       WHERE pb.id = $1 AND (pb.usuario_id = $2 OR acb.id IS NOT NULL)`,
      [id, userId]
    );

    if (accessCheck.rows.length === 0) {
      res.status(403).json({ error: 'No tienes permiso para ver la auditoría de este perfil' });
      return;
    }

    const result = await query(
      `SELECT a.*, u.nombre, u.apellidos FROM auditoria_perfil_bebe a JOIN usuarios u ON a.id_usuario_ejecutor = u.id WHERE a.id_perfil_bebe = $1 ORDER BY a.fecha_hora_utc DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar auditoría' });
  }
};
