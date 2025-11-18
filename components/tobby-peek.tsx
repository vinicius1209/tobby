"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TobbyLogo } from "@/components/tobby-logo"
import { useTranslations } from "next-intl"
import type { TobbyVariant } from "@/lib/budget-utils"

interface TobbyPeekProps {
  variant?: TobbyVariant
  budgetPercentage?: number
  spent?: number
  budget?: number
}

export function TobbyPeek({
  variant = "happy",
  budgetPercentage = 0,
  spent = 0,
  budget = 0,
}: TobbyPeekProps) {
  const t = useTranslations("tobby.states")
  const [isVisible, setIsVisible] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY

          // Show Tobby when scrolled down more than 200px
          setIsVisible(scrollY > 200)

          lastScrollY = scrollY
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const stateMessages = {
    happy: t("happy"),
    neutral: t("neutral"),
    worried: t("worried"),
  }

  const message = stateMessages[variant]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-20 right-8 z-40"
          initial={{ x: 100, y: -50, opacity: 0 }}
          animate={{
            x: isHovering ? 0 : 20,
            y: 0,
            opacity: 1,
            rotate: isHovering ? 0 : -15,
          }}
          exit={{ x: 100, y: -50, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Tooltip/Message */}
          <AnimatePresence>
            {isHovering && budget > 0 && (
              <motion.div
                className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-background border rounded-lg shadow-lg p-4 min-w-[200px]"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{message}</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Gasto:</span>
                      <span className="font-mono">
                        R$ {spent.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Meta:</span>
                      <span className="font-mono">
                        R$ {budget.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Usado:</span>
                      <span
                        className={`font-mono ${
                          budgetPercentage > 100
                            ? "text-red-600"
                            : budgetPercentage > 80
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {budgetPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <motion.div
                      className={`h-full ${
                        budgetPercentage > 100
                          ? "bg-red-500"
                          : budgetPercentage > 80
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Arrow pointing to Tobby */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-border" />
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-background absolute top-0 -left-[7px]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tobby Peeking */}
          <motion.div
            animate={
              isHovering
                ? {
                    rotate: [0, -5, 5, -5, 0],
                    transition: {
                      duration: 0.5,
                      repeat: Infinity,
                      repeatDelay: 1,
                    },
                  }
                : {
                    y: [0, -5, 0],
                    transition: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }
            }
          >
            <TobbyLogo
              size={isHovering ? 80 : 60}
              variant={variant}
              animated={true}
            />
          </motion.div>

          {/* Pulsing Ring */}
          {!isHovering && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
