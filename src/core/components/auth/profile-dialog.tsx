'use client'

import { useState, useTransition } from 'react'
import { actionUpdateUserProfile } from '@/src/core/actions/user'
import { ImageUploader } from '../ui/image-uploader'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { uploadImageToImgbb } from '@/src/core/lib/imgbb'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string | null | undefined
  currentImage: string | null | undefined
}

export function ProfileDialog({
  open,
  onOpenChange,
  currentName,
  currentImage,
}: ProfileDialogProps) {
  const [name, setName] = useState(currentName || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  // Resetear el estado cuando se abre el dialog
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Resetear al cerrar
      setName(currentName || '')
      setSelectedFile(null)
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    startTransition(async () => {
      try {
        setIsUploading(true)
        let imageUrl = currentImage || null

        // Si hay una nueva imagen seleccionada, subirla a imgbb
        if (selectedFile) {
          try {
            imageUrl = await uploadImageToImgbb(selectedFile)
            toast.success('Imagen subida correctamente')
          } catch (error) {
            console.error('Error al subir imagen:', error)
            toast.error('Error al subir la imagen. Intenta de nuevo.')
            setIsUploading(false)
            return
          }
        }

        // Actualizar el perfil
        const formData = new FormData()
        formData.append('name', name.trim())
        if (imageUrl) {
          formData.append('image', imageUrl)
        }

        const result = await actionUpdateUserProfile(null, formData)

        if (result.success) {
          toast.success('Perfil actualizado correctamente')
          handleOpenChange(false)
          router.refresh()
        } else {
          toast.error(result.error || 'Error al actualizar el perfil')
        }
      } catch (error) {
        console.error('Error al actualizar perfil:', error)
        toast.error('Error al actualizar el perfil')
      } finally {
        setIsUploading(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>
            Actualiza tu nombre e imagen de perfil
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <ImageUploader
              currentImage={currentImage || undefined}
              onImageSelect={setSelectedFile}
            />
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                disabled={isPending || isUploading}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending || isUploading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || isUploading}>
              {isPending || isUploading
                ? 'Guardando...'
                : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
