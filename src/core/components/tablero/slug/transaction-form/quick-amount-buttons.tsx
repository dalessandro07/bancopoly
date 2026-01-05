'use client'

import { Button } from '@/src/core/components/ui/button'
import { memo, useCallback } from 'react'

interface QuickAmountButtonsProps {
  onQuickAmount: (amount: number, description?: string) => void
  disabled?: boolean
  showBankAmount?: boolean
}

const QUICK_AMOUNTS = [5, 10, 20, 50, 100] as const

function QuickAmountButtonsComponent ({
  onQuickAmount,
  disabled,
  showBankAmount = false,
}: QuickAmountButtonsProps) {
  const handleClick = useCallback(
    (amount: number, description?: string) => {
      onQuickAmount(amount, description)
    },
    [onQuickAmount]
  )

  return (
    <div className="flex gap-2 flex-wrap">
      {QUICK_AMOUNTS.map((quickAmount) => (
        <Button
          key={quickAmount}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleClick(quickAmount)}
          disabled={disabled}
          className="flex-1 min-w-[60px]"
        >
          ${quickAmount}
        </Button>
      ))}
      {showBankAmount ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleClick(200, 'Salida')}
          disabled={disabled}
          className="flex-1 min-w-[60px] bg-primary/10 border-primary/20"
        >
          $200
        </Button>
      ) : null}
    </div>
  )
}

export const QuickAmountButtons = memo(QuickAmountButtonsComponent)
