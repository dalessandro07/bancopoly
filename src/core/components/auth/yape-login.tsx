'use client'

import confetti from 'canvas-confetti'
import Image from "next/image"
import { startTransition, useEffect, useState } from "react"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "../ui/dialog"

type LoadingStep = 'idle' | 'conectando' | 'vaciando' | 'completado'

export default function YapeLogin () {
  const [open, setOpen] = useState(false)
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('idle')
  const [phoneNumber, setPhoneNumber] = useState('')

  const handleConnect = () => {
    setOpen(true)
    setLoadingStep('conectando')
  }

  useEffect(() => {
    if (!open) {
      startTransition(() => {
        setLoadingStep('idle')
      })
      return
    }

    if (loadingStep === 'conectando') {

      startTransition(() => {
        // Iniciar con 9 seguido de números aleatorios
        const initialRandom = '9' + Array.from({ length: 8 }, () =>
          Math.floor(Math.random() * 10)
        ).join('')

        setPhoneNumber(initialRandom)
      })

      // Animar números cambiando continuamente sin número final
      // El primer dígito siempre será 9
      const numberInterval = setInterval(() => {
        // Generar un nuevo número aleatorio de 9 dígitos, siempre empezando con 9
        const newRandomNumber = '9' + Array.from({ length: 8 }, () =>
          Math.floor(Math.random() * 10)
        ).join('')
        setPhoneNumber(newRandomNumber)
      }, 50) // Cambiar cada 50ms para animación rápida y continua

      const timer = setTimeout(() => {
        clearInterval(numberInterval)
        setLoadingStep('vaciando')
      }, 2000) // 2 segundos en "Conectando"


      return () => {
        clearTimeout(timer)
        clearInterval(numberInterval)
      }
    }

    if (loadingStep === 'vaciando') {
      const timer = setTimeout(() => {
        setLoadingStep('completado')
      }, 2500) // 2.5 segundos en "Vaciando cuenta"
      return () => clearTimeout(timer)
    }

    if (loadingStep === 'completado') {
      // Disparar confetti cuando se completa
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
        zIndex: 9999,
        colors: ['#8b3c99', '#a855c7', '#c084fc', '#d8b4fe', '#e9d5ff']
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
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#8b3c99', '#a855c7', '#c084fc', '#d8b4fe', '#e9d5ff']
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#8b3c99', '#a855c7', '#c084fc', '#d8b4fe', '#e9d5ff']
        })
      }, 250)

      const timer = setTimeout(() => {
        clearInterval(interval)
        setOpen(false)
        setLoadingStep('idle')
      }, 4000) // 4 segundos mostrando el mensaje de agradecimiento antes de cerrar automáticamente

      return () => {
        clearTimeout(timer)
        clearInterval(interval)
      }
    }
  }, [open, loadingStep])

  const getStepContent = () => {
    switch (loadingStep) {
      case 'conectando':
        return {
          title: 'Conectando',
          message: 'Estableciendo conexión con tu cuenta de Yape...',
          showSpinner: true
        }
      case 'vaciando':
        return {
          title: 'Vaciando cuenta',
          message: 'Transfiriendo todos tus fondos...',
          showSpinner: true
        }
      case 'completado':
        return {
          title: '¡Gracias!',
          message: 'Gracias por depositar los fondos de tu cuenta de Yape.',
          showSpinner: false
        }
      default:
        return {
          title: '',
          message: '',
          showSpinner: false
        }
    }
  }

  const stepContent = getStepContent()

  return (
    <>
      <Button
        onClick={handleConnect}
        size="lg"
        className="w-full group relative overflow-hidden"
        style={{ backgroundColor: '#8b3c99' }}
      >
        <Image
          src="/yape.jpg"
          alt="Yape"
          width={20}
          height={20}
          className="mr-2 rounded"
        />
        <span className="font-medium text-white">Conectar cuenta de Yape</span>
      </Button>

      <Dialog open={open} onOpenChange={(isOpen) => {
        // No permitir cerrar manualmente durante la carga
        // Solo se puede cerrar cuando esté completado o se cierra automáticamente al final
        if (!isOpen && loadingStep !== 'completado') {
          // Prevenir cierre durante la carga
          return
        }
        if (!isOpen && loadingStep === 'completado') {
          setOpen(false)
          setLoadingStep('idle')
        }
      }}>
        <DialogContent
          className="fixed! inset-0! w-screen! h-screen! max-w-none! max-h-none! rounded-none! translate-x-0! translate-y-0! p-0! m-0!"
          showCloseButton={loadingStep === 'completado'}
        >
          <DialogTitle className="sr-only">
            {stepContent.title || 'Conectando cuenta de Yape'}
          </DialogTitle>
          <div className="flex flex-col items-center justify-center space-y-8 h-screen w-screen">
            {loadingStep !== 'completado' && (
              <div className="relative">
                <div className="w-32 h-32 border-4 border-[#8b3c99]/20 border-t-[#8b3c99] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="/yape.jpg"
                    alt="Yape"
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                </div>
              </div>
            )}

            {loadingStep === 'completado' && (
              <div className="w-32 h-32 bg-[#8b3c99]/10 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                <svg
                  className="w-16 h-16 text-[#8b3c99]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}

            <div className="text-center space-y-4 animate-in fade-in duration-300">
              <h3 className="text-4xl md:text-5xl font-semibold text-foreground">
                {stepContent.title}
              </h3>
              <p className="text-muted-foreground text-lg md:text-xl max-w-md">
                {stepContent.message}
              </p>
              {loadingStep === 'conectando' && (
                <div className="mt-4">
                  <p className="text-3xl md:text-4xl font-mono font-bold text-[#8b3c99] tracking-wider">
                    {phoneNumber}
                  </p>
                </div>
              )}
            </div>

            {loadingStep === 'conectando' && (
              <div className="w-full max-w-md animate-in fade-in duration-300 px-4">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8b3c99] rounded-full transition-all duration-1000 ease-out"
                    style={{ width: '40%' }}
                  ></div>
                </div>
              </div>
            )}

            {loadingStep === 'vaciando' && (
              <div className="w-full max-w-md animate-in fade-in duration-300 px-4">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8b3c99] rounded-full transition-all duration-1000 ease-out"
                    style={{ width: '75%' }}
                  ></div>
                </div>
              </div>
            )}

            {loadingStep === 'completado' && (
              <div className="w-full max-w-md animate-in fade-in duration-300 px-4">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8b3c99] rounded-full transition-all duration-500 ease-out"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
