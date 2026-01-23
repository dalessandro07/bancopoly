import { actionUploadImageToImgbb } from '@/src/core/actions/user'

/**
 * Sube una imagen a imgbb y retorna la URL
 * @param image - Base64 string o File object
 * @returns URL de la imagen subida
 */
export async function uploadImageToImgbb(
  image: string | File
): Promise<string> {
  let imageData: string

  // Si es un File, convertirlo a base64
  if (image instanceof File) {
    imageData = await fileToBase64(image)
  } else if (image.startsWith('data:')) {
    // Ya es base64
    imageData = image
  } else if (image.startsWith('http://') || image.startsWith('https://')) {
    // Es una URL existente, retornarla directamente
    return image
  } else {
    // Asumir que es base64 sin el prefijo data:
    imageData = image
  }

  // Usar el server action para subir la imagen
  const result = await actionUploadImageToImgbb(imageData)

  if (!result.success) {
    throw new Error(result.error)
  }

  return result.url
}

/**
 * Convierte un File a base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
