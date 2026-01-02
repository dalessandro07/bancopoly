import { Avatar, AvatarFallback, AvatarImage } from '@/src/core/components/ui/avatar'
import { Badge } from '@/src/core/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/core/components/ui/card'
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import type { PlayerStats } from './types'

interface RankingCardProps {
  ranking: PlayerStats[]
  currentUserId: string | null
}

export function RankingCard ({ ranking, currentUserId }: RankingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking</CardTitle>
        <CardDescription>Clasificación final de todos los jugadores</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {ranking.map((playerStat, index) => {
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
  )
}
