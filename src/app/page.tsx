import GoogleLogin from '@/src/core/components/auth/google-login'
import LogoutBtn from '@/src/core/components/auth/logout-btn'
import FormNewTablero from '@/src/core/components/tablero/form-new-tablero'
import ListTablero from '@/src/core/components/tablero/list-tablero'
import { auth } from '@/src/core/lib/auth'
import { APP_NAME } from '@/src/core/lib/constants'
import { headers } from 'next/headers'
import { Suspense } from 'react'

export default async function Home ({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams

  const session = await auth.api.getSession({
    headers: await headers()
  })

  return (
    <main className='p-5 flex flex-col md:flex-row gap-5 w-full h-full'>
      <aside className='flex flex-col gap-5 justify-between md:w-1/4'>
        <h1 className="text-4xl font-luckiest-guy">{APP_NAME}</h1>
        {error && <p className='text-destructive'>{error}</p>}
        {session && session.user ? (
          <div>
            <p>Bienvenido {session.user.name}</p>
            <LogoutBtn />
          </div>
        ) : (
          <GoogleLogin />
        )}
      </aside>

      <section className='flex flex-col grow'>
        {
          session && session.user && (
            <div className='flex flex-col gap-5'>
              <FormNewTablero />
              <Suspense fallback={<div>Cargando tableros...</div>}>
                <ListTablero />
              </Suspense>
            </div>
          )
        }
      </section>
    </main>
  )
}
