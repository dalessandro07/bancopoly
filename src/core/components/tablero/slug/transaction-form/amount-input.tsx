'use client'

import { memo } from 'react'

interface AmountInputProps {
  amount: string
  onAmountChange: (value: string) => void
  disabled?: boolean
}

function AmountInputComponent ({ amount, onAmountChange, disabled }: AmountInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Permitir vacío o números válidos
    if (value === '' || /^\d+$/.test(value)) {
      onAmountChange(value)
    }
  }

  return (
    <input
      type="number"
      id="amount"
      name="amount"
      min="1"
      required
      disabled={disabled}
      placeholder="0"
      value={amount}
      onChange={handleInputChange}
      className="w-full text-center text-6xl font-semibold bg-transparent border-0 outline-none shadow-none focus:outline-none focus:ring-0 focus:shadow-none disabled:opacity-50 text-foreground dark:text-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
      autoFocus={false}
      inputMode="numeric"
    />
  )
}

export const AmountInput = memo(AmountInputComponent)
