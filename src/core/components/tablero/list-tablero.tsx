import { actionGetTablerosFromUser } from '@/src/core/actions/tablero'
import DeleteBtnTablero from '@/src/core/components/tablero/delete-btn-tablero'
import Link from 'next/link'

export default async function ListTablero () {
  const { data } = await actionGetTablerosFromUser()
  const tableros = data

  return (
    <section>
      {
        tableros && tableros.length > 0 ? (
          <section>
            <h2>Tableros</h2>
            <ul>
              {tableros.map((tablero, index) => (
                <li key={tablero.id}>
                  <Link href={`/tablero/${tablero.id}`}>{index + 1}. {tablero.name}</Link>
                  <DeleteBtnTablero tableroId={tablero.id} />
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div>No hay tableros</div>
        )
      }
    </section>
  )
}
