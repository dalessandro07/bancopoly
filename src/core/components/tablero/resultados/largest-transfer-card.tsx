import { Avatar, AvatarFallback, AvatarImage } from '@/src/core/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/core/components/ui/card'
import { ArrowRightIcon, BanknoteIcon } from 'lucide-react'
import type { LargestTransfer } from './types'

// Colores estilo Monopoly para los billetes
const monopolyColors = [
  { bg: 'bg-green-500', border: 'border-green-700', text: 'text-green-900' },
  { bg: 'bg-blue-500', border: 'border-blue-700', text: 'text-blue-900' },
  { bg: 'bg-pink-500', border: 'border-pink-700', text: 'text-pink-900' },
  { bg: 'bg-orange-500', border: 'border-orange-700', text: 'text-orange-900' },
  { bg: 'bg-yellow-500', border: 'border-yellow-700', text: 'text-yellow-900' },
  { bg: 'bg-purple-500', border: 'border-purple-700', text: 'text-purple-900' },
]

// Componente de billete de Monopoly
function MoneyBill ({ rotation = 0, index = 0, color }: { rotation?: number; index?: number; color: typeof monopolyColors[0] }) {
  return (
    <div
      className="relative"
      style={{
        transform: `rotate(${rotation}deg)`,
        zIndex: 10 - index
      }}
    >
      <div
        className={`w-10 h-20 ${color.bg} rounded shadow-lg border-2 ${color.border} flex items-center justify-center relative overflow-hidden hover:scale-110 transition-transform duration-200`}
      >
        {/* Patrón estilo Monopoly */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1 left-1 w-3 h-3 border border-white/50 rounded-full"></div>
          <div className="absolute bottom-1 right-1 w-2 h-2 border border-white/50 rounded-full"></div>
        </div>
        {/* Símbolo de dólar */}
        <div className={`${color.text} font-bold text-xs z-10 font-serif`}>
          $
        </div>
      </div>
    </div>
  )
}

interface LargestTransferCardProps {
  largestTransfer: LargestTransfer | null
}

export function LargestTransferCard ({ largestTransfer }: LargestTransferCardProps) {
  // Si no hay transferencias, mostrar un mensaje
  if (!largestTransfer) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            <BanknoteIcon className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay transferencias registradas</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calcular número de billetes a mostrar (máximo 6)
  const numBills = Math.min(Math.max(Math.floor(largestTransfer.amount / 500), 3), 6)
  const billRotations = [-8, 5, -3, 7, -5, 4]

  return (
    <Card className="border-2 border-yellow-500/20 bg-linear-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20">
      <CardHeader className="relative z-10">
        <div className="flex items-center gap-2">
          <BanknoteIcon className="size-5 text-yellow-600" />
          <CardTitle className="text-lg bg-linear-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            Mayor Transferencia
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-6">
        {/* Jugador que envió */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
          <Avatar className="size-12 border-2 border-blue-500">
            <AvatarImage src={largestTransfer.fromPlayer.user?.image || undefined} alt={largestTransfer.fromPlayer.name} />
            <AvatarFallback className="bg-blue-500/10 text-blue-600 font-semibold">
              {largestTransfer.fromPlayer.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">De</p>
            <p className="font-bold text-lg">{largestTransfer.fromPlayer.name}</p>
          </div>
        </div>

        {/* Billetes y monto */}
        <div className="relative">
          <div className="flex items-center justify-center gap-3 py-4">
            {/* Billetes de Monopoly */}
            <div className="flex items-center gap-1">
              {Array.from({ length: numBills }).map((_, index) => {
                const rotation = billRotations[index % billRotations.length]
                const color = monopolyColors[index % monopolyColors.length]
                return (
                  <MoneyBill
                    key={index}
                    rotation={rotation}
                    index={index}
                    color={color}
                  />
                )
              })}
            </div>
          </div>

          {/* Monto destacado */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <ArrowRightIcon className="size-5 text-muted-foreground" />
              <p className="text-4xl font-bold bg-linear-to-r from-yellow-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent drop-shadow-sm">
                ${largestTransfer.amount.toLocaleString()}
              </p>
            </div>
            <p className="text-xs text-muted-foreground font-medium">La transferencia más grande del juego</p>
          </div>
        </div>

        {/* Jugador que recibió */}
        {largestTransfer.toPlayer && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/50">
            <Avatar className="size-12 border-2 border-green-500">
              <AvatarImage src={largestTransfer.toPlayer.user?.image || undefined} alt={largestTransfer.toPlayer.name} />
              <AvatarFallback className="bg-green-500/10 text-green-600 font-semibold">
                {largestTransfer.toPlayer.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium">Para</p>
              <p className="font-bold text-lg">{largestTransfer.toPlayer.name}</p>
            </div>
          </div>
        )}

        {/* Descripción */}
        {largestTransfer.description && (
          <div className="pt-4 border-t border-yellow-200/50 dark:border-yellow-800/50">
            <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-yellow-200/50 dark:border-yellow-800/30">
              <p className="text-xs text-muted-foreground font-medium mb-1">Descripción</p>
              <p className="text-sm font-medium text-foreground italic">
                &quot;{largestTransfer.description}&quot;
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
