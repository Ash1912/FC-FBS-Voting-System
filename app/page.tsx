"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user?.role === "ADMIN") {
        router.push("/admin")
      } else {
        router.push("/vote")
      }
    } else if (status === "unauthenticated") {
      // Redirect to signup page if not authenticated
      router.push("/auth/signup")
    }
  }, [session, status, router])

  // Show loading spinner while checking authentication
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-full blur-2xl animate-pulse"></div>
        </div>
        <p className="mt-6 text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Redirecting...
        </p>
        <p className="text-gray-500 mt-2">Please wait while we set up your experience</p>
      </div>
    </div>
  )
}