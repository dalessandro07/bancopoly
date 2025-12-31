import { actionGetTableroById } from '@/src/core/actions/tablero'
import DeleteBtnTablero from '@/src/core/components/tablero/delete-btn-tablero'
import FormJoinTablero from '@/src/core/components/tablero/form-join-tablero'
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
    <main className='p-5 flex flex-col gap-4'>
      <header className='flex justify-between items-center'>
        <h1>Tablero {tablero.tablero?.name}</h1>

        {isCreator && (
          <DeleteBtnTablero tableroId={tablero.tablero?.id as string} />
        )}
      </header>

      <section>
        {tablero.creator && (
          <section>
            <h2>Creado por:</h2>
            <p>{tablero.creator.name}</p>
          </section>
        )}
      </section>

      <section>
        <h2>Jugadores</h2>
        <ul>
          {
            tablero.players && tablero.players.length > 0 ? (
              tablero.players.map((player) => (
                <li key={player.id}>{player.name} - ${player.balance}</li>
              ))
            ) : (
              <li>No hay jugadores</li>
            )
          }
        </ul>
      </section>

      {isPlayer ? (
        <section>
          <h2>Tu saldo</h2>
          <p>${tablero.players?.find((player) => player.userId === session?.user?.id)?.balance}</p>
        </section>
      ) : (
        <FormJoinTablero tableroId={tablero.tablero?.id as string} />
      )}
    </main>
  )
}
