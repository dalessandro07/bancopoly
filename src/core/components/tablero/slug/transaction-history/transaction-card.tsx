import { Avatar, AvatarFallback, AvatarImage } from '@/src/core/components/ui/avatar'
import { ArrowRightIcon } from 'lucide-react'
import type { TPlayer, TTransaction } from '@/src/core/lib/db/schema'
import { formatDate, getFirstName, getPlayerFullName } from './utils'

type PlayerWithUser = TPlayer & {
  user?: { id: string; name: string; email: string; image: string | null } | null
}

type EnrichedTransaction = TTransaction & {
  fromPlayer?: PlayerWithUser | null
  toPlayer?: PlayerWithUser | null
}

interface TransactionCardProps {
  transaction: EnrichedTransaction
  currentPlayerId?: string
}

export function TransactionCard ({ transaction, currentPlayerId }: TransactionCardProps) {
  const isSender = transaction.fromPlayerId === currentPlayerId
  const isReceiver = transaction.toPlayerId === currentPlayerId

  const fromPlayer = transaction.fromPlayer
  const toPlayer = transaction.toPlayer

  const fromNameFull = getPlayerFullName(fromPlayer)
  const toNameFull = getPlayerFullName(toPlayer)
  const fromName = getFirstName(fromNameFull)
  const toName = getFirstName(toNameFull)

  return (
    <div className="p-4 rounded-xl border bg-card transition-all hover:shadow-md">
      {/* Monto y Fecha */}
      <div className="flex items-start justify-between mb-3">
        <span
          className={`text-3xl font-bold ${
            isSender ? 'text-destructive' : isReceiver ? 'text-green-500' : 'text-foreground'
          }`}
        >
          {isSender ? '-' : isReceiver ? '+' : ''}${transaction.amount.toLocaleString()}
        </span>
        <div className="text-xs font-medium text-muted-foreground">
          {formatDate(transaction.createdAt)}
        </div>
      </div>

      {/* Jugadores involucrados */}
      <div className="flex items-center gap-3 mb-3">
        {/* Jugador que envía */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar
            className={`size-8 border-2 ${isSender ? 'border-destructive' : 'border-muted'}`}
          >
            {fromPlayer?.user?.image ? (
              <AvatarImage src={fromPlayer.user.image} alt={fromNameFull} />
            ) : null}
            <AvatarFallback
              className={`text-xs ${isSender ? 'bg-destructive/10 text-destructive' : 'bg-muted'}`}
            >
              {fromNameFull.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium truncate ${
                isSender ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              <span className="md:hidden">{fromName}</span>
              <span className="hidden md:inline">{fromNameFull}</span>
            </p>
          </div>
        </div>

        {/* Flecha */}
        <ArrowRightIcon
          className={`size-5 shrink-0 ${
            isSender ? 'text-destructive' : isReceiver ? 'text-green-500' : 'text-muted-foreground'
          }`}
        />

        {/* Jugador que recibe */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-1 min-w-0 text-right">
            <p
              className={`text-sm font-medium truncate ${
                isReceiver ? 'text-green-500' : 'text-muted-foreground'
              }`}
            >
              <span className="md:hidden">{toName}</span>
              <span className="hidden md:inline">{toNameFull}</span>
            </p>
          </div>
          <Avatar
            className={`size-8 border-2 ${isReceiver ? 'border-green-500' : 'border-muted'}`}
          >
            {toPlayer?.user?.image ? (
              <AvatarImage src={toPlayer.user.image} alt={toNameFull} />
            ) : null}
            <AvatarFallback
              className={`text-xs ${
                isReceiver ? 'bg-green-500/10 text-green-500' : 'bg-muted'
              }`}
            >
              {toNameFull.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Descripción si existe */}
      {transaction.description && (
        <p className="text-sm text-foreground line-clamp-2 mt-3 p-3 bg-muted/50 rounded-lg">
          {transaction.description}
        </p>
      )}
    </div>
  )
}
