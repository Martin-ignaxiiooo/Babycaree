"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listarAuditoria = exports.revocarAcceso = exports.modificarPermiso = exports.invitarAcceso = exports.listarAccesos = exports.actualizarPerfil = exports.getPerfil = void 0;
const db_1 = require("../config/db");
const mailer_1 = require("../config/mailer");
const getPerfil = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // TODO: Verify if user is owner or has active access
        const result = await (0, db_1.query)(`SELECT pb.*, tp.nombre_visible as nombre_prevision 
       FROM perfiles_bebes pb 
       LEFT JOIN tipos_prevision tp ON pb.prevision_salud = tp.codigo
       WHERE pb.id = $1 AND (pb.usuario_id = $2 OR EXISTS (SELECT 1 FROM accesos_compartidos_bebe WHERE id_perfil_bebe = $1 AND id_usuario_invitado = $2 AND estado = 'activo'))`, [id, userId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Perfil no encontrado o sin acceso' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener el perfil' });
    }
};
exports.getPerfil = getPerfil;
const actualizarPerfil = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { nombre, apodo, sexo, fecha_nacimiento, prevision_salud, peso_nacimiento_g, talla_nacimiento_cm, semanas_gestacion_nac, tipo_sangre, alergias, condiciones_cronicas, pediatra_nombre, centro_salud, confirmado } = req.body;
        // Check ownership or 'ver_editar' access
        const accessCheck = await (0, db_1.query)(`SELECT 1 FROM perfiles_bebes pb 
       LEFT JOIN accesos_compartidos_bebe acb ON acb.id_perfil_bebe = pb.id AND acb.id_usuario_invitado = $2 AND acb.estado = 'activo'
       WHERE pb.id = $1 AND (pb.usuario_id = $2 OR acb.nivel_permiso = 'ver_editar')`, [id, userId]);
        if (accessCheck.rows.length === 0) {
            res.status(403).json({ error: 'No tienes permiso para editar este perfil' });
            return;
        }
        if (fecha_nacimiento && new Date(fecha_nacimiento) > new Date()) {
            res.status(400).json({ error: 'La fecha de nacimiento no puede ser futura' });
            return;
        }
        const currentProfile = await (0, db_1.query)(`SELECT * FROM perfiles_bebes WHERE id = $1`, [id]);
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
        centro_salud = COALESCE($14, centro_salud)
      WHERE id = $1 RETURNING *
    `;
        const updated = await (0, db_1.query)(updateQuery, [
            id, nombre, apodo, sexo, fecha_nacimiento, prevision_salud,
            peso_nacimiento_g, talla_nacimiento_cm, semanas_gestacion_nac,
            tipo_sangre, alergias, condiciones_cronicas, pediatra_nombre, centro_salud
        ]);
        // Audit
        const highImportanceFields = ['tipo_sangre', 'alergias', 'condiciones_cronicas'];
        for (const key of Object.keys(req.body)) {
            if (key !== 'confirmado' && req.body[key] !== oldData[key]) {
                const importancia = highImportanceFields.includes(key) ? 'alto' : 'normal';
                await (0, db_1.query)(`INSERT INTO auditoria_perfil_bebe (id_perfil_bebe, id_usuario_ejecutor, tipo_accion, campo_modificado, valor_anterior, valor_nuevo, nivel_importancia)
           VALUES ($1, $2, 'edicion_dato', $3, $4, $5, $6)`, [id, userId, key, JSON.stringify(oldData[key]), JSON.stringify(req.body[key]), importancia]);
            }
        }
        res.json(updated.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al actualizar el perfil' });
    }
};
exports.actualizarPerfil = actualizarPerfil;
const listarAccesos = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Only owner
        const ownerCheck = await (0, db_1.query)(`SELECT 1 FROM perfiles_bebes WHERE id = $1 AND usuario_id = $2`, [id, userId]);
        if (ownerCheck.rows.length === 0) {
            res.status(403).json({ error: 'Solo el dueño puede listar accesos' });
            return;
        }
        const result = await (0, db_1.query)(`SELECT a.*, u.nombre, u.apellidos FROM accesos_compartidos_bebe a LEFT JOIN usuarios u ON a.id_usuario_invitado = u.id WHERE a.id_perfil_bebe = $1 AND a.estado != 'revocado' ORDER BY a.fecha_invitacion DESC`, [id]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al listar accesos' });
    }
};
exports.listarAccesos = listarAccesos;
const invitarAcceso = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { correo_invitado, nivel_permiso } = req.body;
        const ownerCheck = await (0, db_1.query)(`SELECT p.nombre as nombre_bebe, u.nombre as nombre_familiar FROM perfiles_bebes p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = $1 AND p.usuario_id = $2`, [id, userId]);
        if (ownerCheck.rows.length === 0) {
            res.status(403).json({ error: 'Solo el dueño puede invitar' });
            return;
        }
        const { nombre_bebe, nombre_familiar } = ownerCheck.rows[0];
        const userCheck = await (0, db_1.query)(`SELECT id FROM usuarios WHERE email = $1`, [correo_invitado]);
        const id_usuario_invitado = userCheck.rows.length > 0 ? userCheck.rows[0].id : null;
        const insert = await (0, db_1.query)(`INSERT INTO accesos_compartidos_bebe (id_perfil_bebe, id_usuario_invitado, correo_invitado, nivel_permiso, invitado_por, fecha_expiracion) 
       VALUES ($1, $2, $3, $4, $5, now() + interval '7 days') RETURNING *`, [id, id_usuario_invitado, correo_invitado, nivel_permiso, userId]);
        await (0, mailer_1.sendInvitationAlert)(correo_invitado, nombre_familiar, nombre_bebe);
        await (0, db_1.query)(`INSERT INTO auditoria_perfil_bebe (id_perfil_bebe, id_usuario_ejecutor, tipo_accion, nivel_importancia) VALUES ($1, $2, 'invitacion_creada', 'normal')`, [id, userId]);
        res.json(insert.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al invitar' });
    }
};
exports.invitarAcceso = invitarAcceso;
const modificarPermiso = async (req, res) => {
    try {
        const { id, idAcceso } = req.params;
        const userId = req.user.id;
        const { nivel_permiso, ver_salud, ver_galeria, ver_datos_personales, recibir_notificaciones } = req.body;
        const ownerCheck = await (0, db_1.query)(`SELECT 1 FROM perfiles_bebes WHERE id = $1 AND usuario_id = $2`, [id, userId]);
        if (ownerCheck.rows.length === 0) {
            res.status(403).json({ error: 'Solo el dueño puede modificar permisos' });
            return;
        }
        const updated = await (0, db_1.query)(`UPDATE accesos_compartidos_bebe SET nivel_permiso = COALESCE($1, nivel_permiso), ver_salud = COALESCE($2, ver_salud), ver_galeria = COALESCE($3, ver_galeria), ver_datos_personales = COALESCE($4, ver_datos_personales), recibir_notificaciones = COALESCE($5, recibir_notificaciones) WHERE id = $6 AND id_perfil_bebe = $7 RETURNING *`, [nivel_permiso, ver_salud, ver_galeria, ver_datos_personales, recibir_notificaciones, idAcceso, id]);
        await (0, db_1.query)(`INSERT INTO auditoria_perfil_bebe (id_perfil_bebe, id_usuario_ejecutor, tipo_accion, nivel_importancia) VALUES ($1, $2, 'permiso_modificado', 'normal')`, [id, userId]);
        res.json(updated.rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al modificar permiso' });
    }
};
exports.modificarPermiso = modificarPermiso;
const revocarAcceso = async (req, res) => {
    try {
        const { id, idAcceso } = req.params;
        const userId = req.user.id;
        const ownerCheck = await (0, db_1.query)(`SELECT 1 FROM perfiles_bebes WHERE id = $1 AND usuario_id = $2`, [id, userId]);
        if (ownerCheck.rows.length === 0) {
            res.status(403).json({ error: 'Solo el dueño puede revocar accesos' });
            return;
        }
        await (0, db_1.query)(`UPDATE accesos_compartidos_bebe SET estado = 'revocado' WHERE id = $1 AND id_perfil_bebe = $2`, [idAcceso, id]);
        await (0, db_1.query)(`INSERT INTO auditoria_perfil_bebe (id_perfil_bebe, id_usuario_ejecutor, tipo_accion, nivel_importancia) VALUES ($1, $2, 'acceso_revocado', 'normal')`, [id, userId]);
        res.json({ message: 'Acceso revocado' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al revocar acceso' });
    }
};
exports.revocarAcceso = revocarAcceso;
const listarAuditoria = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const result = await (0, db_1.query)(`SELECT a.*, u.nombre, u.apellidos FROM auditoria_perfil_bebe a JOIN usuarios u ON a.id_usuario_ejecutor = u.id WHERE a.id_perfil_bebe = $1 ORDER BY a.fecha_hora_utc DESC`, [id]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al listar auditoría' });
    }
};
exports.listarAuditoria = listarAuditoria;
