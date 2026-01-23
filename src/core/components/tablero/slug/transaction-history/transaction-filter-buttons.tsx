import { Button } from '@/src/core/components/ui/button'
import type { FilterType } from './use-transaction-filter'

interface TransactionFilterButtonsProps {
  filter: FilterType
  onFilterChange: (filter: FilterType) => void
}

export function TransactionFilterButtons ({
  filter,
  onFilterChange,
}: TransactionFilterButtonsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant={filter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('all')}
        className="h-8 text-xs"
      >
        Todas
      </Button>
      <Button
        variant={filter === 'sent' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('sent')}
        className="h-8 text-xs"
      >
        Enviadas
      </Button>
      <Button
        variant={filter === 'received' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('received')}
        className="h-8 text-xs"
      >
        Recibidas
      </Button>
      <Button
        variant={filter === 'bank' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('bank')}
        className="h-8 text-xs"
      >
        Banco
      </Button>
      <Button
        variant={filter === 'free_parking' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('free_parking')}
        className="h-8 text-xs"
      >
        Parada Libre
      </Button>
    </div>
  )
}
