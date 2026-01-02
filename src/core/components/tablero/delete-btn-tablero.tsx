'use client'

import { actionDeleteTablero } from '@/src/core/actions/tablero'
import { Button } from '@/src/core/components/ui/button'
import { useTransition } from 'react'
import { toast } from 'sonner'

export default function DeleteBtnTablero ({ tableroId }: { tableroId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDeleteTablero = async () => {
    startTransition(async () => {
      const result = await actionDeleteTablero(tableroId)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div onClick={(e) => e.preventDefault()}>
      <form action={handleDeleteTablero}>
        <input type="hidden" name="tableroId" value={tableroId} />
        <Button variant="destructive" type="submit" disabled={isPending}>
          {isPending ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </form>
    </div>
  )
}
