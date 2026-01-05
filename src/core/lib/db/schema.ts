// AUTH

import { relations } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified").default(0).notNull(),
  image: text("image"),
  createdAt: integer("created_at").default(0).notNull(),
  updatedAt: integer("updated_at")
    .default(0)
    .notNull(),
})

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at").default(0).notNull(),
    updatedAt: integer("updated_at")
      .default(0)
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
)

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at"),
    refreshTokenExpiresAt: integer("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at").default(0).notNull(),
    updatedAt: integer("updated_at")
      .default(0)
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
)

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").default(0).notNull(),
    updatedAt: integer("updated_at")
      .default(0)
      .notNull()
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
)

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  tableros: many(tablero),
  players: many(player),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export type User = typeof user.$inferSelect
export type Session = typeof session.$inferSelect
export type Account = typeof account.$inferSelect
export type Verification = typeof verification.$inferSelect

// GAME

export const tablero = sqliteTable("tablero", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // Configuración del juego
  freeParkingEnabled: integer("free_parking_enabled").default(1).notNull(),
  isClosed: integer("is_closed").default(0).notNull(),
  isEnded: integer("is_ended").default(0).notNull(),
  createdAt: integer("created_at").default(0).notNull(),
  updatedAt: integer("updated_at")
    .default(0)
    .notNull(),
},
  (table) => [index("tablero_userId_idx").on(table.userId)]
)

// Jugadores en un tablero
export const player = sqliteTable("player", {
  id: text("id").primaryKey(),
  tableroId: text("tablero_id")
    .notNull()
    .references(() => tablero.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  balance: integer("balance").default(1500).notNull(), // Dinero inicial en Monopoly
  isSystemPlayer: integer("is_system_player").default(0).notNull(), // Jugadores del sistema (Banco, Parada Libre)
  systemPlayerType: text("system_player_type"), // 'bank', 'free_parking'
  createdAt: integer("created_at").default(0).notNull(),
  updatedAt: integer("updated_at")
    .default(0)
    .notNull(),
},
  (table) => [
    index("player_tableroId_idx").on(table.tableroId),
    index("player_userId_idx").on(table.userId),
  ]
)

// Transacciones de dinero
export const transaction = sqliteTable("transaction", {
  id: text("id").primaryKey(),
  tableroId: text("tablero_id")
    .notNull()
    .references(() => tablero.id, { onDelete: "cascade" }),
  fromPlayerId: text("from_player_id").references(() => player.id, { onDelete: "set null" }),
  toPlayerId: text("to_player_id").references(() => player.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // 'transfer', 'bank_give', 'bank_take', 'free_parking', 'initial'
  description: text("description"),
  createdAt: integer("created_at").default(0).notNull(),
},
  (table) => [
    index("transaction_tableroId_idx").on(table.tableroId),
    index("transaction_fromPlayerId_idx").on(table.fromPlayerId),
    index("transaction_toPlayerId_idx").on(table.toPlayerId),
    index("transaction_createdAt_idx").on(table.createdAt),
  ]
)

// Relaciones
export const tableroRelations = relations(tablero, ({ one, many }) => ({
  creator: one(user, {
    fields: [tablero.userId],
    references: [user.id],
  }),
  players: many(player),
  transactions: many(transaction),
}))

export const playerRelations = relations(player, ({ one, many }) => ({
  tablero: one(tablero, {
    fields: [player.tableroId],
    references: [tablero.id],
  }),
  user: one(user, {
    fields: [player.userId],
    references: [user.id],
  }),
  transactionsFrom: many(transaction, {
    relationName: "fromPlayer",
  }),
  transactionsTo: many(transaction, {
    relationName: "toPlayer",
  }),
}))

export const transactionRelations = relations(transaction, ({ one }) => ({
  tablero: one(tablero, {
    fields: [transaction.tableroId],
    references: [tablero.id],
  }),
  fromPlayer: one(player, {
    fields: [transaction.fromPlayerId],
    references: [player.id],
    relationName: "fromPlayer",
  }),
  toPlayer: one(player, {
    fields: [transaction.toPlayerId],
    references: [player.id],
    relationName: "toPlayer",
  }),
}))

export type TTablero = typeof tablero.$inferSelect
export type TPlayer = typeof player.$inferSelect
export type TTransaction = typeof transaction.$inferSelect
