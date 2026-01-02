'use client'

import DeleteBtnTablero from '@/src/core/components/tablero/delete-btn-tablero'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/core/components/ui/avatar'
import { Badge } from '@/src/core/components/ui/badge'
import { Button } from '@/src/core/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/core/components/ui/card'
import confetti from 'canvas-confetti'
import { CrownIcon, HomeIcon, TrendingDownIcon, TrendingUpIcon, TrophyIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

interface PlayerStats {
  player: {
    id: string
    name: string
    balance: number
    user?: {
      id: string
      name: string
      email: string
      image: string | null
    } | null
  }
  initialBalance: number
  finalBalance: number
  netChange: number
  totalSent: number
  totalReceived: number
  transactionCount: number
}

interface TableroStats {
  ranking: PlayerStats[]
  winner: PlayerStats
  loser: PlayerStats
  totalTransactions: number
  totalMoneyInCirculation: number
  playersCount: number
}

interface ResultadosClientProps {
  tableroName: string
  stats: TableroStats
  currentUserId: string | null
  tableroSlug: string
  isCreator: boolean
}

export default function ResultadosClient ({
  tableroName,
  stats,
  currentUserId,
  tableroSlug,
  isCreator,
}: ResultadosClientProps) {
  const confettiShownRef = useRef(false)

  // Mostrar confetti para el ganador
  useEffect(() => {
    if (currentUserId && !confettiShownRef.current) {
      const winnerUserId = stats.winner.player.user?.id
      if (winnerUserId === currentUserId) {
        confettiShownRef.current = true

        // Confetti más elaborado para el ganador
        const duration = 3000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        function randomInRange (min: number, max: number) {
          return Math.random() * (max - min) + min
        }

        const interval = setInterval(function () {
          const timeLeft = animationEnd - Date.now()

          if (timeLeft <= 0) {
            return clearInterval(interval)
          }

          const particleCount = 50 * (timeLeft / duration)
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
          })
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
          })
        }, 250)

        return () => clearInterval(interval)
      }
    }
  }, [currentUserId, stats.winner.player.user?.id])

  const isWinner = currentUserId === stats.winner.player.user?.id

  return (
    <main className="p-5 flex flex-col h-full gap-6 pb-32">
      <div>
        <h1 className="text-2xl font-bold">{tableroName}</h1>
        <p className="text-sm text-muted-foreground">Resultados finales</p>
      </div>

      {/* Ganador destacado */}
      <Card className={`border-2 ${isWinner ? 'border-yellow-500 bg-yellow-500/5' : 'border-primary/20'}`}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrophyIcon className={`size-6 ${isWinner ? 'text-yellow-500' : 'text-primary'}`} />
            <CardTitle className="text-xl">🏆 Ganador</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border-2 border-yellow-500">
              <AvatarImage src={stats.winner.player.user?.image || undefined} alt={stats.winner.player.name} />
              <AvatarFallback className="bg-yellow-500/10 text-yellow-600 text-xl font-bold">
                {stats.winner.player.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-lg font-semibold">{stats.winner.player.name}</p>
              <p className="text-2xl font-bold text-primary">
                ${stats.winner.finalBalance.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Ganancia neta: +${stats.winner.netChange.toLocaleString()}
              </p>
            </div>
            {isWinner && (
              <Badge variant="default" className="bg-yellow-500 text-white">
                <CrownIcon className="size-4 mr-1" />
                ¡Tú ganaste!
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ranking completo */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking</CardTitle>
          <CardDescription>Clasificación final de todos los jugadores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.ranking.map((playerStat, index) => {
            const isCurrentUser = currentUserId === playerStat.player.user?.id
            const position = index + 1
            const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`

            return (
              <div
                key={playerStat.player.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${isCurrentUser ? 'bg-primary/5 border-primary' : 'bg-card'
                  }`}
              >
                <div className="text-2xl font-bold w-12 text-center">{medal}</div>
                <Avatar className="size-12">
                  <AvatarImage src={playerStat.player.user?.image || undefined} alt={playerStat.player.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {playerStat.player.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{playerStat.player.name}</p>
                    {isCurrentUser && (
                      <Badge variant="secondary" className="text-xs">Tú</Badge>
                    )}
                  </div>
                  <p className="text-lg font-bold text-primary">
                    ${playerStat.finalBalance.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  {playerStat.netChange >= 0 ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUpIcon className="size-4" />
                      <span className="font-semibold">+${playerStat.netChange.toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <TrendingDownIcon className="size-4" />
                      <span className="font-semibold">${playerStat.netChange.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quien ganó más</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={stats.winner.player.user?.image || undefined} alt={stats.winner.player.name} />
                <AvatarFallback className="bg-green-500/10 text-green-600">
                  {stats.winner.player.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{stats.winner.player.name}</p>
                <p className="text-sm text-muted-foreground">
                  +${stats.winner.netChange.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quien perdió más</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={stats.loser.player.user?.image || undefined} alt={stats.loser.player.name} />
                <AvatarFallback className="bg-red-500/10 text-red-600">
                  {stats.loser.player.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{stats.loser.player.name}</p>
                <p className="text-sm text-muted-foreground">
                  {stats.loser.netChange >= 0 ? '+' : ''}${stats.loser.netChange.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas generales */}
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas del juego</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total de transacciones</p>
              <p className="text-2xl font-bold">{stats.totalTransactions}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jugadores</p>
              <p className="text-2xl font-bold">{stats.playersCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción en la parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex gap-3 justify-center z-10">
        <Button asChild variant="default" className="flex-1 max-w-md">
          <Link href="/">
            <HomeIcon className="size-4 mr-2" />
            Regresar a inicio
          </Link>
        </Button>
        {isCreator && (
          <div className="flex-1 max-w-md">
            <DeleteBtnTablero tableroId={tableroSlug} />
          </div>
        )}
      </div>
    </main>
  )
}
