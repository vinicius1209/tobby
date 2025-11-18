"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Confetti from "react-confetti"
import { TobbyLogo } from "@/components/tobby-logo"
import { useTranslations } from "next-intl"

interface CelebrationModalProps {
  isOpen: boolean
  onClose: () => void
  message?: string
  variant?: "success" | "milestone" | "achievement"
  duration?: number
}

export function CelebrationModal({
  isOpen,
  onClose,
  message,
  variant = "success",
  duration = 3000,
}: CelebrationModalProps) {
  const t = useTranslations("tobby.celebration")
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    // Get window dimensions for confetti
    const updateDimensions = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Auto-close after duration
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  const celebrationMessages = {
    success: t("transactionSaved"),
    milestone: t("firstTransaction"),
    achievement: t("budgetOnTrack"),
  }

  const displayMessage = message || celebrationMessages[variant]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Confetti Effect */}
          <Confetti
            width={windowDimensions.width}
            height={windowDimensions.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.3}
            colors={["#FFD700", "#FFA500", "#FF6347", "#4169E1", "#32CD32"]}
          />

          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            {/* Modal Content */}
            <motion.div
              className="relative bg-background rounded-3xl p-12 shadow-2xl max-w-md mx-4"
              initial={{ scale: 0, rotate: -180, y: -100 }}
              animate={{
                scale: 1,
                rotate: 0,
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                },
              }}
              exit={{
                scale: 0,
                rotate: 180,
                y: 100,
                transition: { duration: 0.3 },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Tobby with Special Celebration Animation */}
              <div className="flex justify-center mb-6">
                <motion.div
                  animate={{
                    y: [0, -20, 0, -15, 0, -10, 0],
                    rotate: [0, -10, 10, -10, 10, -5, 0],
                    scale: [1, 1.1, 1, 1.1, 1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                >
                  <TobbyLogo size={200} variant="happy" animated={false} />
                </motion.div>
              </div>

              {/* Message */}
              <motion.div
                className="text-center space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  {displayMessage}
                </h2>

                {/* Sparkle Effects */}
                <div className="flex justify-center gap-4 text-4xl">
                  <motion.span
                    animate={{
                      scale: [1, 1.5, 1],
                      rotate: [0, 180, 360],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    ✨
                  </motion.span>
                  <motion.span
                    animate={{
                      scale: [1, 1.5, 1],
                      rotate: [0, -180, -360],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.3,
                    }}
                  >
                    🎉
                  </motion.span>
                  <motion.span
                    animate={{
                      scale: [1, 1.5, 1],
                      rotate: [0, 180, 360],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.6,
                    }}
                  >
                    ✨
                  </motion.span>
                </div>
              </motion.div>

              {/* Progress Bar (auto-dismiss indicator) */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-b-3xl"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: duration / 1000, ease: "linear" }}
                style={{ transformOrigin: "left" }}
              />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
