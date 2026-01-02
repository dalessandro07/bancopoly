'use client'

import { authClient, signInSocial } from "@/src/core/lib/auth/auth-client"
import { useEffect } from 'react'
import { toast } from "sonner"
import { Button } from "../ui/button"

export default function GoogleLogin ({ redirectTo = '/' }: { redirectTo?: string }) {
  const handleSignIn = async () => {
    try {
      await signInSocial("google", redirectTo)
    } catch (error) {
      console.error(error)
      toast.error("Error al ingresar con Google")
    }
  }

  useEffect(() => {
    async function initOneTap () {
      await authClient.oneTap()
    }
    initOneTap()
  }, [])

  return (
    <Button onClick={handleSignIn}>
      Ingresar con Google
    </Button>
  )
}
