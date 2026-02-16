'use client'

import { useConfirmBack } from '@/src/core/hooks/use-confirm-back'
import { Button } from '@/src/core/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/core/components/ui/dialog'
import { usePathname } from 'next/navigation'

export default function TableroSlugLayout ({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isResultados = pathname?.includes('/resultados') ?? false
  const { showConfirm, setShowConfirm, confirmLeave, cancelLeave } = useConfirmBack(!isResultados)

  return (
    <>
      <Dialog open={showConfirm} onOpenChange={(open) => { if (!open) cancelLeave(); setShowConfirm(open) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>¿Salir del tablero?</DialogTitle>
            <DialogDescription>
              Si sales, dejarás de ver el juego en vivo. Puedes volver a entrar más tarde con el mismo enlace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelLeave}>
              Cancelar
            </Button>
            <Button variant="default" onClick={confirmLeave}>
              Salir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {children}
    </>
  )
}
