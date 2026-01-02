import { APP_DESCRIPTION, APP_NAME } from '@/src/core/lib/constants'
import type { Metadata } from "next"
import { Luckiest_Guy } from "next/font/google"
import { Toaster } from 'sonner'
import "./globals.css"

const luckiestGuy = Luckiest_Guy({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-luckiest-guy",
  preload: true,
  style: ["normal"],
})

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
}

export default function RootLayout ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${luckiestGuy.variable} antialiased dark`}
      >
        <div className='h-dvh'>
          {children}
        </div>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
