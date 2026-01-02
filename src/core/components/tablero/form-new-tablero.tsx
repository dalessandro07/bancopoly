'use client'

import { actionCreateTablero } from '@/src/core/actions/tablero'
import { Button } from '@/src/core/components/ui/button'
import { Input } from '@/src/core/components/ui/input'
import { Label } from '@/src/core/components/ui/label'
import { PlusCircleIcon, SparklesIcon } from 'lucide-react'
import { useActionState } from 'react'

export default function FormNewTablero () {

  const [, formAction, isPending] = useActionState(actionCreateTablero, null)

  return (
    <section className="bg-linear-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-6 border-2 border-primary/20 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <SparklesIcon className="size-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Crear nuevo tablero</h2>
          <p className="text-sm text-muted-foreground">Comienza una nueva partida de Monopoly</p>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base font-semibold">
            Nombre del tablero
          </Label>
          <Input
            disabled={isPending}
            name="name"
            id="name"
            type="text"
            placeholder="Ej: Partida del viernes"
            className="h-12 text-base"
            required
          />
        </div>

        <Button
          disabled={isPending}
          type="submit"
          size="lg"
          className="w-full h-12 text-base font-semibold"
        >
          {isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
              Creando tablero...
            </>
          ) : (
            <>
              <PlusCircleIcon className="size-5 mr-2" />
              Crear tablero
            </>
          )}
        </Button>
      </form>
    </section>
  )
}
