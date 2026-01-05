'use server'

import { db } from '@/src/core/lib/db'
import { player, transaction } from '@/src/core/lib/db/schema'
import { auth } from '@/src/core/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { emitTransactionInserted, emitPlayerUpdated } from './utils'

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
      eq(player.userId, session.user.id)
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
  if (fromPlayer[0].isSystemPlayer !== 1 && fromPlayer[0].balance < amount) {
    return { success: false, error: 'Saldo insuficiente' }
  }

  //* 8. Realizar la transacción
  try {
    // Actualizar balances
    const [updatedFromPlayer, updatedToPlayer] = await Promise.all([
      db.update(player)
        .set({ balance: fromPlayer[0].balance - amount })
        .where(eq(player.id, fromPlayerId))
        .returning(),
      db.update(player)
        .set({ balance: toPlayer[0].balance + amount })
        .where(eq(player.id, toPlayerId))
        .returning(),
    ])

    // Registrar la transacción
    const newTransaction = await db.insert(transaction).values({
      id: crypto.randomUUID(),
      tableroId,
      fromPlayerId,
      toPlayerId,
      amount,
      type: 'transfer',
      description: description || null,
    }).returning()

    // Emitir eventos de realtime
    if (newTransaction[0]) {
      await emitTransactionInserted(newTransaction[0])
    }

    // Emitir eventos de actualización de jugadores
    if (updatedFromPlayer[0]) {
      await emitPlayerUpdated(updatedFromPlayer[0])
    }

    if (updatedToPlayer[0]) {
      await emitPlayerUpdated(updatedToPlayer[0])
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
