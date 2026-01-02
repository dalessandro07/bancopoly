'use client'

import { actionCloseTablero } from '@/src/core/actions/tablero'
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
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

export default function CloseBtnTablero ({ tableroId }: { tableroId: string }) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleCloseTablero = async () => {
    startTransition(async () => {
      const result = await actionCloseTablero(tableroId)
      if (result.success) {
        toast.success(result.message)
        setIsOpen(false)
        router.push(`/tablero/${tableroId}/resultados`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="w-full"
        >
          Cerrar Sala
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cerrar la sala?</DialogTitle>
          <DialogDescription>
            Al cerrar la sala, el juego terminará y todos los jugadores podrán ver el ranking final y las estadísticas del juego. Esta acción no se puede deshacer.
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
            variant="default"
            onClick={handleCloseTablero}
            disabled={isPending}
          >
            {isPending ? 'Cerrando...' : 'Cerrar Sala'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
