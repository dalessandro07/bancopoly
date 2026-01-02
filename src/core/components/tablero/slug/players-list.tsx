'use client'

import DeleteBtnPlayer from '@/src/core/components/tablero/delete-btn-player'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/core/components/ui/avatar'
import { Badge } from '@/src/core/components/ui/badge'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/src/core/components/ui/carousel'
import { usePlayersRealtime } from '@/src/core/hooks/tablero/use-players-realtime'
import type { TPlayer, User } from '@/src/core/lib/db/schema'
import { useMemo } from 'react'

type PlayerWithUser = TPlayer & {
  user?: User | null
}

interface PlayersListProps {
  tableroId: string
  players: PlayerWithUser[]
  isCreator: boolean
  currentPlayerId?: string
  enableRealtime?: boolean
  onPlayerClick?: (playerId: string) => void
}

export default function PlayersList ({
  tableroId,
  players: initialPlayers,
  isCreator,
  currentPlayerId,
  enableRealtime = false,
  onPlayerClick,
}: PlayersListProps) {
  // Si enableRealtime es true, usamos el hook de realtime
  // Si no, usamos los players pasados directamente (para cuando se usa dentro del wrapper)
  const realtimePlayers = usePlayersRealtime({
    tableroId,
    initialPlayers,
    enabled: enableRealtime,
  })

  const playersRaw = enableRealtime ? realtimePlayers : initialPlayers

  // Ordenar jugadores: el jugador actual primero, luego los demás
  const players = useMemo(() => {
    return [...playersRaw].sort((a, b) => {
      if (a.id === currentPlayerId) return -1
      if (b.id === currentPlayerId) return 1
      return 0
    })
  }, [playersRaw, currentPlayerId])

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

  const handlePlayerClick = (playerId: string, e: React.MouseEvent) => {
    // Prevenir el clic si se hace clic en el botón de eliminar
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    // Si es creador, puede hacer clic en cualquier jugador (incluido él mismo)
    // Si no es creador, solo puede hacer clic en otros jugadores
    if (onPlayerClick && (isCreator || playerId !== currentPlayerId)) {
      onPlayerClick(playerId)
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Jugadores ({players.length})</h2>
      </div>

      {players && players.length > 0 ? (
        <Carousel
          opts={{
            align: "start",
            loop: false,
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {players.map((player) => (
              <CarouselItem key={player.id} className="pl-2 md:pl-4 basis-auto">
                <div
                  className={`border rounded-lg p-4 flex flex-col gap-2 bg-card min-w-[140px] max-w-[160px] relative select-none ${onPlayerClick && (isCreator || player.id !== currentPlayerId)
                      ? 'cursor-pointer hover:border-primary hover:shadow-md transition-all active:scale-95'
                      : ''
                    }`}
                  onClick={(e) => handlePlayerClick(player.id, e)}
                >
                  {isCreator && !player.isSystemPlayer && (
                    <div
                      className="absolute top-2 right-2 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DeleteBtnPlayer playerId={player.id} tableroId={tableroId} />
                    </div>
                  )}
                  {player.id === currentPlayerId && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge variant="default" className="text-xs">
                        Tú
                      </Badge>
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-2 mb-2">
                    <Avatar className="size-12">
                      <AvatarImage src={player.user?.image || undefined} alt={player.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {player.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 w-full text-center">
                      <p className="font-semibold text-sm truncate">{player.name}</p>
                    </div>
                  </div>
                  <div className="flex-1 text-center">
                    {shouldShowBalance(player) ? (
                      <p className="text-lg font-bold text-primary">{formatBalance(player)}</p>
                    ) : (
                      <p className="text-lg font-bold text-muted-foreground">***</p>
                    )}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {players.length > 1 && (
            <>
              <CarouselPrevious className="left-0 hidden sm:flex" />
              <CarouselNext className="right-0 hidden sm:flex" />
            </>
          )}
        </Carousel>
      ) : (
        <p className="text-muted-foreground">No hay jugadores</p>
      )}
    </section>
  )
}
