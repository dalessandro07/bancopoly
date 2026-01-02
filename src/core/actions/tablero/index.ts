'use server'

import { auth } from '@/src/core/lib/auth'
import { db } from '@/src/core/lib/db'
import { player, tablero, user, type TTablero } from '@/src/core/lib/db/schema'
import { and, eq, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

//* SELECT

export async function actionGetTablerosFromUser () {
  //* 1. Obtener la sesión del usuario
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  try {
    // Obtener tableros donde el usuario es creador o es jugador
    const tableros = await db
      .selectDistinct({
        id: tablero.id,
        name: tablero.name,
        userId: tablero.userId,
        freeParkingEnabled: tablero.freeParkingEnabled,
        isClosed: tablero.isClosed,
        isEnded: tablero.isEnded,
        createdAt: tablero.createdAt,
        updatedAt: tablero.updatedAt,
      })
      .from(tablero)
      .leftJoin(player, eq(player.tableroId, tablero.id))
      .where(
        or(
          eq(tablero.userId, session?.user?.id as string),
          eq(player.userId, session?.user?.id as string)
        )
      )

    return { success: true, data: tableros }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al obtener los tableros del usuario' }
  }
}

export async function actionGetTableroById (slug: string) {
  try {
    //* 1. Obtener el tablero
    const tableroData = await db.select().from(tablero).where(eq(tablero.id, slug))

    if (!tableroData[0]) {
      return { success: false, error: 'Tablero no encontrado' }
    }

    //* 2. Obtener los jugadores y el creador
    const [players, creator] = await Promise.all([
      db.select().from(player).where(eq(player.tableroId, tableroData[0].id)),
      db.select().from(user).where(eq(user.id, tableroData[0].userId)),
    ])

    //* 3. Retornar los datos
    return {
      tablero: tableroData[0],
      players: players,
      creator: creator[0],
    }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al obtener el tablero' }
  }
}

//* INSERT

export async function actionCreateTablero (initialState: unknown, formData: FormData) {
  //* 1. Obtener la sesión del usuario
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  //* 2. Obtener el nombre del tablero
  const name = formData.get('name') as string
  const userId = session?.user?.id as string

  //* 3. Crear el tablero
  let newTablero: TTablero[] = []

  try {
    newTablero = await db.insert(tablero).values({
      id: crypto.randomUUID(),
      name,
      userId,
    }).returning()

    await db.insert(player).values({
      id: crypto.randomUUID(),
      tableroId: newTablero[0].id,
      userId: userId,
      name: session?.user?.name as string,
      balance: 1500,
    })
  } catch (error) {
    console.error(error)
    return { error: 'Error al crear el tablero' }
  } finally {
    console.log(newTablero)
    revalidatePath('/')
    redirect(`/tablero/${newTablero[0].id}`)
  }
}

//* UPDATE

export async function actionJoinTablero (initialState: unknown, formData: FormData) {
  //* 1. Obtener la sesión del usuario
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  //* 2. Obtener el nombre del jugador
  const name = formData.get('name') as string
  const tableroId = formData.get('tableroId') as string

  //* 3. Unirse al tablero
  try {
    const newPlayer = await db.insert(player).values({
      id: crypto.randomUUID(),
      tableroId,
      userId: session?.user?.id,
      name,
    }).returning()

    return { success: true, data: newPlayer }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al unirse al tablero' }
  } finally {
    revalidatePath(`/tablero/${tableroId}`)
  }
}

//* DELETE

export async function actionDeleteTablero (slug: string) {
  //* 1. Obtener la sesión del usuario
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  //* 2. Obtener el tablero
  const tableroData = await db.select().from(tablero).where(and(eq(tablero.id, slug), eq(tablero.userId, session?.user?.id as string)))

  if (!tableroData) {
    return { success: false, error: 'Tablero no encontrado' }
  }

  //* 3. Eliminar el tablero
  try {
    await db.delete(tablero).where(eq(tablero.id, slug))
    return { success: true, message: 'Tablero eliminado correctamente' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al eliminar el tablero' }
  }
  finally {
    redirect('/')
  }
}

export async function actionDeletePlayer (playerId: string, tableroId: string) {
  //* 1. Obtener la sesión del usuario
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  //* 2. Verificar que el usuario es el creador del tablero
  const tableroData = await db.select().from(tablero).where(and(eq(tablero.id, tableroId), eq(tablero.userId, session?.user?.id as string)))

  if (!tableroData[0]) {
    return { success: false, error: 'No tienes permisos para eliminar jugadores de este tablero' }
  }

  //* 3. Verificar que el jugador existe y pertenece al tablero
  const playerData = await db.select().from(player).where(and(eq(player.id, playerId), eq(player.tableroId, tableroId)))

  if (!playerData[0]) {
    return { success: false, error: 'Jugador no encontrado' }
  }

  //* 4. Eliminar el jugador
  try {
    await db.delete(player).where(eq(player.id, playerId))
    return { success: true, message: 'Jugador eliminado correctamente' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al eliminar el jugador' }
  } finally {
    revalidatePath(`/tablero/${tableroId}`)
  }
}

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
  if (tableroData[0].userId === session?.user?.id) {
    return { success: false, error: 'El creador del tablero no puede salir de la sala' }
  }

  //* 4. Buscar el jugador del usuario en este tablero
  const playerData = await db.select().from(player).where(and(eq(player.tableroId, tableroId), eq(player.userId, session?.user?.id as string)))

  if (!playerData[0]) {
    return { success: false, error: 'No estás unido a este tablero' }
  }

  //* 5. Eliminar el jugador
  try {
    await db.delete(player).where(eq(player.id, playerData[0].id))
    return { success: true, message: 'Has salido del tablero' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al salir del tablero' }
  } finally {
    revalidatePath(`/tablero/${tableroId}`)
    redirect('/')
  }
}
