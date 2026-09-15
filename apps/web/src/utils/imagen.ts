// Utilidades compartidas para las fotos de perfil (bebé y usuario).
//
// Las fotos se guardan en base64 dentro de la propia fila de la base de datos
// (el filesystem de Render es efímero), así que conviene comprimirlas en el
// navegador antes de subirlas en vez de mandar el archivo original.

export const TIPOS_IMAGEN_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/** Valor listo para el atributo `accept` de un `<input type="file">`. */
export const ACCEPT_IMAGEN = TIPOS_IMAGEN_PERMITIDOS.join(",");

/** Tamaño máximo del archivo original, antes de comprimir. */
export const MAX_BYTES_IMAGEN = 8 * 1024 * 1024;

/**
 * Valida tipo y peso del archivo elegido.
 * Devuelve el mensaje de error a mostrar, o null si el archivo sirve.
 */
export const validarImagen = (file: File): string | null => {
  if (!TIPOS_IMAGEN_PERMITIDOS.includes(file.type)) {
    return "Formato no soportado. Usa JPG, PNG, WEBP o GIF.";
  }
  if (file.size > MAX_BYTES_IMAGEN) {
    return "La imagen no puede pesar más de 8MB.";
  }
  return null;
};

/**
 * Redimensiona y comprime la imagen en el navegador para no guardar archivos
 * pesados en la base de datos. Mantiene la proporción original: el lado más
 * largo queda en `maxDim` píxeles.
 */
export const resizeImageFile = (
  file: File,
  maxDim = 480,
  quality = 0.82,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDim) {
        height = Math.round(height * (maxDim / width));
        width = maxDim;
      } else if (height >= width && height > maxDim) {
        width = Math.round(width * (maxDim / height));
        height = maxDim;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("No se pudo procesar la imagen"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) resolve(blob);
          else reject(new Error("No se pudo procesar la imagen"));
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = objectUrl;
  });
};
