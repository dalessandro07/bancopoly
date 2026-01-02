import { actionGetPlayerTransactions, actionGetTableroById } from '@/src/core/actions/tablero'
import DeleteBtnTablero from '@/src/core/components/tablero/delete-btn-tablero'
import FormJoinTablero from '@/src/core/components/tablero/form-join-tablero'
import LeaveBtnTablero from '@/src/core/components/tablero/leave-btn-tablero'
import CurrentPlayerBalance from '@/src/core/components/tablero/slug/current-player-balance'
import PlayersList from '@/src/core/components/tablero/slug/players-list'
import TransactionForm from '@/src/core/components/tablero/slug/transaction-form'
import TransactionHistory from '@/src/core/components/tablero/slug/transaction-history'
import { auth } from '@/src/core/lib/auth'
import type { TPlayer, TTransaction } from '@/src/core/lib/db/schema'
import { headers } from 'next/headers'

type EnrichedTransaction = TTransaction & {
  fromPlayer?: TPlayer | null
  toPlayer?: TPlayer | null
}

export default async function TableroPage ({ params }: { params: Promise<{ slug: string }> }) {
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
    const transactionsResult = await actionGetPlayerTransactions(slug, currentPlayer.id, isCreator)
    if (transactionsResult.success && transactionsResult.data) {
      playerTransactions = transactionsResult.data
    }
  }

  return (
    <main className='p-5 flex flex-col justify-between h-full gap-4'>
      <div className='flex flex-col gap-4'>
        <header>
          <h1>Tablero {tablero.tablero?.name}</h1>
        </header>

        {isPlayer ? (
          <CurrentPlayerBalance
            tableroId={tablero.tablero?.id as string}
            players={tablero.players || []}
            currentPlayerId={currentPlayer?.id}
          />
        ) : (
          <FormJoinTablero tableroId={tablero.tablero?.id as string} />
        )}

        {tablero.players && <PlayersList tableroId={tablero.tablero?.id as string} players={tablero.players} isCreator={isCreator} currentPlayerId={currentPlayer?.id} />}

        {isPlayer && tablero.players && (
          <>
            <TransactionForm
              tableroId={tablero.tablero?.id as string}
              players={tablero.players}
              currentPlayerId={currentPlayer?.id}
              isCreator={isCreator}
            />

            <TransactionHistory
              tableroId={tablero.tablero?.id as string}
              players={tablero.players}
              currentPlayerId={currentPlayer?.id}
              initialTransactions={playerTransactions}
            />
          </>
        )}
      </div>

      <footer className='flex justify-between items-center'>
        {tablero.creator && (
          <section>
            <h2>Tablero creado por:</h2>
            <p>{tablero.creator.name}</p>
          </section>
        )}
        <div className='flex gap-2'>
          {isCreator && (
            <DeleteBtnTablero tableroId={tablero.tablero?.id as string} />
          )}
          {isPlayer && !isCreator && (
            <LeaveBtnTablero tableroId={tablero.tablero?.id as string} />
          )}
        </div>
      </footer>
    </main>
  )
}
