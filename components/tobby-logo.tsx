"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

interface TobbyLogoProps {
  size?: number
  variant?: "happy" | "neutral" | "worried"
  animated?: boolean
  className?: string
  onClick?: () => void
}

export function TobbyLogo({
  size = 40,
  variant = "happy",
  animated = true,
  className = "",
  onClick,
}: TobbyLogoProps) {
  const [clickCount, setClickCount] = useState(0)
  const [showEasterEgg, setShowEasterEgg] = useState(false)

  const handleClick = () => {
    const newCount = clickCount + 1
    setClickCount(newCount)

    // Trigger easter egg on 3rd click
    if (newCount === 3) {
      setShowEasterEgg(true)

      // Hide easter egg after animation completes
      setTimeout(() => {
        setShowEasterEgg(false)
        setClickCount(0)
      }, 1000)
    }

    // Reset click count after 3 seconds if not reached 3 clicks
    setTimeout(() => {
      setClickCount((prev) => (prev < 3 ? 0 : prev))
    }, 3000)

    onClick?.()
  }

  // Easter egg: 3 clicks triggers special animation
  const isEasterEgg = showEasterEgg

  // Base animation variants
  const variants = {
    initial: animated
      ? { scale: 0, rotate: -180, opacity: 0 }
      : { scale: 1, rotate: 0, opacity: 1 },
    animate: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        duration: 0.6,
      },
    },
    hover: {
      scale: 1.15,
      rotate: [0, -10, 10, -10, 0],
      transition: {
        duration: 0.5,
        rotate: {
          repeat: 2,
          duration: 0.3,
        },
      },
    },
    tap: {
      scale: 0.95,
      rotate: [0, -15, 15, -10, 10, 0],
      transition: {
        duration: 0.4,
      },
    },
    easterEgg: {
      rotate: [0, -30, 30, -30, 30, -20, 20, -10, 10, 0],
      scale: [1, 1.2, 0.8, 1.2, 0.8, 1.1, 0.9, 1],
      transition: {
        duration: 0.8,
        ease: "easeInOut",
      },
    },
  }

  // Breathing animation for subtle life
  const breathingVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  }

  // Different filter effects based on variant
  const filterStyles = {
    happy: "brightness-110 saturate-110",
    neutral: "brightness-100 saturate-100",
    worried: "brightness-90 saturate-75 sepia-20",
  }

  return (
    <motion.div
      className={`relative inline-block cursor-pointer ${className}`}
      variants={variants}
      initial="initial"
      animate={isEasterEgg ? "easterEgg" : "animate"}
      whileHover={animated ? "hover" : undefined}
      whileTap={animated ? "tap" : undefined}
      onClick={handleClick}
      style={{ width: size, height: size }}
    >
      {/* Main logo with breathing effect */}
      <motion.div
        variants={breathingVariants}
        animate={animated && !isEasterEgg ? "animate" : undefined}
        className="relative w-full h-full"
      >
        <Image
          src="/tobby-logo.png"
          alt="Tobby"
          width={size}
          height={size}
          className={`rounded-full ${filterStyles[variant]} transition-all duration-300`}
          priority
          draggable={false}
        />
      </motion.div>

      {/* Sparkle effect on easter egg */}
      {isEasterEgg && (
        <motion.div
          className="absolute -top-1 -right-1 text-2xl"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.5, 1.5, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 1 }}
        >
          ✨
        </motion.div>
      )}

    </motion.div>
  )
}
