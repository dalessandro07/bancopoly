'use client'

import { useEffect, useState } from 'react'

// Lazy load confetti solo cuando se necesita
const loadConfetti = () => import('canvas-confetti').then(mod => mod.default)

interface TransactionReceivedCardProps {
  amount: number
  fromName: string
  description?: string | null
  onClose: () => void
}

// Función simplificada para mostrar confetti
async function showEnhancedConfetti () {
  const confetti = await loadConfetti()
  const duration = 1500
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 9999 }

  function randomInRange (min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 30 * (timeLeft / duration)
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#22c55e', '#16a34a', '#fbbf24', '#f59e0b'],
    })
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#22c55e', '#16a34a', '#fbbf24', '#f59e0b'],
    })
  }, 300)

  // Confetti inicial simplificado
  confetti({
    particleCount: 100,
    spread: 80,
    origin: { y: 0.5 },
    colors: ['#22c55e', '#16a34a', '#fbbf24', '#f59e0b'],
  })
}

// Colores estilo Monopoly
const monopolyColors = [
  { bg: 'bg-green-500', border: 'border-green-700', text: 'text-green-900' }, // Verde
  { bg: 'bg-blue-500', border: 'border-blue-700', text: 'text-blue-900' }, // Azul
  { bg: 'bg-pink-500', border: 'border-pink-700', text: 'text-pink-900' }, // Rosa
  { bg: 'bg-orange-500', border: 'border-orange-700', text: 'text-orange-900' }, // Naranja
  { bg: 'bg-red-500', border: 'border-red-700', text: 'text-red-900' }, // Rojo
  { bg: 'bg-yellow-500', border: 'border-yellow-700', text: 'text-yellow-900' }, // Amarillo
  { bg: 'bg-purple-500', border: 'border-purple-700', text: 'text-purple-900' }, // Morado
  { bg: 'bg-cyan-500', border: 'border-cyan-700', text: 'text-cyan-900' }, // Cian
]

// Componente de billete simplificado (sin animaciones complejas)
function MoneyBill ({ delay = 0, rotation = 0, index = 0, color }: { delay?: number; rotation?: number; index?: number; color: typeof monopolyColors[0] }) {
  return (
    <div
      className="relative animate-in fade-in zoom-in-95 duration-500"
      style={{
        animationDelay: `${delay * 1000}ms`,
        transform: `rotate(${rotation}deg)`,
        zIndex: 10 - index
      }}
    >
      <div
        className={`w-12 h-24 ${color.bg} rounded shadow-lg border-2 ${color.border} flex items-center justify-center relative overflow-hidden`}
      >
        {/* Patrón estilo Monopoly */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1 left-1 w-4 h-4 border border-white/50 rounded-full"></div>
          <div className="absolute bottom-1 right-1 w-3 h-3 border border-white/50 rounded-full"></div>
        </div>
        {/* Símbolo de dólar */}
        <div className={`${color.text} font-bold text-sm z-10 font-serif`}>
          $
        </div>
      </div>
    </div>
  )
}

export default function TransactionReceivedCard ({
  amount,
  onClose,
}: TransactionReceivedCardProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Mostrar confetti al aparecer
    showEnhancedConfetti()

    // Auto-cerrar después de 3 segundos
    const timer = setTimeout(() => {
      setIsVisible(false)
      // Llamar onClose después de un pequeño delay para permitir la animación de salida
      setTimeout(() => {
        onClose()
      }, 300)
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  // Generar rotaciones aleatorias para los billetes
  const billRotations = [-15, 10, -8, 12, -5, 8, -12, 6]

  // Calcular cuántos billetes mostrar (máximo 8)
  const numBills = Math.min(8, Math.max(3, Math.ceil(amount / 50)))

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none gap-6 animate-in fade-in duration-300"
    >
      {/* Billetes animados - solo billetes, sin fondo */}
      <div
        className="flex justify-center items-center gap-2 flex-wrap animate-in zoom-in-95 duration-500"
        style={{ maxWidth: '300px' }}
      >
        {Array.from({ length: numBills }).map((_, index) => {
          const rotation = billRotations[index % billRotations.length]
          const color = monopolyColors[index % monopolyColors.length]
          return (
            <MoneyBill
              key={index}
              delay={0.1 + index * 0.08}
              rotation={rotation}
              index={index}
              color={color}
            />
          )
        })}
      </div>

      {/* Monto grande */}
      <div
        className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: '400ms' }}
      >
        <div className="text-6xl font-bold text-green-600 drop-shadow-lg animate-pulse">
          ${amount.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
