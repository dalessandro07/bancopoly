'use client'

import DeleteBtnPlayer from '@/src/core/components/tablero/delete-btn-player'
import { useRealtimeTablero } from '@/src/core/hooks/tablero/slug'
import { authClient } from '@/src/core/lib/auth/auth-client'
import type { TPlayer } from '@/src/core/lib/db/schema'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { toast } from 'sonner'

export default function PlayersList ({ tableroId, players: initialPlayers, isCreator }: { tableroId: string, players: TPlayer[], isCreator: boolean }) {
  const { data: session } = authClient.useSession()
  const router = useRouter()

  const handlePlayerDeleted = useCallback(() => {
    toast.error('Has sido eliminado del tablero', {
      id: 'player-deleted',
    })
    setTimeout(() => {
      router.push('/')
    }, 1000)
  }, [router])

  const handlePlayerJoined = useCallback((player: TPlayer) => {
    toast.info(`${player.name} se unió al tablero`, {
      id: `player-${player.id}-joined`,
      position: 'top-center',
      duration: 3000,
    })
  }, [])

  const handlePlayerLeft = useCallback((player: TPlayer) => {
    toast.info(`${player.name} salió del tablero`, {
      id: `player-${player.id}-left`,
      position: 'top-center',
      duration: 3000,
    })
  }, [])

  const { connectedUsers, players } = useRealtimeTablero({
    roomId: tableroId as string,
    initialPlayers,
    currentUserId: session?.user?.id,
    onPlayerDeleted: handlePlayerDeleted,
    onPlayerJoined: handlePlayerJoined,
    onPlayerLeft: handlePlayerLeft,
  })

  return (
    <section>
      <h2>Jugadores</h2>
      <p>Jugadores conectados: {connectedUsers}</p>
      <ul>
        {
          players && players.length > 0 ? (
            players.map((player) => (
              <li key={player.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span>{player.name} - ${player.balance}</span>
                {isCreator && <DeleteBtnPlayer playerId={player.id} tableroId={tableroId} />}
              </li>
            ))
          ) : (
            <li>No hay jugadores</li>
          )
        }
      </ul>
    </section>
  )
}
