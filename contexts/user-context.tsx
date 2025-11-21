"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from "react"
import { useAuth } from "./auth-context"

interface UserContextType {
  userEmail: string
  memberSince: string
  loading: boolean
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [userEmail, setUserEmail] = useState("")
  const [memberSince, setMemberSince] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      setUserEmail(user.email || "")
      setMemberSince(
        new Date(user.created_at).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      )
      setLoading(false)
    } else {
      // Reset when user logs out
      setUserEmail("")
      setMemberSince("")
      setLoading(false)
    }
  }, [user])

  return (
    <UserContext.Provider value={{ userEmail, memberSince, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)

  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }

  return context
}
