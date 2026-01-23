'use client'

import { actionJoinTablero } from '@/src/core/actions/tablero'
import { actionUpdateUserProfile } from '@/src/core/actions/user'
import GoogleLogin from '@/src/core/components/auth/google-login'
import { Button } from '@/src/core/components/ui/button'
import { Input } from '@/src/core/components/ui/input'
import { Label } from '@/src/core/components/ui/label'
import { authClient } from '@/src/core/lib/auth/auth-client'
import { SparklesIcon, UserPlusIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'

const LOADING_MESSAGES = [
  'Buscando sala...',
  'Preparando dinero...',
  'Configurando tablero...'
]

function useRotatingMessage (messages: string[], interval = 2000) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length)
    }, interval)

    return () => clearInterval(timer)
  }, [messages.length, interval])

  return messages[currentIndex]
}

export default function FormJoinTablero ({ tableroId }: { tableroId: string }) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [, formAction, isPendingForm] = useActionState(actionJoinTablero, null)
  const loadingMessage = useRotatingMessage(LOADING_MESSAGES)
  const [isJoiningAsAnonymous, setIsJoiningAsAnonymous] = useState(false)
  const [isWaitingForSession, setIsWaitingForSession] = useState(false)

  // Handler para unirse como invitado (sin sesión)
  const handleJoinAsAnonymous = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string

    if (!name || !name.trim()) {
      toast.error('Por favor ingresa tu nombre')
      return
    }

    setIsJoiningAsAnonymous(true)
    try {
      // 1. Hacer login invitado
      await authClient.signIn.anonymous()

      // 2. Actualizar el nombre del usuario
      const updateFormData = new FormData()
      updateFormData.append('name', name.trim())
      const updateResult = await actionUpdateUserProfile(null, updateFormData)

      if (!updateResult.success) {
        toast.error(updateResult.error || 'Error al actualizar el nombre')
        setIsJoiningAsAnonymous(false)
        return
      }

      // 3. Unirse al tablero
      const joinFormData = new FormData()
      joinFormData.append('tableroId', tableroId)
      joinFormData.append('name', name.trim())
      const joinResult = await actionJoinTablero(null, joinFormData)

      if (!joinResult.success) {
        toast.error(joinResult.error || 'Error al unirse al tablero')
        setIsJoiningAsAnonymous(false)
        return
      }

      // 4. Activar estado de espera y redirigir al tablero
      setIsJoiningAsAnonymous(false)
      setIsWaitingForSession(true)

      router.push(`/tablero/${tableroId}`)
    } catch (error) {
      console.error(error)
      toast.error('Error al unirse como invitado')
      setIsJoiningAsAnonymous(false)
    }
  }

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

        {isPending || isWaitingForSession || isJoiningAsAnonymous || isPendingForm ? (
          <div className="space-y-6">
            <div className="bg-card border rounded-xl p-6 text-center">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  {loadingMessage}
                </p>
              </div>
            </div>
          </div>
        ) : session?.user && !isWaitingForSession && !isJoiningAsAnonymous && !isPending ? (
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
            <form
              onSubmit={handleJoinAsAnonymous}
              className="space-y-6"
            >
              <input type="hidden" name="tableroId" value={tableroId} />

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Tu nombre en el juego
                </Label>
                <Input
                  id="name"
                  disabled={isJoiningAsAnonymous}
                  name="name"
                  type="text"
                  placeholder="¿Cómo te llamarás?"
                  className="h-12 text-center text-lg font-medium"
                  required
                />
              </div>

              <Button
                disabled={isJoiningAsAnonymous}
                type="submit"
                size="lg"
                className="w-full h-12 text-base font-semibold gap-2"
              >
                {isJoiningAsAnonymous ? (
                  <>
                    <span className="animate-pulse">Uniéndote...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="size-5" />
                    Unirse como invitado
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O continúa con
                </span>
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6 text-center">
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
