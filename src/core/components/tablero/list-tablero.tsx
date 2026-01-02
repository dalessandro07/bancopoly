import { actionGetTablerosFromUser } from '@/src/core/actions/tablero'
import DeleteBtnTablero from '@/src/core/components/tablero/delete-btn-tablero'
import { Badge } from '@/src/core/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/core/components/ui/tabs'
import { auth } from '@/src/core/lib/auth'
import { CrownIcon, LayoutGridIcon } from 'lucide-react'
import { headers } from 'next/headers'
import Link from 'next/link'

export default async function ListTablero () {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  const { data } = await actionGetTablerosFromUser()
  const tableros = data || []

  // Separar tableros abiertos y cerrados
  const tablerosAbiertos = tableros.filter(t => !t.isEnded)
  const tablerosCerrados = tableros.filter(t => t.isEnded)

  const renderTablero = (tablero: typeof tableros[0]) => {
    const isCreator = tablero.userId === session?.user?.id
    const href = tablero.isEnded ? `/tablero/${tablero.id}/resultados` : `/tablero/${tablero.id}`

    return (
      <div
        key={tablero.id}
        className="group relative bg-card border rounded-xl p-4 hover:border-primary/50 hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-start justify-between gap-3">
          <Link
            href={href}
            className="flex-1 min-w-0"
          >
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
              {tablero.isEnded && (
                <Badge variant="secondary" className="text-xs">
                  Cerrado
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {tablero.isEnded ? 'Ver resultados' : 'Toca para ingresar'}
            </p>
          </Link>

          {isCreator && (
            <DeleteBtnTablero tableroId={tablero.id} />
          )}
        </div>
      </div>
    )
  }

  const renderEmptyState = (message: string) => (
    <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed">
      <div className="inline-flex items-center justify-center size-16 rounded-full bg-muted mb-4">
        <LayoutGridIcon className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No hay tableros</h3>
      <p className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  )

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <LayoutGridIcon className="size-5 text-primary" />
        <h2 className="text-xl font-bold">Mis tableros</h2>
        <span className="text-sm text-muted-foreground">({tableros.length})</span>
      </div>

      {tableros.length > 0 ? (
        <Tabs defaultValue="abiertos" className="w-full">
          <TabsList>
            <TabsTrigger value="abiertos">
              Abiertos ({tablerosAbiertos.length})
            </TabsTrigger>
            <TabsTrigger value="cerrados">
              Cerrados ({tablerosCerrados.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="abiertos" className="mt-4">
            {tablerosAbiertos.length > 0 ? (
              <div className="grid gap-3">
                {tablerosAbiertos.map(renderTablero)}
              </div>
            ) : (
              renderEmptyState('No tienes tableros abiertos')
            )}
          </TabsContent>

          <TabsContent value="cerrados" className="mt-4">
            {tablerosCerrados.length > 0 ? (
              <div className="grid gap-3">
                {tablerosCerrados.map(renderTablero)}
              </div>
            ) : (
              renderEmptyState('No tienes tableros cerrados')
            )}
          </TabsContent>
        </Tabs>
      ) : (
        renderEmptyState('Crea tu primer tablero para comenzar a jugar')
      )}
    </section>
  )
}
