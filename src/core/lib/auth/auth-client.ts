import { oneTapClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  plugins: [
    oneTapClient({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
      autoSelect: false,
      cancelOnTapOutside: true,
      context: "signin",
      promptOptions: {
        baseDelay: 1500,
        maxAttempts: 5
      }
    })
  ]
})

export async function signInSocial (provider: "google", redirectTo?: string) {
  return authClient.signIn.social({
    provider,
    callbackURL: redirectTo || "/",
  })
}

export function signOut () {
  return authClient.signOut()
}
