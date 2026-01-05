'use server'

import { db } from '@/src/core/lib/db'
import { player, tablero } from '@/src/core/lib/db/schema'
import { auth } from '@/src/core/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { emitTableroDeleted, emitPlayerDeleted } from './utils'

/**
 * Elimina un tablero (solo el creador puede hacerlo)
 */
export async function actionDeleteTablero (slug: string) {
  //* 1. Obtener la sesión del usuario
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  //* 2. Obtener el tablero
  const tableroData = await db.select().from(tablero).where(
    and(
      eq(tablero.id, slug),
      eq(tablero.userId, session.user.id)
    )
  )

  if (!tableroData[0]) {
    return { success: false, error: 'Tablero no encontrado' }
  }

  //* 3. Eliminar el tablero
  try {
    await db.delete(tablero).where(eq(tablero.id, slug))

    // Emitir evento de realtime
    await emitTableroDeleted(slug)

    return { success: true, message: 'Tablero eliminado correctamente' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al eliminar el tablero' }
  } finally {
    redirect('/')
  }
}

/**
 * Elimina un jugador de un tablero (solo el creador puede hacerlo)
 */
export async function actionDeletePlayer (playerId: string, tableroId: string) {
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
    return { success: false, error: 'No tienes permisos para eliminar jugadores de este tablero' }
  }

  //* 3. Verificar que el jugador existe y pertenece al tablero
  const playerData = await db.select().from(player).where(
    and(
      eq(player.id, playerId),
      eq(player.tableroId, tableroId)
    )
  )

  if (!playerData[0]) {
    return { success: false, error: 'Jugador no encontrado' }
  }

  //* 4. Verificar que no es un jugador del sistema
  if (playerData[0].isSystemPlayer === 1) {
    return { success: false, error: 'No se pueden eliminar jugadores del sistema' }
  }

  //* 5. Eliminar el jugador
  try {
    await db.delete(player).where(eq(player.id, playerId))

    // Emitir evento de realtime
    await emitPlayerDeleted(playerId, tableroId)

    return { success: true, message: 'Jugador eliminado correctamente' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al eliminar el jugador' }
  } finally {
    revalidatePath(`/tablero/${tableroId}`)
  }
}

/**
 * Permite a un jugador salir de un tablero (no puede ser el creador)
 */
export async function actionLeaveTablero (tableroId: string) {
  //* 1. Obtener la sesión del usuario
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  //* 2. Verificar que el usuario es jugador del tablero (no creador)
  const tableroData = await db.select().from(tablero).where(eq(tablero.id, tableroId))

  if (!tableroData[0]) {
    return { success: false, error: 'Tablero no encontrado' }
  }

  //* 3. Verificar que el usuario no es el creador
  if (tableroData[0].userId === session.user.id) {
    return { success: false, error: 'El creador del tablero no puede salir de la sala' }
  }

  //* 4. Buscar el jugador del usuario en este tablero
  const playerData = await db.select().from(player).where(
    and(
      eq(player.tableroId, tableroId),
      eq(player.userId, session.user.id)
    )
  )

  if (!playerData[0]) {
    return { success: false, error: 'No estás unido a este tablero' }
  }

  //* 5. Eliminar el jugador
  try {
    const deletedPlayerId = playerData[0].id
    await db.delete(player).where(eq(player.id, deletedPlayerId))

    // Emitir evento de realtime
    await emitPlayerDeleted(deletedPlayerId, tableroId)

    return { success: true, message: 'Has salido del tablero' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al salir del tablero' }
  } finally {
    revalidatePath(`/tablero/${tableroId}`)
    redirect('/')
  }
}
