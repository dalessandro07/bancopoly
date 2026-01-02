import DeleteBtnTablero from '@/src/core/components/tablero/delete-btn-tablero'
import { Button } from '@/src/core/components/ui/button'
import { HomeIcon } from 'lucide-react'
import Link from 'next/link'

interface ResultadosActionsProps {
  tableroSlug: string
  isCreator: boolean
}

export function ResultadosActions ({ tableroSlug, isCreator }: ResultadosActionsProps) {
  return (
    <div className="border-t p-4 flex gap-3 justify-center z-10">
      <Button asChild variant="default" className="flex-1 max-w-md">
        <Link href="/">
          <HomeIcon className="size-4 mr-2" />
          Regresar a inicio
        </Link>
      </Button>
      {isCreator && (
        <div className="flex-1 max-w-md">
          <DeleteBtnTablero tableroId={tableroSlug} />
        </div>
      )}
    </div>
  )
}
