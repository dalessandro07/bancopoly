import { Avatar, AvatarFallback, AvatarImage } from '@/src/core/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/core/components/ui/card'
import type { PlayerStats } from './types'

interface StatsCardsProps {
  winner: PlayerStats
  loser: PlayerStats
}

export function StatsCards ({ winner, loser }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quien ganó más</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={winner.player.user?.image || undefined} alt={winner.player.name} />
              <AvatarFallback className="bg-green-500/10 text-green-600">
                {winner.player.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{winner.player.name}</p>
              <p className="text-sm text-muted-foreground">
                +${winner.netChange.toLocaleString()}
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
              <AvatarImage src={loser.player.user?.image || undefined} alt={loser.player.name} />
              <AvatarFallback className="bg-red-500/10 text-red-600">
                {loser.player.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{loser.player.name}</p>
              <p className="text-sm text-muted-foreground">
                {loser.netChange >= 0 ? '+' : ''}${loser.netChange.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
