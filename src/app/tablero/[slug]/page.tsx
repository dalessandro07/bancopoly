import { actionGetPlayerTransactions, actionGetTableroById } from '@/src/core/actions/tablero'
import FormJoinTablero from '@/src/core/components/tablero/form-join-tablero'
import PlayersList from '@/src/core/components/tablero/slug/players-list'
import TableroRealtimeWrapper from '@/src/core/components/tablero/slug/tablero-realtime-wrapper'
import { auth } from '@/src/core/lib/auth'
import type { TPlayer, TTransaction, User } from '@/src/core/lib/db/schema'
import { headers } from 'next/headers'

type EnrichedTransaction = TTransaction & {
  fromPlayer?: TPlayer | null
  toPlayer?: TPlayer | null
}

export default async function TableroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const session = await auth.api.getSession({
    headers: await headers()
  })

  const tablero = await actionGetTableroById(slug)

  const isCreator = tablero.creator?.id === session?.user?.id
  const isPlayer = tablero.players?.some((player) => player.userId === session?.user?.id)
  const currentPlayer = tablero.players?.find((player) => player.userId === session?.user?.id)

  // Obtener transacciones del jugador si está en el tablero
  let playerTransactions: EnrichedTransaction[] = []
  if (isPlayer && currentPlayer?.id) {
    const transactionsResult = await actionGetPlayerTransactions(slug, currentPlayer.id)
    if (transactionsResult.success && transactionsResult.data) {
      playerTransactions = transactionsResult.data
    }
  }

  return (
    <main className='p-5 flex flex-col h-full'>
      {isPlayer && tablero.creator ? (
        <TableroRealtimeWrapper
          tableroId={tablero.tablero?.id as string}
          tableroName={tablero.tablero?.name as string}
          initialPlayers={tablero.players || []}
          initialTransactions={playerTransactions}
          currentPlayerId={currentPlayer?.id}
          isCreator={isCreator}
          creator={tablero.creator as User}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <FormJoinTablero tableroId={tablero.tablero?.id as string} />
          {tablero.players && (
            <PlayersList
              tableroId={tablero.tablero?.id as string}
              players={tablero.players}
              isCreator={isCreator}
              currentPlayerId={currentPlayer?.id}
              enableRealtime={true}
            />
          )}
        </div>
      )}
    </main>
  )
}
