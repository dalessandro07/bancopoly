'use server'

import { db } from '@/src/core/lib/db'
import { player, tablero, transaction } from '@/src/core/lib/db/schema'
import { auth } from '@/src/core/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { emitTransactionInserted } from './utils'

const MAX_AMOUNT = 999_999_999

/**
 * Crea una nueva transacción entre dos jugadores
 */
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
  const amountRaw = parseInt((formData.get('amount') as string) ?? '', 10)
  const description = (formData.get('description') as string)?.trim() || null

  if (!tableroId || !fromPlayerId || !toPlayerId) {
    return { success: false, error: 'Faltan datos requeridos' }
  }
  if (Number.isNaN(amountRaw) || amountRaw <= 0) {
    return { success: false, error: 'El monto debe ser mayor a 0' }
  }
  if (amountRaw > MAX_AMOUNT) {
    return { success: false, error: `El monto no puede superar $${MAX_AMOUNT.toLocaleString()}` }
  }
  const amount = amountRaw

  if (fromPlayerId === toPlayerId) {
    return { success: false, error: 'No puedes transferir dinero a ti mismo' }
  }

  const [userPlayer, fromPlayer, toPlayer, tableroData] = await Promise.all([
    db.select().from(player).where(and(eq(player.tableroId, tableroId), eq(player.userId, session.user.id))),
    db.select().from(player).where(eq(player.id, fromPlayerId)),
    db.select().from(player).where(eq(player.id, toPlayerId)),
    db.select().from(tablero).where(eq(tablero.id, tableroId)),
  ])

  if (!userPlayer[0]) {
    return { success: false, error: 'No eres jugador de este tablero' }
  }
  if (!tableroData[0] || tableroData[0].isEnded === 1) {
    return { success: false, error: 'El tablero no existe o está cerrado' }
  }

  if (!fromPlayer[0] || !toPlayer[0]) {
    return { success: false, error: 'Jugador no encontrado' }
  }

  //* 6. Verificar que ambos jugadores pertenecen al mismo tablero
  if (fromPlayer[0].tableroId !== tableroId || toPlayer[0].tableroId !== tableroId) {
    return { success: false, error: 'Los jugadores deben pertenecer al mismo tablero' }
  }

  const isCreator = tableroData[0].userId === session.user.id
  const isFromSystemPlayer = fromPlayer[0].isSystemPlayer === 1
  const isFromOwnPlayer = fromPlayer[0].userId === session.user.id

  if (!isFromSystemPlayer && !isFromOwnPlayer) {
    return { success: false, error: 'No tienes permiso para transferir desde ese jugador' }
  }
  if (isFromSystemPlayer && !isCreator) {
    return { success: false, error: 'Solo el creador puede usar el Banco o Parada Libre como origen' }
  }
  if (fromPlayer[0].isSystemPlayer !== 1 && fromPlayer[0].balance < amount) {
    return { success: false, error: 'Saldo insuficiente' }
  }

  try {
    const newTransaction = await db.transaction(async (tx) => {
      const [updatedFromPlayer, updatedToPlayer] = await Promise.all([
        tx.update(player)
        .set({ balance: fromPlayer[0].balance - amount })
        .where(eq(player.id, fromPlayerId))
        .returning(),
        tx.update(player)
          .set({ balance: toPlayer[0].balance + amount })
          .where(eq(player.id, toPlayerId))
          .returning(),
      ])

      const [inserted] = await tx.insert(transaction).values({
        id: crypto.randomUUID(),
        tableroId,
        fromPlayerId,
        toPlayerId,
        amount,
        type: 'transfer',
        description,
        fromBalance: updatedFromPlayer[0].balance,
        toBalance: updatedToPlayer[0].balance,
        createdAt: Date.now(),
      }).returning()

      return inserted
    })

    if (newTransaction) {
      await emitTransactionInserted(newTransaction)
    }

    // Revalidar la ruta para actualizar el contenido del usuario que hace la transacción
    revalidatePath(`/tablero/${tableroId}`)

    return { success: true, message: 'Transacción realizada correctamente' }
  } catch (error) {
    console.error(error)
    // Revalidar incluso en caso de error para mantener la consistencia
    revalidatePath(`/tablero/${tableroId}`)
    return { success: false, error: 'Error al realizar la transacción' }
  }
}
