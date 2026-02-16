'use client'

import { Button } from '@/src/core/components/ui/button'
import { memo, useCallback, useEffect, useRef } from 'react'

interface AmountInputProps {
  amount: string
  onAmountChange: (value: string) => void
  disabled?: boolean
  /** Saldo máximo (ej. saldo del jugador origen). No aplica si es banco. */
  maxAmount?: number
}

function AmountInputComponent ({ amount, onAmountChange, disabled, maxAmount }: AmountInputProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isPressedRef = useRef(false)
  const amountRef = useRef(amount)
  const lastMouseDownTimeRef = useRef<number>(0)

  // Actualizar el ref cuando cambie el amount
  useEffect(() => {
    amountRef.current = amount
  }, [amount])

  // Limpiar intervalos al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '') {
      onAmountChange('')
      return
    }
    if (!/^\d+$/.test(value)) return
    const n = parseInt(value, 10)
    if (maxAmount != null && n > maxAmount) {
      onAmountChange(maxAmount.toString())
    } else {
      onAmountChange(value)
    }
  }

  const stopInterval = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault()
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    isPressedRef.current = false
  }, [])

  const startIncrement = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (disabled || isPressedRef.current) return

    isPressedRef.current = true
    lastMouseDownTimeRef.current = Date.now()

    // Primer incremento inmediato (respetando máximo)
    const currentAmount = parseFloat(amountRef.current) || 0
    const next = maxAmount != null ? Math.min(currentAmount + 1, maxAmount) : currentAmount + 1
    onAmountChange(next.toString())

    // Delay antes de empezar el intervalo rápido
    timeoutRef.current = setTimeout(() => {
      if (!isPressedRef.current) return

      // Intervalo rápido (cada 50ms), respetando máximo
      intervalRef.current = setInterval(() => {
        const current = parseFloat(amountRef.current) || 0
        const next = maxAmount != null ? Math.min(current + 1, maxAmount) : current + 1
        if (next === current) return
        onAmountChange(next.toString())
      }, 50)
    }, 300) // 300ms de delay antes de empezar el intervalo rápido
  }, [onAmountChange, disabled, maxAmount])

  const startDecrement = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (disabled || isPressedRef.current) return

    const currentAmount = parseFloat(amountRef.current) || 0
    if (currentAmount <= 1) return

    isPressedRef.current = true
    lastMouseDownTimeRef.current = Date.now()

    // Primer decremento inmediato
    const newAmount = Math.max(1, currentAmount - 1)
    onAmountChange(newAmount.toString())

    // Delay antes de empezar el intervalo rápido
    timeoutRef.current = setTimeout(() => {
      if (!isPressedRef.current) return

      // Intervalo rápido (cada 50ms)
      intervalRef.current = setInterval(() => {
        const current = parseFloat(amountRef.current) || 0
        if (current <= 1) {
          stopInterval()
          onAmountChange('1')
          return
        }
        onAmountChange((current - 1).toString())
      }, 50)
    }, 300) // 300ms de delay antes de empezar el intervalo rápido
  }, [onAmountChange, disabled, stopInterval])

  const handleIncrement = useCallback((e: React.MouseEvent) => {
    const timeSinceMouseDown = Date.now() - lastMouseDownTimeRef.current
    if (timeSinceMouseDown < 500) {
      e.preventDefault()
      return
    }
    const currentAmount = parseFloat(amount) || 0
    const newAmount = maxAmount != null ? Math.min(currentAmount + 1, maxAmount) : currentAmount + 1
    onAmountChange(newAmount.toString())
  }, [amount, onAmountChange, maxAmount])

  const handleDecrement = useCallback((e: React.MouseEvent) => {
    // Prevenir el onClick si se ejecutó onMouseDown recientemente (dentro de los últimos 500ms)
    const timeSinceMouseDown = Date.now() - lastMouseDownTimeRef.current
    if (timeSinceMouseDown < 500) {
      e.preventDefault()
      return
    }
    const currentAmount = parseFloat(amount) || 0
    const newAmount = Math.max(1, currentAmount - 1)
    onAmountChange(newAmount.toString())
  }, [amount, onAmountChange])

  const currentAmount = parseFloat(amount) || 0
  const canDecrement = currentAmount > 1
  const canIncrement = maxAmount == null || currentAmount < maxAmount

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        onClick={handleDecrement}
        onMouseDown={startDecrement}
        onMouseUp={stopInterval}
        onMouseLeave={stopInterval}
        onTouchStart={startDecrement}
        onTouchEnd={stopInterval}
        disabled={disabled || !canDecrement}
        className="rounded-md shrink-0 select-none"
        aria-label="Decrementar monto"
      >
        <span className="text-2xl font-semibold">−</span>
      </Button>

      <input
        type="number"
        id="amount"
        name="amount"
        min="1"
        max={maxAmount}
        required
        disabled={disabled}
        placeholder="0"
        value={amount}
        onChange={handleInputChange}
        className="w-full text-center text-6xl font-semibold bg-transparent border-0 outline-none shadow-none focus:outline-none focus:ring-0 focus:shadow-none disabled:opacity-50 text-foreground dark:text-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
        autoFocus={false}
        inputMode="numeric"
      />

      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        onClick={handleIncrement}
        onMouseDown={startIncrement}
        onMouseUp={stopInterval}
        onMouseLeave={stopInterval}
        onTouchStart={startIncrement}
        onTouchEnd={stopInterval}
        disabled={disabled || !canIncrement}
        className="rounded-md shrink-0 select-none"
        aria-label="Incrementar monto"
      >
        <span className="text-2xl font-semibold">+</span>
      </Button>
    </div>
  )
}

export const AmountInput = memo(AmountInputComponent)
