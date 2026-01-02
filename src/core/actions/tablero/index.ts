'use server'

import { auth } from '@/src/core/lib/auth'
import { db } from '@/src/core/lib/db'
import { player, tablero, transaction, user, type TTablero } from '@/src/core/lib/db/schema'
import { and, desc, eq, or } from 'drizzle-orm'
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

    //* 2. Obtener los jugadores con información de usuario y el creador
    const playersData = await db
      .select({
        player: player,
        user: user,
      })
      .from(player)
      .leftJoin(user, eq(player.userId, user.id))
      .where(eq(player.tableroId, tableroData[0].id))

    const players = playersData.map(({ player, user }) => ({
      ...player,
      user: user || null,
    }))

    const creator = await db.select().from(user).where(eq(user.id, tableroData[0].userId))

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

export async function actionGetPlayerTransactions (tableroId: string, playerId: string) {
  //* 1. Obtener la sesión del usuario
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  try {
    //* 2. Verificar que el jugador pertenece al tablero y al usuario
    const playerData = await db.select().from(player).where(
      and(
        eq(player.id, playerId),
        eq(player.tableroId, tableroId),
        eq(player.userId, session?.user?.id as string)
      )
    )

    if (!playerData[0]) {
      return { success: false, error: 'No tienes acceso a este jugador' }
    }

    //* 3. Obtener IDs de jugadores del sistema (para todos los usuarios)
    const systemPlayers = await db
      .select()
      .from(player)
      .where(
        and(
          eq(player.tableroId, tableroId),
          eq(player.isSystemPlayer, true)
        )
      )
    const systemPlayerIds = systemPlayers.map(p => p.id)

    //* 4. Obtener transacciones donde el jugador es emisor o receptor
    // Todos los usuarios ven transacciones del banco y parada libre
    const transactionConditions = [
      eq(transaction.fromPlayerId, playerId),
      eq(transaction.toPlayerId, playerId)
    ]

    if (systemPlayerIds.length > 0) {
      systemPlayerIds.forEach(systemId => {
        transactionConditions.push(eq(transaction.fromPlayerId, systemId))
        transactionConditions.push(eq(transaction.toPlayerId, systemId))
      })
    }

    const transactions = await db
      .select({
        id: transaction.id,
        tableroId: transaction.tableroId,
        fromPlayerId: transaction.fromPlayerId,
        toPlayerId: transaction.toPlayerId,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        createdAt: transaction.createdAt,
      })
      .from(transaction)
      .where(
        and(
          eq(transaction.tableroId, tableroId),
          or(...transactionConditions)
        )
      )
      .orderBy(desc(transaction.createdAt))

    //* 4. Obtener información de los jugadores involucrados
    const playerIds = new Set<string>()
    transactions.forEach(t => {
      if (t.fromPlayerId) playerIds.add(t.fromPlayerId)
      if (t.toPlayerId) playerIds.add(t.toPlayerId)
    })

    const playersData = await db
      .select({
        player: player,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(player)
      .leftJoin(user, eq(player.userId, user.id))
      .where(
        or(
          ...Array.from(playerIds).map(id => eq(player.id, id))
        )
      )

    const playersMap = new Map(playersData.map(({ player, user }) => [player.id, {
      ...player,
      user: user || null,
    }]))

    //* 5. Enriquecer las transacciones con información de los jugadores
    const enrichedTransactions = transactions.map(t => ({
      ...t,
      fromPlayer: t.fromPlayerId ? playersMap.get(t.fromPlayerId) : null,
      toPlayer: t.toPlayerId ? playersMap.get(t.toPlayerId) : null,
    }))

    return { success: true, data: enrichedTransactions }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al obtener las transacciones' }
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

    // Crear jugadores del sistema (Banco y Parada Libre)
    await db.insert(player).values([
      {
        id: crypto.randomUUID(),
        tableroId: newTablero[0].id,
        userId: null,
        name: 'Banco',
        balance: 999999999, // Balance infinito para el banco
        isSystemPlayer: true,
        systemPlayerType: 'bank',
      },
      {
        id: crypto.randomUUID(),
        tableroId: newTablero[0].id,
        userId: null,
        name: 'Parada Libre',
        balance: 0,
        isSystemPlayer: true,
        systemPlayerType: 'free_parking',
      },
      // Crear el jugador del creador
      {
        id: crypto.randomUUID(),
        tableroId: newTablero[0].id,
        userId: userId,
        name: session?.user?.name as string,
        balance: 1500,
        isSystemPlayer: false,
        systemPlayerType: null,
      }
    ])
  } catch (error) {
    console.error(error)
    return { error: 'Error al crear el tablero' }
  } finally {
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

  //* 4. Verificar que no es un jugador del sistema
  if (playerData[0].isSystemPlayer) {
    return { success: false, error: 'No se pueden eliminar jugadores del sistema' }
  }

  //* 5. Eliminar el jugador
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
      eq(tablero.userId, session?.user?.id as string)
    )
  )

  if (!tableroData[0]) {
    return { success: false, error: 'No tienes permisos para cerrar este tablero' }
  }

  //* 3. Verificar que el tablero no esté ya cerrado
  if (tableroData[0].isEnded) {
    return { success: false, error: 'El tablero ya está cerrado' }
  }

  //* 4. Cerrar el tablero
  try {
    await db.update(tablero)
      .set({ isEnded: true })
      .where(eq(tablero.id, tableroId))

    return { success: true, message: 'Tablero cerrado correctamente' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al cerrar el tablero' }
  } finally {
    revalidatePath(`/tablero/${tableroId}`)
  }
}

export async function actionGetTableroStats (tableroId: string) {
  //* 1. Obtener la sesión del usuario
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  try {
    //* 2. Verificar que el tablero existe y está cerrado
    const tableroData = await db.select().from(tablero).where(eq(tablero.id, tableroId))

    if (!tableroData[0]) {
      return { success: false, error: 'Tablero no encontrado' }
    }

    //* 3. Obtener todos los jugadores (excluyendo jugadores del sistema)
    const allPlayers = await db
      .select({
        player: player,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(player)
      .leftJoin(user, eq(player.userId, user.id))
      .where(
        and(
          eq(player.tableroId, tableroId),
          eq(player.isSystemPlayer, false)
        )
      )

    //* 4. Obtener todas las transacciones del tablero
    const allTransactions = await db
      .select()
      .from(transaction)
      .where(eq(transaction.tableroId, tableroId))
      .orderBy(desc(transaction.createdAt))

    //* 5. Calcular estadísticas por jugador
    const playerStats = allPlayers.map(({ player, user }) => {
      const initialBalance = 1500 // Balance inicial en Monopoly
      const finalBalance = player.balance
      const netChange = finalBalance - initialBalance

      // Calcular transacciones enviadas y recibidas
      const sentTransactions = allTransactions.filter(t => t.fromPlayerId === player.id)
      const receivedTransactions = allTransactions.filter(t => t.toPlayerId === player.id)

      const totalSent = sentTransactions.reduce((sum, t) => sum + t.amount, 0)
      const totalReceived = receivedTransactions.reduce((sum, t) => sum + t.amount, 0)

      return {
        player: {
          ...player,
          user: user || null,
        },
        initialBalance,
        finalBalance,
        netChange,
        totalSent,
        totalReceived,
        transactionCount: sentTransactions.length + receivedTransactions.length,
      }
    })

    //* 6. Verificar que hay jugadores
    if (playerStats.length === 0) {
      return { success: false, error: 'No hay jugadores en este tablero' }
    }

    //* 7. Ordenar por balance final (ganador primero)
    const ranking = [...playerStats].sort((a, b) => b.finalBalance - a.finalBalance)

    //* 8. Encontrar ganador y perdedor
    const winner = ranking[0]
    const loser = ranking[ranking.length - 1]

    //* 9. Calcular estadísticas generales
    const totalTransactions = allTransactions.length
    const totalMoneyInCirculation = allTransactions
      .filter(t => t.type === 'transfer' || t.type === 'bank_give')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      success: true,
      data: {
        ranking,
        winner,
        loser,
        totalTransactions,
        totalMoneyInCirculation,
        playersCount: allPlayers.length,
      },
    }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al obtener las estadísticas' }
  }
}

//* TRANSACTIONS

export async function actionCreateTransaction (initialState: unknown, formData: FormData) {
  //* 1. Obtener la sesión del usuario
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  //* 2. Obtener datos del formulario
  const tableroId = formData.get('tableroId') as string
  const fromPlayerId = formData.get('fromPlayerId') as string
  const toPlayerId = formData.get('toPlayerId') as string
  const amount = parseInt(formData.get('amount') as string)
  const description = formData.get('description') as string

  //* 3. Validaciones
  if (!tableroId || !fromPlayerId || !toPlayerId || !amount) {
    return { success: false, error: 'Faltan datos requeridos' }
  }

  if (amount <= 0) {
    return { success: false, error: 'El monto debe ser mayor a 0' }
  }

  if (fromPlayerId === toPlayerId) {
    return { success: false, error: 'No puedes transferir dinero a ti mismo' }
  }

  //* 4. Verificar que el usuario es jugador del tablero
  const userPlayer = await db.select().from(player).where(
    and(
      eq(player.tableroId, tableroId),
      eq(player.userId, session?.user?.id as string)
    )
  )

  if (!userPlayer[0]) {
    return { success: false, error: 'No eres jugador de este tablero' }
  }

  //* 5. Obtener jugadores involucrados
  const [fromPlayer, toPlayer] = await Promise.all([
    db.select().from(player).where(eq(player.id, fromPlayerId)),
    db.select().from(player).where(eq(player.id, toPlayerId)),
  ])

  if (!fromPlayer[0] || !toPlayer[0]) {
    return { success: false, error: 'Jugador no encontrado' }
  }

  //* 6. Verificar que ambos jugadores pertenecen al mismo tablero
  if (fromPlayer[0].tableroId !== tableroId || toPlayer[0].tableroId !== tableroId) {
    return { success: false, error: 'Los jugadores deben pertenecer al mismo tablero' }
  }

  //* 7. Verificar que el jugador origen tiene suficiente dinero (excepto el Banco)
  if (!fromPlayer[0].isSystemPlayer && fromPlayer[0].balance < amount) {
    return { success: false, error: 'Saldo insuficiente' }
  }

  //* 8. Realizar la transacción
  try {
    // Actualizar balances
    await Promise.all([
      db.update(player)
        .set({ balance: fromPlayer[0].balance - amount })
        .where(eq(player.id, fromPlayerId)),
      db.update(player)
        .set({ balance: toPlayer[0].balance + amount })
        .where(eq(player.id, toPlayerId)),
    ])

    // Registrar la transacción
    await db.insert(transaction).values({
      id: crypto.randomUUID(),
      tableroId,
      fromPlayerId,
      toPlayerId,
      amount,
      type: 'transfer',
      description: description || null,
    })

    return { success: true, message: 'Transacción realizada correctamente' }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al realizar la transacción' }
  } finally {
    revalidatePath(`/tablero/${tableroId}`)
  }
}
