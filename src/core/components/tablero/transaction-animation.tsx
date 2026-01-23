'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { startTransition, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface TransactionAnimationProps {
  trigger: boolean
}

export function TransactionAnimation ({ trigger }: TransactionAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    startTransition(() => {
      setMounted(true)
    })
  }, [])

  useEffect(() => {
    if (trigger) {
      startTransition(() => {
        setIsVisible(true)
      })
      // Ocultar después de la animación (2.5 segundos)
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 2500)

      return () => clearTimeout(timer)
    }
  }, [trigger])

  if (!mounted) return null

  const animationContent = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: '100vw', y: '-50%', opacity: 0 }}
          animate={{
            x: '-100vw',
            y: '-50%',
            opacity: [0, 1, 1, 0]
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 2.5,
            ease: 'easeInOut',
            opacity: {
              times: [0, 0.15, 0.85, 1],
              duration: 2.5
            },
          }}
          className="fixed top-1/2 right-0 z-9999 pointer-events-none"
          style={{
            willChange: 'transform, opacity'
          }}
        >
          <Image
            src="/monopoly-logo.png"
            alt="Monopoly Logo"
            width={120}
            height={120}
            className="object-contain drop-shadow-2xl"
            priority
            unoptimized
          />
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(animationContent, document.body)
}
