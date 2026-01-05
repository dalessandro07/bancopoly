import { Avatar, AvatarFallback, AvatarImage } from '@/src/core/components/ui/avatar'
import { Badge } from '@/src/core/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/core/components/ui/card'
import { TrendingDownIcon, TrendingUpIcon, TrophyIcon } from 'lucide-react'
import type { PlayerStats } from './types'

interface RankingCardProps {
  ranking: PlayerStats[]
  currentUserId: string | null
}

export function RankingCard ({ ranking, currentUserId }: RankingCardProps) {
  const topThree = ranking.slice(0, 3)
  const rest = ranking.slice(3)

  // Reorganizar para el podio: 2do, 1ro, 3ro (izquierda, centro, derecha)
  const podiumOrder = topThree.length >= 3
    ? [topThree[1], topThree[0], topThree[2]] // 2do, 1ro, 3ro
    : topThree.length === 2
      ? [topThree[1], topThree[0], null] // 2do, 1ro, vacío
      : [null, topThree[0], null] // vacío, 1ro, vacío

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking</CardTitle>
        <CardDescription>Clasificación final de todos los jugadores</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top 3 con podio tipo leaderboard */}
        {topThree.length > 0 && (
          <div className="relative">
            {/* Podio */}
            <div className="flex items-end justify-center gap-2 md:gap-4 px-2">
              {/* 2do lugar - Izquierda */}
              {podiumOrder[0] && (
                <div className="flex-1 flex flex-col items-center">
                  <div className="relative mb-2">
                    <Avatar className="size-16 md:size-20 border-4 border-gray-400 shadow-lg">
                      <AvatarImage
                        src={podiumOrder[0].player.user?.image || undefined}
                        alt={podiumOrder[0].player.name}
                      />
                      <AvatarFallback className="bg-gray-400/20 text-gray-600 font-bold text-xl">
                        {podiumOrder[0].player.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2 bg-gray-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-white">
                      2
                    </div>
                  </div>
                  <div className="w-full bg-gray-400 rounded-t-lg shadow-lg border-2 border-gray-500 border-b-0 pt-2 pb-3 min-h-[80px] md:min-h-[90px]">
                    <p className="text-xs md:text-sm font-bold text-center text-gray-900 truncate px-1">
                      {podiumOrder[0].player.name}
                    </p>
                    <p className="text-xs font-semibold text-center text-gray-700 mt-1">
                      ${podiumOrder[0].finalBalance.toLocaleString()}
                    </p>
                    {currentUserId === podiumOrder[0].player.user?.id && (
                      <Badge variant="secondary" className="text-xs mx-auto mt-1 block w-fit">Tú</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* 1er lugar - Centro (más alto) */}
              {podiumOrder[1] && (
                <div className="flex-1 flex flex-col items-center">
                  <div className="relative mb-2">
                    <Avatar className="size-20 md:size-24 border-4 border-yellow-500 shadow-xl">
                      <AvatarImage
                        src={podiumOrder[1].player.user?.image || undefined}
                        alt={podiumOrder[1].player.name}
                      />
                      <AvatarFallback className="bg-yellow-500/20 text-yellow-600 font-bold text-2xl">
                        {podiumOrder[1].player.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold border-2 border-white shadow-lg">
                      <TrophyIcon className="size-4" />
                    </div>
                  </div>
                  <div className="w-full bg-linear-to-b from-yellow-500 to-yellow-600 rounded-t-lg shadow-xl border-2 border-yellow-700 border-b-0 pt-3 pb-4 relative min-h-[120px] md:min-h-[140px]">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-2xl">🥇</div>
                    <p className="text-sm md:text-base font-bold text-center text-yellow-900 truncate px-1 mt-1">
                      {podiumOrder[1].player.name}
                    </p>
                    <p className="text-sm font-bold text-center text-yellow-950 mt-1">
                      ${podiumOrder[1].finalBalance.toLocaleString()}
                    </p>
                    {currentUserId === podiumOrder[1].player.user?.id && (
                      <Badge variant="default" className="text-xs mx-auto mt-1 block w-fit bg-yellow-700 text-white">Tú</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* 3er lugar - Derecha */}
              {podiumOrder[2] && (
                <div className="flex-1 flex flex-col items-center">
                  <div className="relative mb-2">
                    <Avatar className="size-14 md:size-16 border-4 border-amber-600 shadow-lg">
                      <AvatarImage
                        src={podiumOrder[2].player.user?.image || undefined}
                        alt={podiumOrder[2].player.name}
                      />
                      <AvatarFallback className="bg-amber-600/20 text-amber-700 font-bold text-lg">
                        {podiumOrder[2].player.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2 bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-white">
                      3
                    </div>
                  </div>
                  <div className="w-full bg-amber-600 rounded-t-lg shadow-lg border-2 border-amber-700 border-b-0 pt-2 pb-3 min-h-[60px] md:min-h-[70px]">
                    <p className="text-xs md:text-sm font-bold text-center text-amber-900 truncate px-1">
                      {podiumOrder[2].player.name}
                    </p>
                    <p className="text-xs font-semibold text-center text-amber-950 mt-1">
                      ${podiumOrder[2].finalBalance.toLocaleString()}
                    </p>
                    {currentUserId === podiumOrder[2].player.user?.id && (
                      <Badge variant="secondary" className="text-xs mx-auto mt-1 block w-fit">Tú</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Información adicional de cambio neto para top 3 */}
            <div className="flex justify-center gap-4 md:gap-8 mt-4 px-2">
              {topThree.map((playerStat) => {
                return (
                  <div key={playerStat.player.id} className="flex-1 max-w-[120px]">
                    {playerStat.netChange >= 0 ? (
                      <div className="flex items-center justify-center gap-1 text-green-600">
                        <TrendingUpIcon className="size-3" />
                        <span className="text-xs font-semibold">+${playerStat.netChange.toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-red-600">
                        <TrendingDownIcon className="size-3" />
                        <span className="text-xs font-semibold">${playerStat.netChange.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Resto en lista */}
        {rest.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            {rest.map((playerStat, index) => {
              const isCurrentUser = currentUserId === playerStat.player.user?.id
              const position = index + 4 // Continuar desde el 4

              return (
                <div
                  key={playerStat.player.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border ${isCurrentUser ? 'bg-primary/5 border-primary' : 'bg-card'}`}
                >
                  <div className="text-lg font-bold w-10 text-center text-muted-foreground">{position}.</div>
                  <Avatar className="size-10">
                    <AvatarImage src={playerStat.player.user?.image || undefined} alt={playerStat.player.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {playerStat.player.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate text-sm">{playerStat.player.name}</p>
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">Tú</Badge>
                      )}
                    </div>
                    <p className="text-base font-bold text-primary">
                      ${playerStat.finalBalance.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {playerStat.netChange >= 0 ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUpIcon className="size-4" />
                        <span className="font-semibold text-sm">+${playerStat.netChange.toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <TrendingDownIcon className="size-4" />
                        <span className="font-semibold text-sm">${playerStat.netChange.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
