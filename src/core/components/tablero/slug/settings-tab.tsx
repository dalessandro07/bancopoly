'use client'

import CloseBtnTablero from '@/src/core/components/tablero/close-btn-tablero'
import DeleteBtnTablero from '@/src/core/components/tablero/delete-btn-tablero'
import LeaveBtnTablero from '@/src/core/components/tablero/leave-btn-tablero'
import type { TPlayer, User } from '@/src/core/lib/db/schema'
import { CrownIcon, QrCodeIcon, UsersIcon } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useRef } from 'react'

interface SettingsTabProps {
  tableroId: string
  tableroName: string
  creator: User
  players: TPlayer[]
  isCreator: boolean
  isPlayer: boolean
}

export default function SettingsTab ({
  tableroId,
  tableroName,
  creator,
  players,
  isCreator,
  isPlayer,
}: SettingsTabProps) {
  const humanPlayers = players.filter(p => !p.isSystemPlayer)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generar la URL del tablero de forma síncrona (no necesita useEffect)
  const tableroUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/tablero/${tableroId}`
    : ''

  useEffect(() => {
    // Generar el código QR solo cuando el canvas esté disponible
    if (canvasRef.current && tableroUrl) {
      QRCode.toCanvas(canvasRef.current, tableroUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
    }
  }, [tableroUrl])

  return (
    <div className="space-y-6 pb-24">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Información del tablero</h2>
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Nombre</p>
            <p className="font-medium">{tableroName}</p>
          </div>
          <div className="flex items-center gap-2">
            <CrownIcon className="size-4 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Creador</p>
              <p className="font-medium">{creator.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UsersIcon className="size-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Jugadores</p>
              <p className="font-medium">{humanPlayers.length} jugadores</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <QrCodeIcon className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Invitar jugadores</h2>
        </div>
        <div className="bg-linear-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-xl p-6 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Escanea este código QR para unirte al tablero
          </p>
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <canvas ref={canvasRef} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">O comparte este enlace:</p>
            <div className="bg-background/50 rounded-lg p-3 border">
              <p className="text-xs font-mono break-all text-center">{tableroUrl}</p>
            </div>
          </div>
        </div>
      </section>

      {isCreator && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Cerrar Sala</h2>
          <div className="bg-card border rounded-lg p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Al cerrar la sala, el juego terminará y todos los jugadores podrán ver el ranking final y las estadísticas del juego.
              </p>
              <CloseBtnTablero tableroId={tableroId} />
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-destructive">Zona de peligro</h2>
        <div className="bg-card border border-destructive/20 rounded-lg p-4 space-y-4">
          {isCreator ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Al eliminar el tablero, todos los jugadores perderán acceso y se eliminarán todas las transacciones.
              </p>
              <DeleteBtnTablero tableroId={tableroId} />
            </div>
          ) : isPlayer ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Al salir del tablero, ya no podrás ver ni participar en el juego.
              </p>
              <LeaveBtnTablero tableroId={tableroId} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No tienes acciones disponibles en este tablero.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
