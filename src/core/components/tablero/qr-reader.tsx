'use client'

import { Button } from '@/src/core/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/core/components/ui/dialog'
import { Html5Qrcode } from 'html5-qrcode'
import { QrCode } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export default function QRReader () {
  const [isOpen, setIsOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const qrReaderElementRef = useRef<HTMLDivElement | null>(null)
  const isStoppingRef = useRef(false)
  const router = useRouter()

  const stopScanning = useCallback(async () => {
    // Evitar múltiples llamadas simultáneas
    if (isStoppingRef.current || !html5QrCodeRef.current) {
      return
    }

    isStoppingRef.current = true
    const scanner = html5QrCodeRef.current
    html5QrCodeRef.current = null
    setIsScanning(false)

    try {
      // Verificar si el escáner está activo antes de detenerlo
      const scannerState = scanner.getState()
      if (scannerState === 2) { // STATE_SCANNING = 2
        await scanner.stop()
      }
    } catch (err) {
      // Ignorar errores de transición si ya está deteniéndose
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage.includes('transition') || errorMessage.includes('state')) {
        // El escáner ya está en proceso de detenerse, ignorar
      } else {
        console.error('Error al detener el escáner:', err)
      }
    } finally {
      try {
        await scanner.clear()
      } catch {
        // Ignorar errores al limpiar
      }
      isStoppingRef.current = false
    }
  }, [])

  const handleQRCodeScanned = useCallback((decodedText: string) => {
    // Detener el escáner
    stopScanning()

    // Verificar si el código QR contiene una URL de tablero
    try {
      const url = new URL(decodedText)
      const pathname = url.pathname

      // Verificar si es una URL de tablero
      const tableroMatch = pathname.match(/^\/tablero\/([^/]+)/)
      if (tableroMatch) {
        const slug = tableroMatch[1]
        setIsOpen(false)
        router.push(`/tablero/${slug}`)
        toast.success('Tablero encontrado!')
        return
      }
    } catch {
      // Si no es una URL válida, intentar como ruta relativa
      const tableroMatch = decodedText.match(/^\/tablero\/([^/]+)/)
      if (tableroMatch) {
        const slug = tableroMatch[1]
        setIsOpen(false)
        router.push(`/tablero/${slug}`)
        toast.success('Tablero encontrado!')
        return
      }
    }

    // Si no es un código QR válido de tablero
    toast.error('El código QR no es válido. Debe contener una URL de tablero.')
    setIsOpen(false)
  }, [router, stopScanning])

  const startScanning = useCallback(async () => {
    // Asegurarse de que no haya un escáner activo antes de iniciar uno nuevo
    if (html5QrCodeRef.current || isStoppingRef.current) {
      return
    }

    // Esperar a que el elemento esté disponible en el DOM
    const getElement = (): HTMLElement | null => {
      // Primero intentar con el ref
      if (qrReaderElementRef.current) {
        return qrReaderElementRef.current
      }
      // Luego intentar con getElementById
      return document.getElementById('qr-reader')
    }

    let element = getElement()
    if (!element) {
      // Esperar un poco más para que el diálogo termine de renderizarse
      await new Promise(resolve => setTimeout(resolve, 100))
      element = getElement()
    }

    if (!element) {
      console.error('Elemento qr-reader no encontrado')
      toast.error('Error al inicializar el escáner. Por favor, intenta de nuevo.')
      setIsOpen(false)
      return
    }

    // Asegurarse de que el elemento tenga un id
    if (!element.id) {
      element.id = 'qr-reader'
    }

    try {
      const html5QrCode = new Html5Qrcode(element.id)
      html5QrCodeRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleQRCodeScanned,
        () => {
          // Ignorar errores de escaneo continuo
        }
      )

      setIsScanning(true)
    } catch (err) {
      console.error('Error al iniciar el escáner:', err)
      html5QrCodeRef.current = null
      setIsScanning(false)
      toast.error('No se pudo acceder a la cámara. Asegúrate de dar permisos de cámara.')
      setIsOpen(false)
    }
  }, [handleQRCodeScanned])

  useEffect(() => {
    if (!isOpen) {
      // Si el diálogo se cierra, detener el escáner
      if (html5QrCodeRef.current) {
        stopScanning()
      }
      return
    }

    // Si el diálogo se abre y no hay escáner activo, iniciarlo
    if (isOpen && !html5QrCodeRef.current) {
      // Esperar a que el diálogo esté completamente renderizado
      const timer = setTimeout(() => {
        startScanning()
      }, 200)

      return () => {
        clearTimeout(timer)
        // Solo detener si el escáner está activo
        if (html5QrCodeRef.current) {
          stopScanning()
        }
      }
    }
  }, [isOpen, startScanning, stopScanning])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      stopScanning()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <QrCode className="mr-2 h-4 w-4" />
          Escanear código QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear código QR del tablero</DialogTitle>
          <DialogDescription>
            Apunta la cámara hacia el código QR del tablero para acceder rápidamente
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div
            ref={qrReaderElementRef}
            id="qr-reader"
            className="w-full max-w-sm rounded-lg overflow-hidden bg-black"
            style={{ minHeight: '300px' }}
          />
          {!isScanning && (
            <p className="text-sm text-muted-foreground text-center">
              Iniciando cámara...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
