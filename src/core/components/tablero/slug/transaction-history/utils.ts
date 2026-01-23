/**
 * Utilidades para el historial de transacciones
 */

/**
 * Formatea una fecha a formato legible en español
 */
export function formatDate (date: Date | string | number): string {
  // Si es un número, asumimos que es un timestamp Unix en milisegundos
  const timestamp = typeof date === 'number' 
    ? date 
    : typeof date === 'string' 
      ? Date.parse(date) || parseInt(date) 
      : date.getTime()
  
  const d = new Date(timestamp)
  
  // Validar que la fecha sea válida
  if (isNaN(d.getTime())) {
    return 'Fecha inválida'
  }
  
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Obtiene el nombre completo de un jugador, manejando jugadores del sistema
 */
export function getPlayerFullName (
  player: { name: string; isSystemPlayer?: number; systemPlayerType?: string | null } | null | undefined
): string {
  if (!player) return 'Desconocido'
  
  if (player.isSystemPlayer) {
    if (player.systemPlayerType === 'bank') return 'Banco'
    if (player.systemPlayerType === 'free_parking') return 'Parada Libre'
    return player.name
  }
  
  return player.name
}

/**
 * Obtiene solo el primer nombre (útil para mobile)
 */
export function getFirstName (name: string): string {
  return name.split(' ')[0]
}
