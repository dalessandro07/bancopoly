'use client'

import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

const TABLERO_CONFIRM_BACK = 'tableroConfirmBack'

/**
 * Intercepta el botón atrás del navegador/dispositivo y muestra confirmación
 * antes de salir de la página actual (p. ej. del tablero).
 * Devuelve estado y handlers para un diálogo de confirmación.
 * @param enabled - Si es false, no se intercepta el atrás (p. ej. en /resultados).
 */
export function useConfirmBack (enabled = true) {
  const pathname = usePathname()
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)

  const cancelLeave = useCallback(() => {
    setShowConfirm(false)
    if (typeof window !== 'undefined') {
      window.history.pushState({ [TABLERO_CONFIRM_BACK]: true }, '', pathname ?? window.location.pathname)
    }
  }, [pathname])

  const confirmLeave = useCallback(() => {
    setShowConfirm(false)
    router.back()
  }, [router])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !pathname) return

    // Añadir una entrada al historial para poder interceptar el primer "atrás"
    window.history.pushState({ [TABLERO_CONFIRM_BACK]: true }, '', pathname)
  }, [pathname, enabled])

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (!enabled) return
      const state = event.state as Record<string, unknown> | null
      if (state?.[TABLERO_CONFIRM_BACK]) {
        setShowConfirm(true)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [enabled])

  return { showConfirm, setShowConfirm, confirmLeave, cancelLeave }
}
