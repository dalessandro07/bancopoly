'use server'

/**
 * Server action para subir una imagen a imgbb
 * @param image - Base64 string (con o sin prefijo data:)
 * @returns URL de la imagen subida o error
 */
export async function actionUploadImageToImgbb(
  image: string
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    if (!image) {
      return { success: false, error: 'No se proporcionó una imagen' }
    }

    // Si es base64 con prefijo data:, extraer solo la parte del base64
    let imageData = image
    if (image.startsWith('data:')) {
      const base64Index = image.indexOf('base64,')
      if (base64Index !== -1) {
        imageData = image.substring(base64Index + 7) // +7 para saltar "base64,"
      }
    }

    // Si es una URL existente, retornarla directamente
    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      return { success: true, url: imageData }
    }

    const apiKey = process.env.IMGBB_API_KEY

    if (!apiKey) {
      return { success: false, error: 'IMGBB_API_KEY no está configurada' }
    }

    const imgbbFormData = new FormData()
    imgbbFormData.append('key', apiKey)
    imgbbFormData.append('image', imageData)

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: imgbbFormData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error:
          errorData.error?.message ||
          `Error al subir imagen: ${response.statusText}`,
      }
    }

    const data = await response.json()

    if (!data.success || !data.data?.url) {
      return { success: false, error: 'Error al subir imagen: respuesta inválida' }
    }

    return { success: true, url: data.data.url }
  } catch (error) {
    console.error('Error al subir imagen:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al subir imagen',
    }
  }
}
