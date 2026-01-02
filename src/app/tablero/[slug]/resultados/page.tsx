import { actionGetTableroById, actionGetTableroStats } from '@/src/core/actions/tablero'
import { auth } from '@/src/core/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import ResultadosClient from './resultados-client'

export default async function ResultadosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const session = await auth.api.getSession({
    headers: await headers()
  })

  const tablero = await actionGetTableroById(slug)

  if (!tablero.tablero) {
    redirect('/')
  }

  // Verificar que el tablero esté cerrado
  if (!tablero.tablero.isEnded) {
    redirect(`/tablero/${slug}`)
  }

  // Obtener estadísticas
  const statsResult = await actionGetTableroStats(slug)
  if (!statsResult.success || !statsResult.data) {
    redirect(`/tablero/${slug}`)
  }

  const isCreator = tablero.tablero.userId === session?.user?.id

  return (
    <ResultadosClient
      tableroName={tablero.tablero.name}
      stats={statsResult.data}
      currentUserId={session?.user?.id || null}
      tableroSlug={slug}
      isCreator={isCreator}
    />
  )
}
