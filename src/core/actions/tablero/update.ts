'use server'

import { db } from '@/src/core/lib/db'
import { tablero } from '@/src/core/lib/db/schema'
import { auth } from '@/src/core/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { emitTableroUpdated } from './utils'

/**
 * Cierra un tablero (marca como terminado)
 */
export async function actionCloseTablero (tableroId: string) {
  //* 1. Obtener la sesión del usuario
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  //* 2. Verificar que el usuario es el creador del tablero
  const tableroData = await db.select().from(tablero).where(
    and(
      eq(tablero.id, tableroId),
      eq(tablero.userId, session.user.id)
    )
  )

  if (!tableroData[0]) {
    return { success: false, error: 'No tienes permisos para cerrar este tablero' }
  }

  //* 3. Verificar que el tablero no esté ya cerrado
  if (tableroData[0].isEnded === 1) {
    return { success: false, error: 'El tablero ya está cerrado' }
  }

  //* 4. Cerrar el tablero
  try {
    await db.update(tablero)
      .set({ isEnded: 1 }) // 1 = true en SQLite
      .where(eq(tablero.id, tableroId))

    // Emitir evento de realtime
    await emitTableroUpdated(tableroId, true)

    return { success: true, message: 'Tablero cerrado correctamente' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al cerrar el tablero' }
  } finally {
    revalidatePath(`/tablero/${tableroId}`)
  }
}
