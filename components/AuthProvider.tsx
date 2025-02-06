"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/store/auth-store"


export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, isChecking } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true) 

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth()
      setIsLoading(false)
    }
    initAuth()
  }, [checkAuth])


  if (isLoading || isChecking) return (
    // <div className="flex items-center justify-center h-screen">
    //   <div className="text-2xl font-bold text-center">
    //     Loading...
    //   </div>
    // </div>
    <span className="loader"></span>
  )


  return <>{children}</>
}