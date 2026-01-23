'use server'

import { db } from '@/src/core/lib/db'
import { user } from '@/src/core/lib/db/schema'
import { auth } from '@/src/core/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'

/**
 * Actualiza el perfil del usuario (nombre e imagen)
 */
export async function actionUpdateUserProfile (
  initialState: unknown,
  formData: FormData
) {
  //* 1. Obtener la sesión del usuario
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  //* 2. Obtener datos del formulario
  const name = formData.get('name') as string
  const image = formData.get('image') as string | null

  //* 3. Validaciones
  if (!name || !name.trim()) {
    return { success: false, error: 'El nombre es requerido' }
  }

  //* 4. Actualizar el usuario
  try {
    await db
      .update(user)
      .set({
        name: name.trim(),
        image: image || null,
        updatedAt: Date.now(),
      })
      .where(eq(user.id, session.user.id))

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al actualizar el perfil' }
  }
}
