import { Card, CardContent, CardHeader, CardTitle } from '@/src/core/components/ui/card'

interface GameStatsCardProps {
  totalTransactions: number
  playersCount: number
}

export function GameStatsCard ({ totalTransactions, playersCount }: GameStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estadísticas del juego</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total de transacciones</p>
            <p className="text-2xl font-bold">{totalTransactions}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Jugadores</p>
            <p className="text-2xl font-bold">{playersCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
