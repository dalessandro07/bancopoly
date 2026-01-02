import { actionGetTableroById } from '@/src/core/actions/tablero'
import DeleteBtnTablero from '@/src/core/components/tablero/delete-btn-tablero'
import FormJoinTablero from '@/src/core/components/tablero/form-join-tablero'
import LeaveBtnTablero from '@/src/core/components/tablero/leave-btn-tablero'
import PlayersList from '@/src/core/components/tablero/slug/players-list'
import { auth } from '@/src/core/lib/auth'
import { headers } from 'next/headers'

export default async function TableroPage ({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const session = await auth.api.getSession({
    headers: await headers()
  })

  const tablero = await actionGetTableroById(slug)

  const isCreator = tablero.creator?.id === session?.user?.id
  const isPlayer = tablero.players?.some((player) => player.userId === session?.user?.id)

  return (
    <main className='p-5 flex flex-col justify-between h-full gap-4'>
      <div className='flex flex-col gap-4'>
        <header>
          <h1>Tablero {tablero.tablero?.name}</h1>
        </header>

        {isPlayer ? (
          <section>
            <h2>Tu saldo</h2>
            <p>${tablero.players?.find((player) => player.userId === session?.user?.id)?.balance}</p>
          </section>
        ) : (
          <FormJoinTablero tableroId={tablero.tablero?.id as string} />
        )}

        {tablero.players && <PlayersList tableroId={tablero.tablero?.id as string} players={tablero.players} isCreator={isCreator} />}
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
