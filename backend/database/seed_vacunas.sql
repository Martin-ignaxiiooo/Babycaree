-- Limpiamos la tabla primero para evitar duplicados
TRUNCATE TABLE vacunas_calendario RESTART IDENTITY CASCADE;

INSERT INTO vacunas_calendario (nombre, meses_edad, obligatoria, enfermedades_previene) VALUES
('BCG', 0, true, 'Tuberculosis'),
('Hepatitis B', 0, true, 'Hepatitis B'),
('Hexavalente', 2, true, 'Hepatitis B, Difteria, Tétanos, Tos Convulsiva, Haemophilus influenzae tipo b (Hib), Polio'),
('Neumocócica conjugada', 2, true, 'Enfermedades por Neumococo'),
('Hexavalente', 4, true, 'Hepatitis B, Difteria, Tétanos, Tos Convulsiva, Hib, Polio'),
('Neumocócica conjugada', 4, true, 'Enfermedades por Neumococo'),
('Hexavalente', 6, true, 'Hepatitis B, Difteria, Tétanos, Tos Convulsiva, Hib, Polio'),
('Neumocócica conjugada', 6, true, 'Enfermedades por Neumococo'),
('Tresvírica', 12, true, 'Sarampión, Rubéola, Parotiditis'),
('Meningocócica recombinante', 12, true, 'Enfermedad Meningocócica por serogrupo B'),
('Neumocócica conjugada', 12, true, 'Enfermedades por Neumococo'),
('Hexavalente', 18, true, 'Hepatitis B, Difteria, Tétanos, Tos Convulsiva, Hib, Polio'),
('Hepatitis A', 18, true, 'Hepatitis A'),
('Varicela', 18, true, 'Varicela'),
('Fiebre Amarilla', 18, false, 'Fiebre Amarilla (Solo Isla de Pascua)');
