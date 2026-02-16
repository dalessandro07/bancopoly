'use server'

import { db } from '@/src/core/lib/db'
import { player, tablero } from '@/src/core/lib/db/schema'
import { auth } from '@/src/core/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { emitPlayerInserted } from './utils'

/**
 * Crea un nuevo tablero con jugadores del sistema (Banco y Parada Libre)
 */
export async function actionCreateTablero (initialState: unknown, formData: FormData) {
  //* 1. Obtener la sesión del usuario
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  // Verificar que el usuario no sea anónimo
  if (session.user.isAnonymous === true) {
    return { success: false, error: 'Los usuarios invitados no pueden crear tableros. Por favor, inicia sesión con una cuenta para crear tableros.' }
  }

  //* 2. Obtener el nombre del tablero
  const name = formData.get('name') as string
  const userId = session.user.id

  //* 3. Crear el tablero
  let newTableroId: string | null = null
  let success = false

  try {
    const newTablero = await db.insert(tablero).values({
      id: crypto.randomUUID(),
      name,
      userId,
    }).returning()

    if (!newTablero[0]) {
      return { success: false, error: 'Error al crear el tablero' }
    }

    newTableroId = newTablero[0].id

    // Crear jugadores del sistema (Banco y Parada Libre) y el jugador del creador
    const systemPlayers = await db.insert(player).values([
      {
        id: crypto.randomUUID(),
        tableroId: newTablero[0].id,
        userId: null,
        name: 'Banco',
        balance: 999999999, // Balance infinito para el banco
        isSystemPlayer: 1, // 1 = true en SQLite
        systemPlayerType: 'bank',
      },
      {
        id: crypto.randomUUID(),
        tableroId: newTablero[0].id,
        userId: null,
        name: 'Parada Libre',
        balance: 0,
        isSystemPlayer: 1, // 1 = true en SQLite
        systemPlayerType: 'free_parking',
      },
      // Crear el jugador del creador
      {
        id: crypto.randomUUID(),
        tableroId: newTablero[0].id,
        userId: userId,
        name: session.user.name as string,
        balance: 1500,
        isSystemPlayer: 0, // 0 = false en SQLite
        systemPlayerType: null,
      }
    ]).returning()

    // Emitir eventos de realtime para los jugadores creados
    for (const newPlayer of systemPlayers) {
      await emitPlayerInserted(newPlayer)
    }

    success = true
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al crear el tablero' }
  } finally {
    revalidatePath('/')
    if (success && newTableroId) {
      redirect(`/tablero/${newTableroId}`)
    }
  }
}

/**
 * Permite a un usuario unirse a un tablero existente
 */
export async function actionJoinTablero (initialState: unknown, formData: FormData) {
  //* 1. Obtener la sesión del usuario
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  const name = (formData.get('name') as string)?.trim()
  const tableroId = formData.get('tableroId') as string

  if (!name || !tableroId) {
    return { success: false, error: 'Faltan datos requeridos' }
  }
  if (name.length > 50) {
    return { success: false, error: 'El nombre no puede superar 50 caracteres' }
  }

  const [tableroData, existingPlayer] = await Promise.all([
    db.select().from(tablero).where(eq(tablero.id, tableroId)),
    db.select().from(player).where(
      and(eq(player.tableroId, tableroId), eq(player.userId, session.user.id))
    ),
  ])

  if (!tableroData[0]) {
    return { success: false, error: 'El tablero no existe' }
  }
  if (tableroData[0].isEnded === 1) {
    return { success: false, error: 'El tablero está cerrado, no puedes unirte' }
  }
  if (existingPlayer[0]) {
    return { success: false, error: 'Ya estás unido a este tablero' }
  }

  try {
    const newPlayer = await db.insert(player).values({
      id: crypto.randomUUID(),
      tableroId,
      userId: session.user.id,
      name,
      isSystemPlayer: 0, // 0 = false en SQLite
      systemPlayerType: null,
    }).returning()

    // Emitir evento de realtime
    if (newPlayer[0]) {
      await emitPlayerInserted(newPlayer[0])
    }

    return { success: true, data: newPlayer }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al unirse al tablero' }
  } finally {
    revalidatePath(`/tablero/${tableroId}`)
  }
}
