'use client'

import { signOut } from "@/src/core/lib/auth/auth-client"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Button } from "../ui/button"

export default function LogoutBtn () {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleLogout = async () => {
    startTransition(async () => {
      await signOut()
      router.refresh()
    })
  }

  return (
    <Button onClick={handleLogout} disabled={isPending}>
      {isPending ? 'Cerrando sesión...' : 'Cerrar sesión'}
    </Button>
  )
}
