import { anonymousClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  plugins: [
    anonymousClient()
  ]
})

export async function signInSocial (provider: "google", redirectTo?: string) {
  return authClient.signIn.social({
    provider,
    callbackURL: redirectTo || window.location.href,
  })
}

export function signOut () {
  return authClient.signOut()
}
