'use client'

import { actionDeletePlayer } from '@/src/core/actions/tablero'
import { Button } from '@/src/core/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/core/components/ui/dialog'
import { TrashIcon } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

export default function DeleteBtnPlayer ({ playerId, tableroId }: { playerId: string, tableroId: string }) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)

  const handleDeletePlayer = async () => {
    startTransition(async () => {
      const result = await actionDeletePlayer(playerId, tableroId)
      if (result.success) {
        toast.success(result.message)
        setIsOpen(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <TrashIcon className="size-4" />
          <span className="sr-only">Eliminar jugador</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar jugador?</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El jugador será eliminado del tablero y perderá acceso a todas las transacciones.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeletePlayer}
            disabled={isPending}
          >
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
