// Requisitos mínimos de contraseña, compartidos entre register, resetPassword
// y updatePassword para que sean consistentes en toda la app.
export const passwordCumpleRequisitos = (password: string): boolean => {
  const hasLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNum = /[0-9]/.test(password);
  return hasLen && hasUpper && hasNum;
};

export const PASSWORD_REQUISITOS_MSG =
  "La contraseña debe tener al menos 8 caracteres, 1 mayúscula y 1 número.";

// Genera una contraseña temporal aleatoria (no predecible) para cuentas
// creadas por un administrador. Antes se usaba un valor fijo hardcodeado
// ("usuario2026" / "temporal2026") igual para todas las cuentas nuevas —
// como el repo es público, eso equivalía a una contraseña universal
// conocida por cualquiera que leyera el código fuente. Se devuelve en texto
// plano una sola vez en la respuesta de creación, para que el admin se la
// pueda comunicar a la persona (que debería cambiarla al entrar).
export const generarPasswordTemporal = (): string => {
  const mayusculas = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sin I/O para evitar confusión visual
  const minusculas = "abcdefghijkmnpqrstuvwxyz";
  const numeros = "23456789";
  const crypto = require("crypto");
  const pick = (chars: string) => chars[crypto.randomInt(0, chars.length)];

  const partes = [
    pick(mayusculas),
    pick(mayusculas),
    pick(numeros),
    pick(numeros),
    ...Array.from({ length: 8 }, () => pick(minusculas + mayusculas + numeros)),
  ];
  // Mezclar el orden para que no sea siempre "MM99xxxxxxxx"
  for (let i = partes.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [partes[i], partes[j]] = [partes[j], partes[i]];
  }
  return partes.join("");
};
