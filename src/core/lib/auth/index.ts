import { db } from '@/src/core/lib/db'
import * as schema from '@/src/core/lib/db/schema'
import { betterAuth } from "better-auth"
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { anonymous } from "better-auth/plugins"

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: { ...schema }
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [anonymous()],
})
