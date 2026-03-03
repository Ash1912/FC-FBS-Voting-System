"use client"

import { useState, useRef, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import toast, { Toaster } from "react-hot-toast"

export default function SignIn() {
  const router = useRouter()
  const pathname = usePathname()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [animatePanel, setAnimatePanel] = useState(false)
  
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatePanel(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const togglePassword = () => setShowPassword(!showPassword)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = {
      email: emailRef.current?.value?.trim() || "",
      password: passwordRef.current?.value || "",
    }

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (result?.error) {
        setError("Invalid email or password")
        toast.error("Invalid email or password")
      } else {
        toast.success("Signed in successfully!")
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      setError("Something went wrong")
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-[#F1ECFF]">
      <Toaster position="top-center" />

      {/* Mobile Header */}
      <div
        className="md:hidden absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-[#313053] to-[#261753] z-[1000] flex justify-center items-center shadow-lg"
        style={{
          borderBottomLeftRadius: "40% 30%",
          borderBottomRightRadius: "40% 30%",
        }}
      >
        <div className="flex bg-[#313053]/80 backdrop-blur-sm rounded-full p-1 shadow-inner">
          <button
            onClick={() => router.push("/auth/signin")}
            className={`px-5 py-1.5 rounded-full transition-all duration-300 text-sm ${
              pathname === "/auth/signin"
                ? "bg-gradient-to-r from-[#615fa1] to-[#313053] text-white shadow-md"
                : "text-gray-300 hover:bg-[#615fa1] hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => router.push("/auth/signup")}
            className={`px-5 py-1.5 rounded-full transition-all duration-300 text-sm ${
              pathname === "/auth/signup"
                ? "bg-gradient-to-r from-[#615fa1] to-[#313053] text-white shadow-md"
                : "text-gray-300 hover:bg-[#615fa1] hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Left Panel - Form (Now on left side for sign in) */}
      <div
        className={`w-full md:w-1/2 flex justify-center items-center px-4 sm:px-6 lg:px-8 transition-all duration-700 ease-out order-2 md:order-1 ${
          animatePanel
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-10"
        } h-full overflow-hidden`}
      >
        <div className="w-full max-w-md">
          <form
            onSubmit={handleSubmit}
            className="space-y-3 sm:space-y-4"
            autoComplete="on"
          >
            {/* Header - Condensed */}
            <div className="text-center md:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-black">
                Sign In to your Account
              </h1>
              <p className="text-xs text-gray-600">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/auth/signup")}
                  className="text-[#6356D7] hover:underline font-semibold"
                >
                  Sign Up here.
                </button>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-2 rounded-lg flex items-center gap-2 text-xs">
                <span>❌</span>
                <span className="flex-1">{error}</span>
                <button onClick={() => setError("")} className="text-red-500">
                  ✕
                </button>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-2">
              {/* Email Input */}
              <div>
                <input
                  type="email"
                  placeholder="Your Email"
                  ref={emailRef}
                  name="email"
                  autoComplete="username"
                  required
                  className="w-full p-2.5 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6A4EFF] focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:border-[#B8AAFF]"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Password"
                  ref={passwordRef}
                  name="password"
                  autoComplete="current-password"
                  required
                  className="w-full p-2.5 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6A4EFF] focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:border-[#B8AAFF] pr-10"
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#6356D7] transition-colors duration-200"
                >
                  <span className="text-base">{showPassword ? "🙈" : "👁️"}</span>
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex flex-row justify-between items-center text-xs">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-3.5 h-3.5 accent-[#6356D7] rounded border-gray-300 focus:ring-[#6356D7] transition-all duration-200 group-hover:scale-110" 
                />
                <span className="font-medium text-gray-700 group-hover:text-[#6356D7] transition-colors duration-200">
                  Remember Me
                </span>
              </label>
              
              {/* Forgot password link - commented out as in original */}
              {/* <button
                type="button"
                onClick={() => router.push("/auth/forgot-password")}
                className="text-[#6356D7] hover:underline font-bold"
              >
                Forgot password?
              </button> */}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative group w-full overflow-hidden rounded-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#6356D7] to-[#7E5FFF] rounded-lg blur-md group-hover:blur-lg opacity-50"></div>
              <div className="relative w-full py-2.5 bg-gradient-to-r from-[#6356D7] to-[#7E5FFF] text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all duration-200 disabled:opacity-50">
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </div>
            </button>

            {/* Mobile Sign Up Link - Only visible on mobile */}
            <div className="md:hidden text-center text-xs text-gray-600">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/auth/signup")}
                className="text-[#6356D7] font-semibold hover:underline"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Panel - Illustration (Now on right side for sign in) */}
      <div className="hidden md:flex md:w-1/2 relative justify-center items-center overflow-hidden rounded-l-[75px] bg-[#B09EE4] order-1 md:order-2 h-full">
        <div
          className={`absolute inset-0 bg-[#261753] rounded-l-[75px] z-0 transition-all duration-700 ease-out ${
            animatePanel ? "ml-[20px]" : "ml-[100%]"
          }`}
        />
        <div className="relative z-10 px-6">
          <Image
            src="/images/login-vector.svg"
            alt="Login Illustration"
            width={380}
            height={380}
            className="max-w-full h-auto"
            priority
          />
        </div>
        <div className="absolute top-6 right-8 flex items-center gap-2 z-10">
          <Image
            src="/images/Transparent logo.png"
            alt="Logo"
            width={55}
            height={55}
            className="w-12 h-12"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-extrabold tracking-wider text-[#B09EE4]">
              FC Voting System
            </span>
            <span className="text-xs font-semibold text-[#6d6a7c]">
              FOSTIIMA Chapter
            </span>
          </div>
        </div>

        {/* Animated Dots - Repositioned */}
        <div className="absolute top-1/3 left-8 w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 right-12 w-3 h-3 bg-white/15 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/5 right-1/5 w-2 h-2 bg-white/20 rounded-full animate-pulse delay-200"></div>
        <div className="absolute bottom-1/5 left-1/3 w-2.5 h-2.5 bg-white/15 rounded-full animate-pulse delay-1200"></div>
      </div>

      {/* Global Styles for Animations */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}