import { actionGetTablerosFromUser } from '@/src/core/actions/tablero'
import DeleteBtnTablero from '@/src/core/components/tablero/delete-btn-tablero'
import { auth } from '@/src/core/lib/auth'
import Link from 'next/link'
import { headers } from 'next/headers'

export default async function ListTablero () {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  const { data } = await actionGetTablerosFromUser()
  const tableros = data

  return (
    <section>
      {
        tableros && tableros.length > 0 ? (
          <section>
            <h2>Tableros</h2>
            <ul>
              {tableros.map((tablero, index) => {
                const isCreator = tablero.userId === session?.user?.id
                return (
                  <li key={tablero.id}>
                    <Link href={`/tablero/${tablero.id}`}>{index + 1}. {tablero.name}</Link>
                    {isCreator && <DeleteBtnTablero tableroId={tablero.id} />}
                  </li>
                )
              })}
            </ul>
          </section>
        ) : (
          <div>No hay tableros</div>
        )
      }
    </section>
  )
}
