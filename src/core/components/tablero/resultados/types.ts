export interface PlayerStats {
  player: {
    id: string
    name: string
    balance: number
    user?: {
      id: string
      name: string
      email: string
      image: string | null
    } | null
  }
  initialBalance: number
  finalBalance: number
  netChange: number
  totalSent: number
  totalReceived: number
  transactionCount: number
}

export interface TableroStats {
  ranking: PlayerStats[]
  winner: PlayerStats
  loser: PlayerStats
  totalTransactions: number
  totalMoneyInCirculation: number
  playersCount: number
}
