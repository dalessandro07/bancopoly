'use client'

import { authClient } from "@/src/core/lib/auth/auth-client"
import { actionUpdateUserProfile } from "@/src/core/actions/user"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { UserIcon } from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

export default function AnonymousLogin ({ redirectTo = '/' }: { redirectTo?: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleOpenDialog = () => {
    setOpen(true)
  }

  const handleSignIn = async () => {
    if (!name.trim()) {
      toast.error("Por favor ingresa tu nombre")
      return
    }

    setIsLoading(true)
    try {
      // Hacer login anónimo
      await authClient.signIn.anonymous()
      
      // Actualizar el nombre del usuario después del login usando la acción del servidor
      const formData = new FormData()
      formData.append('name', name.trim())
      
      const updateResult = await actionUpdateUserProfile(null, formData)
      
      if (!updateResult.success) {
        toast.error(updateResult.error || 'Error al actualizar el nombre')
        return
      }

      setOpen(false)
      toast.success("¡Bienvenido!")
      
      // Redirigir después del login exitoso
      if (redirectTo) {
        window.location.href = redirectTo
      } else {
        window.location.reload()
      }
    } catch (error) {
      console.error(error)
      toast.error("Error al ingresar como invitado")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        size="lg"
        variant="outline"
        className="w-full group relative overflow-hidden"
      >
        <UserIcon className="size-5 mr-2" />
        <span className="font-medium">Continuar como invitado</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingresa tu nombre</DialogTitle>
            <DialogDescription>
              Para continuar como invitado, necesitamos saber cómo te llamas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tu nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Juan"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleSignIn()
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSignIn}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? 'Ingresando...' : 'Continuar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
