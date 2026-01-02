'use client'

import { actionDeletePlayer } from '@/src/core/actions/tablero'
import { Button } from '@/src/core/components/ui/button'
import { useTransition } from 'react'
import { toast } from 'sonner'

export default function DeleteBtnPlayer ({ playerId, tableroId }: { playerId: string, tableroId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDeletePlayer = async () => {
    startTransition(async () => {
      const result = await actionDeletePlayer(playerId, tableroId)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDeletePlayer} disabled={isPending}>
      {isPending ? 'Eliminando...' : 'Eliminar'}
    </Button>
  )
}
