import AnonymousLogin from '@/src/core/components/auth/anonymous-login'
import GoogleLogin from '@/src/core/components/auth/google-login'
import YapeLogin from '@/src/core/components/auth/yape-login'
import UserMenu from '@/src/core/components/auth/user-menu'
import FormNewTablero from '@/src/core/components/tablero/form-new-tablero'
import ListTablero from '@/src/core/components/tablero/list-tablero'
import QRReader from '@/src/core/components/tablero/qr-reader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/core/components/ui/card'
import { auth } from '@/src/core/lib/auth'
import { APP_DESCRIPTION, APP_NAME } from '@/src/core/lib/constants'
import { headers } from 'next/headers'
import { Suspense } from 'react'

export default async function Home ({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams

  const session = await auth.api.getSession({
    headers: await headers()
  })

  // Si no hay sesión, mostrar página de login centrada
  if (!session || !session.user) {
    return (
      <main className='flex items-center justify-center min-h-screen p-5 bg-linear-to-br from-background via-background to-muted/20'>
        <div className='w-full max-w-md space-y-6'>
          <div className='text-center space-y-2'>
            <h1 className="text-5xl font-luckiest-guy bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {APP_NAME}
            </h1>
          </div>

          <Card className="border-2 shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-semibold">Bienvenido</CardTitle>
              <CardDescription>
                Inicia sesión para comenzar a gestionar tus tableros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                  {error}
                </div>
              )}
              <GoogleLogin />
              <YapeLogin />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">O</span>
                </div>
              </div>
              <AnonymousLogin />
            </CardContent>
          </Card>

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              {APP_DESCRIPTION}
            </p>
            <p className="text-xs text-muted-foreground/60">
              Desarrollado por{' '}
              <a
                href="https://alessandrorios.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground transition-colors underline underline-offset-2"
              >
                AR
              </a>
            </p>
          </div>
        </div>
      </main>
    )
  }

  // Si hay sesión, mostrar el dashboard normal
  return (
    <main className='p-5 flex flex-col md:flex-row gap-5 w-full h-full'>
      <aside className='flex flex-col gap-5 md:w-1/4'>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-4xl font-luckiest-guy">{APP_NAME}</h1>
          <div className="shrink-0">
            <UserMenu
              name={session.user.name}
              image={session.user.image}
              email={session.user.email}
            />
          </div>
        </div>
        {error && <p className='text-destructive'>{error}</p>}
      </aside>

      <section className='flex flex-col grow'>
        <div className='flex flex-col gap-5'>
          <div className='flex flex-col gap-3'>
            {session.user.isAnonymous ? (
              <div className="bg-muted/50 rounded-2xl p-6 border-2 border-muted text-center">
                <p className="text-muted-foreground">
                  Como invitado, puedes unirte a tableros existentes usando el código QR o el enlace del tablero.
                </p>
              </div>
            ) : (
              <div className='flex-1'>
                <FormNewTablero />
              </div>
            )}
            <QRReader />
          </div>
          <Suspense fallback={<div>Cargando tableros...</div>}>
            <ListTablero />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
