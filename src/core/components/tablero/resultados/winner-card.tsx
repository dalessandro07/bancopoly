import { Avatar, AvatarFallback, AvatarImage } from '@/src/core/components/ui/avatar'
import { Badge } from '@/src/core/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/core/components/ui/card'
import { CrownIcon, TrophyIcon } from 'lucide-react'
import type { PlayerStats } from './types'

interface WinnerCardProps {
  winner: PlayerStats
  isWinner: boolean
}

export function WinnerCard ({ winner, isWinner }: WinnerCardProps) {
  return (
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
            <AvatarImage src={winner.player.user?.image || undefined} alt={winner.player.name} />
            <AvatarFallback className="bg-yellow-500/10 text-yellow-600 text-xl font-bold">
              {winner.player.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-lg font-semibold">{winner.player.name}</p>
            <p className="text-2xl font-bold text-primary">
              ${winner.finalBalance.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              Ganancia neta: +${winner.netChange.toLocaleString()}
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
  )
}
