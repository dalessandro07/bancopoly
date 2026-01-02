import { actionGetTablerosFromUser } from '@/src/core/actions/tablero'
import DeleteBtnTablero from '@/src/core/components/tablero/delete-btn-tablero'
import { auth } from '@/src/core/lib/auth'
import Link from 'next/link'
import { headers } from 'next/headers'
import { CrownIcon, LayoutGridIcon } from 'lucide-react'

export default async function ListTablero () {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  const { data } = await actionGetTablerosFromUser()
  const tableros = data

  return (
    <section className="space-y-4">
      {
        tableros && tableros.length > 0 ? (
          <>
            <div className="flex items-center gap-2">
              <LayoutGridIcon className="size-5 text-primary" />
              <h2 className="text-xl font-bold">Mis tableros</h2>
              <span className="text-sm text-muted-foreground">({tableros.length})</span>
            </div>
            <div className="grid gap-3">
              {tableros.map((tablero) => {
                const isCreator = tablero.userId === session?.user?.id
                return (
                  <Link
                    key={tablero.id}
                    href={`/tablero/${tablero.id}`}
                    className="group relative bg-card border rounded-xl p-4 hover:border-primary/50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                            {tablero.name}
                          </h3>
                          {isCreator && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 rounded-full">
                              <CrownIcon className="size-3 text-yellow-500" />
                              <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                                Creador
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Toca para ver detalles
                        </p>
                      </div>

                      {isCreator && (
                        <div onClick={(e) => e.preventDefault()}>
                          <DeleteBtnTablero tableroId={tablero.id} />
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-muted mb-4">
              <LayoutGridIcon className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay tableros</h3>
            <p className="text-sm text-muted-foreground">
              Crea tu primer tablero para comenzar a jugar
            </p>
          </div>
        )
      }
    </section>
  )
}
