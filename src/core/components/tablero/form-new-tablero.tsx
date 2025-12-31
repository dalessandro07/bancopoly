'use client'

import { actionCreateTablero } from '@/src/core/actions/tablero'
import { Button } from '@/src/core/components/ui/button'
import { Input } from '@/src/core/components/ui/input'
import { useActionState } from 'react'

export default function FormNewTablero () {

  const [, formAction, isPending] = useActionState(actionCreateTablero, null)

  return (
    <section>
      <h2>Crear tablero</h2>

      <form action={formAction}>
        <Input disabled={isPending} name="name" type="text" placeholder="Nombre del tablero" />
        <Button disabled={isPending} type="submit">
          {isPending ? 'Creando...' : 'Crear tablero'}
        </Button>
      </form>
    </section>
  )
}
