'use client'

import { Button } from '@/src/core/components/ui/button'
import { memo, useCallback, useEffect, useRef } from 'react'

interface AmountInputProps {
  amount: string
  onAmountChange: (value: string) => void
  disabled?: boolean
}

function AmountInputComponent ({ amount, onAmountChange, disabled }: AmountInputProps) {
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
    // Permitir vacío o números válidos
    if (value === '' || /^\d+$/.test(value)) {
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

    // Primer incremento inmediato
    const currentAmount = parseFloat(amountRef.current) || 0
    onAmountChange((currentAmount + 1).toString())

    // Delay antes de empezar el intervalo rápido
    timeoutRef.current = setTimeout(() => {
      if (!isPressedRef.current) return

      // Intervalo rápido (cada 50ms)
      intervalRef.current = setInterval(() => {
        const current = parseFloat(amountRef.current) || 0
        onAmountChange((current + 1).toString())
      }, 50)
    }, 300) // 300ms de delay antes de empezar el intervalo rápido
  }, [onAmountChange, disabled])

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
    // Prevenir el onClick si se ejecutó onMouseDown recientemente (dentro de los últimos 500ms)
    const timeSinceMouseDown = Date.now() - lastMouseDownTimeRef.current
    if (timeSinceMouseDown < 500) {
      e.preventDefault()
      return
    }
    const currentAmount = parseFloat(amount) || 0
    const newAmount = currentAmount + 1
    onAmountChange(newAmount.toString())
  }, [amount, onAmountChange])

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
        disabled={disabled}
        className="rounded-md shrink-0 select-none"
        aria-label="Incrementar monto"
      >
        <span className="text-2xl font-semibold">+</span>
      </Button>
    </div>
  )
}

export const AmountInput = memo(AmountInputComponent)
