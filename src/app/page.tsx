import GoogleLogin from '@/src/core/components/auth/google-login'
import LogoutBtn from '@/src/core/components/auth/logout-btn'
import FormNewTablero from '@/src/core/components/tablero/form-new-tablero'
import ListTablero from '@/src/core/components/tablero/list-tablero'
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
      <main className='flex items-center justify-center min-h-screen p-5 bg-gradient-to-br from-background via-background to-muted/20'>
        <div className='w-full max-w-md space-y-6'>
          <div className='text-center space-y-2'>
            <h1 className="text-5xl font-luckiest-guy bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {APP_NAME}
            </h1>
            <p className="text-muted-foreground text-sm">
              {APP_DESCRIPTION}
            </p>
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
              <p className="text-xs text-center text-muted-foreground px-4">
                Al continuar, aceptas nuestros términos de servicio y política de privacidad
              </p>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Plataforma segura y confiable para gestionar tus juegos
            </p>
          </div>
        </div>
      </main>
    )
  }

  // Si hay sesión, mostrar el dashboard normal
  return (
    <main className='p-5 flex flex-col md:flex-row gap-5 w-full h-full'>
      <aside className='flex flex-col gap-5 justify-between md:w-1/4'>
        <h1 className="text-4xl font-luckiest-guy">{APP_NAME}</h1>
        {error && <p className='text-destructive'>{error}</p>}
        <div>
          <p className="text-muted-foreground mb-2">Bienvenido, <span className="font-semibold text-foreground">{session.user.name}</span></p>
          <LogoutBtn />
        </div>
      </aside>

      <section className='flex flex-col grow'>
        <div className='flex flex-col gap-5'>
          <FormNewTablero />
          <Suspense fallback={<div>Cargando tableros...</div>}>
            <ListTablero />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
