-- Token de invitación por correo.
--
-- Hasta ahora, la invitación a ver el perfil de un bebé se amarraba
-- solo al correo del invitado: el correo enviado llevaba a /registro
-- (el onboarding completo, que pide elegir embarazo/nacido y CREAR un
-- bebé) y recién después, al entrar, el acceso se activaba por
-- coincidencia de correo.
--
-- Con este token, el enlace del correo es único y personal: permite
-- saltarse el onboarding de bebé (la persona invitada no viene a
-- registrar un bebé propio) y mostrar de antemano quién la invitó y a
-- qué bebé.
--
-- Nota: la tabla ya tiene 'token_qr_hash', pero esa columna es para
-- otra cosa (accesos temporales por QR, declarada pero nunca
-- implementada). Se usa una columna aparte para no mezclar ambos usos.

ALTER TABLE accesos_compartidos_bebe
  ADD COLUMN IF NOT EXISTS token_invitacion VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_accesos_token_invitacion
  ON accesos_compartidos_bebe (token_invitacion);
