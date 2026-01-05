import { Realtime, InferRealtimeEvents } from "@upstash/realtime"
import { redis } from "./redis"
import z from "zod/v4"

const schema = {
  tablero: {
    player: {
      inserted: z.object({
        id: z.string(),
        tableroId: z.string(),
        userId: z.string().nullable(),
        name: z.string(),
        balance: z.number(),
        isSystemPlayer: z.boolean(),
        systemPlayerType: z.string().nullable(),
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
      updated: z.object({
        id: z.string(),
        tableroId: z.string(),
        userId: z.string().nullable(),
        name: z.string(),
        balance: z.number(),
        isSystemPlayer: z.boolean(),
        systemPlayerType: z.string().nullable(),
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
      deleted: z.object({
        id: z.string(),
      }),
    },
    transaction: {
      inserted: z.object({
        id: z.string(),
        tableroId: z.string(),
        fromPlayerId: z.string().nullable(),
        toPlayerId: z.string().nullable(),
        amount: z.number(),
        type: z.string(),
        description: z.string().nullable(),
        createdAt: z.string(),
      }),
    },
    tablero: {
      updated: z.object({
        id: z.string(),
        isEnded: z.boolean(),
      }),
      deleted: z.object({
        id: z.string(),
      }),
    },
  },
}

export const realtime = new Realtime({ schema, redis })
export type RealtimeEvents = InferRealtimeEvents<typeof realtime>
