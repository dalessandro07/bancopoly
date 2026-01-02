'use client'

import type { TPlayer } from '@/src/core/lib/db/schema'
import { createClient } from '@/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'

type Message = {
  id: string
  text: string
  created_at: string
  author_id: string
  author: {
    name: string
    image_url: string
  }
}

export function useRealtimeTablero ({
  roomId,
  initialPlayers = [],
  currentUserId,
  onPlayerDeleted,
  onPlayerJoined,
  onPlayerLeft,
}: {
  roomId: string
  initialPlayers?: TPlayer[]
  currentUserId?: string
  onPlayerDeleted?: (playerId: string) => void
  onPlayerJoined?: (player: TPlayer) => void
  onPlayerLeft?: (player: TPlayer) => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [players, setPlayers] = useState<TPlayer[]>(initialPlayers)
  const connectedUsers = players.length

  const currentUserIdRef = useRef(currentUserId)
  const onPlayerDeletedRef = useRef(onPlayerDeleted)
  const onPlayerJoinedRef = useRef(onPlayerJoined)
  const onPlayerLeftRef = useRef(onPlayerLeft)

  useEffect(() => {
    currentUserIdRef.current = currentUserId
    onPlayerDeletedRef.current = onPlayerDeleted
    onPlayerJoinedRef.current = onPlayerJoined
    onPlayerLeftRef.current = onPlayerLeft
  }, [currentUserId, onPlayerDeleted, onPlayerJoined, onPlayerLeft])

  useEffect(() => {
    if (!roomId) return

    const supabase = createClient()
    let playersChannel: RealtimeChannel | null = null

    // Canal para cambios en la tabla player
    playersChannel = supabase.channel(`tablero:${roomId}:players`, {
      config: {
        private: false,
      },
    })

    // Configurar listeners de cambios en la tabla player
    playersChannel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player',
          filter: `tablero_id=eq.${roomId}`,
        },
        (payload) => {
          const newPlayer = payload.new as TPlayer
          setPlayers((prev) => {
            if (prev.some((p) => p.id === newPlayer.id)) {
              return prev
            }
            if (onPlayerJoinedRef.current) {
              setTimeout(() => {
                if (onPlayerJoinedRef.current) {
                  onPlayerJoinedRef.current(newPlayer)
                }
              }, 100)
            }
            return [...prev, newPlayer]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'player',
          filter: `tablero_id=eq.${roomId}`,
        },
        (payload) => {
          const updatedPlayer = payload.new as TPlayer
          setPlayers((prev) =>
            prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'player',
          filter: `tablero_id=eq.${roomId}`,
        },
        (payload) => {
          const deletedPlayer = (payload.old || (payload as { data?: { old?: TPlayer } }).data?.old) as TPlayer | undefined

          if (deletedPlayer && deletedPlayer.id) {
            const deletedUserIdFromPayload = (deletedPlayer as TPlayer & { user_id?: string }).user_id || deletedPlayer.userId

            setPlayers((prev) => {
              const deletedPlayerFromState = prev.find(p => p.id === deletedPlayer.id)
              const deletedUserId = deletedPlayerFromState?.userId || deletedUserIdFromPayload

              const isCurrentUser = currentUserIdRef.current && deletedUserId &&
                String(deletedUserId) === String(currentUserIdRef.current)

              if (isCurrentUser && onPlayerDeletedRef.current) {
                const callback = onPlayerDeletedRef.current
                const playerId = deletedPlayer.id
                setTimeout(() => {
                  callback(playerId)
                }, 100)
              } else if (onPlayerLeftRef.current && deletedPlayerFromState) {
                setTimeout(() => {
                  if (onPlayerLeftRef.current) {
                    onPlayerLeftRef.current(deletedPlayerFromState)
                  }
                }, 100)
              }

              return prev.filter((p) => p.id !== deletedPlayer.id)
            })
          } else {
            const deletedId = deletedPlayer?.id || (payload as { id?: string; data?: { id?: string } }).id || (payload as { data?: { id?: string } }).data?.id
            if (deletedId) {
              setPlayers((prev) => {
                const deletedPlayerFromState = prev.find(p => p.id === deletedId)
                if (currentUserIdRef.current && deletedPlayerFromState?.userId === currentUserIdRef.current && onPlayerDeletedRef.current) {
                  setTimeout(() => {
                    if (onPlayerDeletedRef.current) {
                      onPlayerDeletedRef.current(deletedId)
                    }
                  }, 0)
                } else if (onPlayerLeftRef.current && deletedPlayerFromState) {
                  setTimeout(() => {
                    if (onPlayerLeftRef.current) {
                      onPlayerLeftRef.current(deletedPlayerFromState)
                    }
                  }, 100)
                }
                return prev.filter((p) => p.id !== deletedId)
              })
            }
          }
        }
      )
      .on("broadcast", { event: "INSERT" }, payload => {
        const record = payload.payload
        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: record.id,
            text: record.text,
            created_at: record.created_at,
            author_id: record.author_id,
            author: {
              name: record.author_name,
              image_url: record.author_image_url,
            },
          },
        ])
      })
      .subscribe()

    return () => {
      if (playersChannel) {
        playersChannel.unsubscribe()
      }
    }
  }, [roomId])

  return { connectedUsers, messages, players }
}
