'use client'

import { actionJoinTablero } from '@/src/core/actions/tablero'
import GoogleLogin from '@/src/core/components/auth/google-login'
import { Button } from '@/src/core/components/ui/button'
import { Input } from '@/src/core/components/ui/input'
import { authClient } from '@/src/core/lib/auth/auth-client'
import { useActionState } from 'react'

export default function FormJoinTablero ({ tableroId }: { tableroId: string }) {
  const { data: session, isPending } = authClient.useSession()
  const [, formAction, isPendingForm] = useActionState(actionJoinTablero, null)

  return (
    <section>
      <h2>Unirse al tablero</h2>

      {
        session?.user ? (
          <form action={formAction}>
            <input type="hidden" name="tableroId" value={tableroId} />
            <Input disabled={isPending || isPendingForm} name="name" defaultValue={session?.user?.name as string} type="text" placeholder="Nombre del jugador" />

            <Button disabled={isPending || isPendingForm} type="submit">
              {isPendingForm ? 'Uniendo...' : 'Unirse al tablero'}
            </Button>
          </form>
        ) : (
          <GoogleLogin redirectTo={`/tablero/${tableroId}`} />
        )
      }


    </section>
  )
}
