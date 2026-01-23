import { BanknoteIcon, FilterIcon } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
}

function EmptyState ({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-12">
      <div className="inline-flex items-center justify-center size-16 rounded-full bg-muted mb-4">
        {icon || <BanknoteIcon className="size-8 text-muted-foreground" />}
      </div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground text-sm text-center">
        {description}
      </p>
    </div>
  )
}

export function EmptyTransactionsState () {
  return (
    <EmptyState
      title="Sin transacciones"
      description="Las transacciones aparecerán aquí"
      icon={<BanknoteIcon className="size-8 text-muted-foreground" />}
    />
  )
}

export function EmptyFilteredState () {
  return (
    <EmptyState
      title="No hay transacciones con este filtro"
      description="Intenta con otro filtro"
      icon={<FilterIcon className="size-8 text-muted-foreground" />}
    />
  )
}
