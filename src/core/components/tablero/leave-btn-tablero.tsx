'use client'

import { actionLeaveTablero } from '@/src/core/actions/tablero'
import { Button } from '@/src/core/components/ui/button'
import { useTransition } from 'react'
import { toast } from 'sonner'

export default function LeaveBtnTablero ({ tableroId }: { tableroId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleLeaveTablero = async () => {
    startTransition(async () => {
      const result = await actionLeaveTablero(tableroId)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button variant="outline" onClick={handleLeaveTablero} disabled={isPending}>
      {isPending ? 'Saliendo...' : 'Salir de la sala'}
    </Button>
  )
}
