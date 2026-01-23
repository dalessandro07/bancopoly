'use client'

import { useState, useRef } from 'react'
import { Button } from './button'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Upload, X } from 'lucide-react'
import { cn } from '@/src/core/lib/utils'

interface ImageUploaderProps {
  currentImage?: string | null
  onImageSelect?: (file: File | null) => void
  className?: string
}

export function ImageUploader({
  currentImage,
  onImageSelect,
  className,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(
    currentImage || null
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen')
      return
    }

    // Validar tamaño (max 32MB para imgbb)
    if (file.size > 32 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 32MB')
      return
    }

    setSelectedFile(file)

    // Crear preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Notificar al componente padre
    onImageSelect?.(file)
  }

  const handleRemove = () => {
    setPreview(currentImage || null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onImageSelect?.(null)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative">
        <Avatar className="size-24 border-4 border-primary/20">
          <AvatarImage src={preview || undefined} alt="Preview" />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl">
            {preview ? '' : 'IMG'}
          </AvatarFallback>
        </Avatar>
        {preview && preview !== currentImage && (
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1 shadow-lg hover:bg-destructive/90 transition-colors"
            type="button"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          className="w-full"
        >
          <Upload className="size-4 mr-2" />
          {preview && preview !== currentImage
            ? 'Cambiar imagen'
            : 'Seleccionar imagen'}
        </Button>
        {selectedFile && (
          <p className="text-xs text-muted-foreground text-center">
            {selectedFile.name}
          </p>
        )}
      </div>
    </div>
  )
}
