'use client'

import { actionJoinTablero } from '@/src/core/actions/tablero'
import GoogleLogin from '@/src/core/components/auth/google-login'
import { Button } from '@/src/core/components/ui/button'
import { Input } from '@/src/core/components/ui/input'
import { Label } from '@/src/core/components/ui/label'
import { authClient } from '@/src/core/lib/auth/auth-client'
import { SparklesIcon, UserPlusIcon } from 'lucide-react'
import { useActionState } from 'react'

export default function FormJoinTablero({ tableroId }: { tableroId: string }) {
  const { data: session, isPending } = authClient.useSession()
  const [, formAction, isPendingForm] = useActionState(actionJoinTablero, null)

  return (
    <section className="flex flex-col items-center justify-center flex-1 py-8">
      <div className="w-full max-w-sm mx-auto">
        {/* Header con icono */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-primary/10 mb-4">
            <UserPlusIcon className="size-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Únete a la partida</h2>
          <p className="text-muted-foreground text-sm">
            Ingresa tu nombre para comenzar a jugar
          </p>
        </div>

        {isPending ? (
          <div className="space-y-6">
            <div className="bg-card border rounded-xl p-6 text-center">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Verificando sesión...
                </p>
              </div>
            </div>
          </div>
        ) : session?.user ? (
          <form action={formAction} className="space-y-6">
            <input type="hidden" name="tableroId" value={tableroId} />

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Tu nombre en el juego
              </Label>
              <Input
                id="name"
                disabled={isPending || isPendingForm}
                name="name"
                defaultValue={session?.user?.name as string}
                type="text"
                placeholder="¿Cómo te llamarás?"
                className="h-12 text-center text-lg font-medium"
                required
              />
            </div>

            <Button
              disabled={isPending || isPendingForm}
              type="submit"
              size="lg"
              className="w-full h-12 text-base font-semibold gap-2"
            >
              {isPendingForm ? (
                <>
                  <span className="animate-pulse">Uniéndote...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="size-5" />
                  Unirse al tablero
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-card border rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Inicia sesión para unirte a este tablero
              </p>
              <GoogleLogin redirectTo={`/tablero/${tableroId}`} />
            </div>
          </div>
        )}

        {/* Decoración */}
        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground/50">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider">Monopoly Digital</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>
    </section>
  )
}
