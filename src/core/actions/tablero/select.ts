'use server'

import { db } from '@/src/core/lib/db'
import { player, tablero, transaction, user } from '@/src/core/lib/db/schema'
import { and, desc, eq, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/src/core/lib/auth'

/**
 * Obtiene todos los tableros del usuario (como creador o como jugador)
 */
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
          eq(tablero.userId, session.user.id),
          eq(player.userId, session.user.id)
        )
      )

    return { success: true, data: tableros }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al obtener los tableros del usuario' }
  }
}

/**
 * Obtiene un tablero por su ID con todos sus jugadores y el creador
 */
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

/**
 * Obtiene todas las transacciones del tablero (públicas para todos)
 */
export async function actionGetAllTableroTransactions (tableroId: string) {
  //* 1. Obtener la sesión del usuario
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false, error: 'Usuario no autenticado' }
  }

  try {
    //* 2. Verificar que el usuario es jugador del tablero
    const userPlayer = await db.select().from(player).where(
      and(
        eq(player.tableroId, tableroId),
        eq(player.userId, session.user.id)
      )
    )

    if (!userPlayer[0]) {
      return { success: false, error: 'No eres jugador de este tablero' }
    }

    //* 3. Obtener todas las transacciones del tablero
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
      .where(eq(transaction.tableroId, tableroId))
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

/**
 * Obtiene las transacciones de un jugador específico
 */
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
        eq(player.userId, session.user.id)
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
          eq(player.isSystemPlayer, 1)
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

    //* 5. Obtener información de los jugadores involucrados
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

    //* 6. Enriquecer las transacciones con información de los jugadores
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

/**
 * Obtiene las estadísticas de un tablero cerrado
 */
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
          eq(player.isSystemPlayer, 0) // 0 = false en SQLite
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

    //* 10. Encontrar la mayor transferencia (solo tipo 'transfer')
    // Obtener todos los jugadores incluyendo del sistema para buscar en las transacciones
    const allPlayersIncludingSystem = await db
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
      .where(eq(player.tableroId, tableroId))

    const transferTransactions = allTransactions.filter(t => t.type === 'transfer' && t.fromPlayerId && t.toPlayerId)
    let largestTransfer = null

    if (transferTransactions.length > 0) {
      const maxTransfer = transferTransactions.reduce((max, t) => t.amount > max.amount ? t : max, transferTransactions[0])

      // Obtener información del jugador que hizo la transferencia (incluyendo jugadores del sistema)
      const fromPlayerData = allPlayersIncludingSystem.find(({ player }) => player.id === maxTransfer.fromPlayerId)
      const toPlayerData = allPlayersIncludingSystem.find(({ player }) => player.id === maxTransfer.toPlayerId)

      // Solo incluir si ambos jugadores no son del sistema (solo transferencias entre jugadores reales)
      if (fromPlayerData && toPlayerData && !fromPlayerData.player.isSystemPlayer && !toPlayerData.player.isSystemPlayer) {
        largestTransfer = {
          amount: maxTransfer.amount,
          description: maxTransfer.description || null,
          fromPlayer: {
            id: fromPlayerData.player.id,
            name: fromPlayerData.player.name,
            user: fromPlayerData.user || null,
          },
          toPlayer: {
            id: toPlayerData.player.id,
            name: toPlayerData.player.name,
            user: toPlayerData.user || null,
          },
        }
      }
    }

    return {
      success: true,
      data: {
        ranking,
        winner,
        loser,
        totalTransactions,
        totalMoneyInCirculation,
        playersCount: allPlayers.length,
        largestTransfer,
      },
    }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Error al obtener las estadísticas' }
  }
}
