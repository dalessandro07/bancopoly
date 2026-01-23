'use client'

import { signOut } from "@/src/core/lib/auth/auth-client"
import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { ProfileDialog } from "./profile-dialog"

interface UserMenuProps {
  name: string | null | undefined
  image: string | null | undefined
  email: string | null | undefined
}

export default function UserMenu ({ name, image, email }: UserMenuProps) {
  const [isPending, startTransition] = useTransition()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    startTransition(async () => {
      await signOut()
      router.refresh()
    })
  }

  const initials = name
    ? name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : email?.[0].toUpperCase() || 'U'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <Avatar className="size-10 cursor-pointer border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <AvatarImage src={image || undefined} alt={name || 'Usuario'} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col space-y-1">
            <span className="font-semibold">{name || 'Usuario'}</span>
            {email && (
              <span className="text-xs font-normal text-muted-foreground break-all">
                {email}
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
            <User className="mr-2 size-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isPending}
            variant="destructive"
          >
            <LogOut className="mr-2 size-4" />
            <span>{isPending ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        currentName={name}
        currentImage={image}
      />
    </>
  )
}
