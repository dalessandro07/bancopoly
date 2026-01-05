import { auth } from '@/src/core/lib/auth'
import { type TPlayer, type TTransaction } from '@/src/core/lib/db/schema'
import { realtime } from '@/src/core/lib/realtime'
import { headers } from 'next/headers'

/**
 * Obtiene la sesión del usuario autenticado
 */
export async function getSession () {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user?.id) {
    return { success: false as const, error: 'Usuario no autenticado' }
  }

  return { success: true as const, session, userId: session.user.id }
}

/**
 * Convierte un jugador de la base de datos al formato para eventos de realtime
 */
export function formatPlayerForRealtime (player: TPlayer) {
  return {
    id: player.id,
    tableroId: player.tableroId,
    userId: player.userId,
    name: player.name,
    balance: player.balance,
    isSystemPlayer: player.isSystemPlayer === 1, // Convertir integer a boolean
    systemPlayerType: player.systemPlayerType,
    createdAt: new Date(player.createdAt).toISOString(),
    updatedAt: new Date(player.updatedAt).toISOString(),
  }
}

/**
 * Convierte una transacción de la base de datos al formato para eventos de realtime
 */
export function formatTransactionForRealtime (transaction: TTransaction) {
  // Si createdAt es 0 o inválido, usar la fecha actual
  const timestamp = transaction.createdAt > 0 ? transaction.createdAt : Date.now()
  return {
    id: transaction.id,
    tableroId: transaction.tableroId,
    fromPlayerId: transaction.fromPlayerId,
    toPlayerId: transaction.toPlayerId,
    amount: transaction.amount,
    type: transaction.type,
    description: transaction.description,
    createdAt: new Date(timestamp).toISOString(),
  }
}

/**
 * Emite un evento de jugador insertado
 */
export async function emitPlayerInserted (player: TPlayer) {
  const channel = realtime.channel(`tablero:${player.tableroId}`)
  await channel.emit(
    'tablero.player.inserted',
    formatPlayerForRealtime(player)
  )
}

/**
 * Emite un evento de jugador actualizado
 */
export async function emitPlayerUpdated (player: TPlayer) {
  const channel = realtime.channel(`tablero:${player.tableroId}`)
  await channel.emit(
    'tablero.player.updated',
    formatPlayerForRealtime(player)
  )
}

/**
 * Emite un evento de jugador eliminado
 * Nota: Requiere tableroId porque el playerId no lo contiene
 */
export async function emitPlayerDeleted (playerId: string, tableroId: string) {
  const channel = realtime.channel(`tablero:${tableroId}`)
  await channel.emit(
    'tablero.player.deleted',
    { id: playerId }
  )
}

/**
 * Emite un evento de transacción insertada
 */
export async function emitTransactionInserted (transaction: TTransaction) {
  const channel = realtime.channel(`tablero:${transaction.tableroId}`)
  await channel.emit(
    'tablero.transaction.inserted',
    formatTransactionForRealtime(transaction)
  )
}

/**
 * Emite un evento de tablero actualizado
 */
export async function emitTableroUpdated (tableroId: string, isEnded: boolean) {
  const channel = realtime.channel(`tablero:${tableroId}`)
  await channel.emit(
    'tablero.tablero.updated',
    { id: tableroId, isEnded }
  )
}

/**
 * Emite un evento de tablero eliminado
 */
export async function emitTableroDeleted (tableroId: string) {
  const channel = realtime.channel(`tablero:${tableroId}`)
  await channel.emit(
    'tablero.tablero.deleted',
    { id: tableroId }
  )
}
