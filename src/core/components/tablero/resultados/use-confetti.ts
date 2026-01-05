import confetti from 'canvas-confetti'
import { useEffect, useRef } from 'react'

export function useConfetti (currentUserId: string | null, winnerUserId: string | undefined) {
  const confettiShownRef = useRef(false)

  useEffect(() => {
    // Solo mostrar confetti si el usuario es el ganador y no se ha mostrado antes
    if (currentUserId && winnerUserId && currentUserId === winnerUserId && !confettiShownRef.current) {
      confettiShownRef.current = true

      // Confetti más elaborado para el ganador
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

      function randomInRange (min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      // Confetti inicial desde el centro
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.5, y: 0.5 },
        zIndex: 9999
      })

      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [currentUserId, winnerUserId])
}
