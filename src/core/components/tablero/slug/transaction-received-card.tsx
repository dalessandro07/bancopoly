'use client'

import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface TransactionReceivedCardProps {
  amount: number
  fromName: string
  description?: string | null
  onClose: () => void
}

// Función mejorada para mostrar confetti
function showEnhancedConfetti () {
  const duration = 2000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

  function randomInRange (min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b', '#eab308'],
    })
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b', '#eab308'],
    })
  }, 250)

  // Confetti inicial más intenso
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.5 },
    colors: ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b', '#eab308'],
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

// Componente de billete estilo Monopoly
function MoneyBill ({ delay = 0, rotation = 0, index = 0, color }: { delay?: number; rotation?: number; index?: number; color: typeof monopolyColors[0] }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: -45, y: -50 }}
      animate={{
        opacity: 1,
        scale: 1,
        rotate: rotation,
        y: [0, -8, 0],
        x: [0, Math.sin(index) * 3, 0]
      }}
      exit={{ opacity: 0, scale: 0, rotate: 45, y: 50 }}
      transition={{
        delay,
        duration: 0.6,
        type: "spring",
        stiffness: 200,
        damping: 15,
        y: {
          repeat: Infinity,
          duration: 2.5 + index * 0.2,
          ease: "easeInOut"
        },
        x: {
          repeat: Infinity,
          duration: 3 + index * 0.3,
          ease: "easeInOut"
        }
      }}
      className="relative"
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        zIndex: 10 - index
      }}
    >
      <motion.div
        className={`w-12 h-24 ${color.bg} rounded shadow-lg border-2 ${color.border} flex items-center justify-center relative overflow-hidden`}
        style={{
          transform: `rotateY(${rotation}deg) rotateZ(${rotation * 0.3}deg)`,
        }}
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
        {/* Brillo sutil */}
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent -skew-x-12"
          animate={{
            x: ['-200%', '200%'],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "linear",
            delay: index * 0.3
          }}
        />
      </motion.div>
    </motion.div>
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
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  // Generar rotaciones aleatorias para los billetes
  const billRotations = [-15, 10, -8, 12, -5, 8, -12, 6]

  // Calcular cuántos billetes mostrar (máximo 8)
  const numBills = Math.min(8, Math.max(3, Math.ceil(amount / 50)))

  return (
    <AnimatePresence onExitComplete={onClose}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none gap-6"
        >
          {/* Billetes animados - solo billetes, sin fondo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              duration: 0.5
            }}
            className="flex justify-center items-center gap-2 flex-wrap"
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
          </motion.div>

          {/* Monto grande */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{
              delay: 0.4,
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className="text-center"
          >
            <motion.div
              className="text-6xl font-bold text-green-600 drop-shadow-lg"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              ${amount.toLocaleString()}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
