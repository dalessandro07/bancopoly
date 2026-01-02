'use client'

import DeleteBtnPlayer from '@/src/core/components/tablero/delete-btn-player'
import type { TPlayer } from '@/src/core/lib/db/schema'

export default function PlayersList ({ tableroId, players, isCreator, currentPlayerId }: { tableroId: string, players: TPlayer[], isCreator: boolean, currentPlayerId?: string }) {

  const formatBalance = (player: TPlayer) => {
    if (player.isSystemPlayer && player.systemPlayerType === 'bank') {
      return '∞'
    }
    return `$${player.balance}`
  }

  const shouldShowBalance = (player: TPlayer) => {
    // Mostrar balance si es jugador del sistema (Banco, Parada Libre)
    if (player.isSystemPlayer) return true
    // Mostrar balance si es el jugador actual
    if (player.id === currentPlayerId) return true
    // Ocultar balance de otros jugadores
    return false
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Jugadores</h2>
        <p className="text-sm text-muted-foreground">Total de jugadores: {players.length}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {
          players && players.length > 0 ? (
            players.map((player) => (
              <div
                key={player.id}
                className="border rounded-lg p-4 flex flex-col gap-2 bg-card"
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm truncate">{player.name}</p>
                  {shouldShowBalance(player) ? (
                    <p className="text-lg font-bold text-primary">{formatBalance(player)}</p>
                  ) : (
                    <p className="text-lg font-bold text-muted-foreground">***</p>
                  )}
                </div>
                {isCreator && !player.isSystemPlayer && (
                  <DeleteBtnPlayer playerId={player.id} tableroId={tableroId} />
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground col-span-full">No hay jugadores</p>
          )
        }
      </div>
    </section>
  )
}
