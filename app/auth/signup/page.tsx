"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import toast, { Toaster } from "react-hot-toast"

export default function SignUp() {
  const router = useRouter()
  const pathname = usePathname()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [animatePanel, setAnimatePanel] = useState(false)
  
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatePanel(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const togglePassword = () => setShowPassword(!showPassword)
  const toggleConfirm = () => setShowConfirmPassword(!showConfirmPassword)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const formData = {
      name: nameRef.current?.value?.trim() || "",
      email: emailRef.current?.value?.trim() || "",
      password: passwordRef.current?.value || "",
      confirmPassword: confirmPasswordRef.current?.value || "",
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    // Validate fostiima email
    if (!formData.email.endsWith("@fostiima.org")) {
      setError("Please use your fostiima.org email address")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password, 
          name: formData.name 
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(data.message)
        toast.success("Account created successfully!")
        setTimeout(() => {
          router.push("/auth/signin")
        }, 2000)
      } else {
        setError(data.message || "Something went wrong")
        toast.error(data.message || "Something went wrong")
      }
    } catch (error) {
      setError("Something went wrong")
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-full min-h-screen font-sans bg-[#F1ECFF]">
      <Toaster position="top-center" />

      {/* Mobile Header */}
      <div
        className="md:hidden absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#313053] to-[#261753] z-[1000] flex justify-center items-center shadow-lg"
        style={{
          borderBottomLeftRadius: "50% 20%",
          borderBottomRightRadius: "50% 20%",
        }}
      >
        <div className="flex bg-[#313053]/80 backdrop-blur-sm rounded-full p-1.5 shadow-inner">
          <button
            onClick={() => router.push("/auth/signin")}
            className={`px-6 py-2 rounded-full transition-all duration-300 transform hover:scale-105 ${
              pathname === "/auth/signin"
                ? "bg-gradient-to-r from-[#615fa1] to-[#313053] text-white shadow-md"
                : "text-gray-300 hover:bg-[#615fa1] hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => router.push("/auth/signup")}
            className={`px-6 py-2 rounded-full transition-all duration-300 transform hover:scale-105 ${
              pathname === "/auth/signup"
                ? "bg-gradient-to-r from-[#615fa1] to-[#313053] text-white shadow-md"
                : "text-gray-300 hover:bg-[#615fa1] hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Left Panel - Desktop */}
      <div className="hidden md:flex md:w-1/2 relative justify-center items-center overflow-hidden rounded-r-[75px] bg-[#B09EE4]">
        <div
          className={`absolute inset-0 bg-[#261753] rounded-r-[75px] z-0 transition-all duration-700 ease-out ${
            animatePanel ? "mr-[20px]" : "mr-[100%]"
          }`}
        />
        <div className="relative z-10 px-6 sm:px-8">
          <Image
            src="/images/sign-up-Vector.svg"
            alt="Signup Illustration"
            width={400}
            height={400}
            className="max-w-full h-auto"
          />
        </div>
        <div className="absolute top-4 sm:top-6 left-6 sm:left-10 flex items-center gap-2 sm:gap-3 z-10">
          <Image
            src="/images/Transparent logo.png"
            alt="Logo"
            width={65}
            height={65}
          />
          <div className="flex flex-col leading-tight">
            <span className="text-base sm:text-lg font-extrabold tracking-wider text-[#B09EE4]">
              FC Voting System
            </span>
            <span className="text-sm sm:text-base font-semibold text-[#6d6a7c]">
              FOSTIIMA Chapter
            </span>
          </div>
        </div>

        {/* Animated Dots */}
        <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-white/20 rounded-full animate-pulse hover:scale-150 transition-transform duration-300"></div>
        <div className="absolute bottom-1/3 left-1/4 w-4 h-4 bg-white/15 rounded-full animate-pulse delay-1000 hover:scale-150 transition-transform duration-300"></div>
        <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-white/25 rounded-full animate-pulse delay-500 hover:scale-150 transition-transform duration-300"></div>
        <div className="absolute top-1/5 left-1/5 w-2.5 h-2.5 bg-white/20 rounded-full animate-pulse delay-200 hover:scale-150 transition-transform duration-300"></div>
        <div className="absolute bottom-1/5 right-1/3 w-3.5 h-3.5 bg-white/15 rounded-full animate-pulse delay-1200 hover:scale-150 transition-transform duration-300"></div>
      </div>

      {/* Right Panel - Form */}
      <div
        className={`w-full md:w-1/2 flex justify-center items-center px-4 sm:px-10 lg:px-20 py-10 transition-all duration-700 ease-out pt-24 md:pt-10 ${
          animatePanel
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-10"
        }`}
      >
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-5 sm:space-y-6"
          autoComplete="on"
        >
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
              Create your Account
            </h1>
            <p className="text-sm text-gray-600 font-semibold">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/auth/signin")}
                className="text-[#6356D7] hover:underline font-semibold"
              >
                Sign In here.
              </button>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center gap-3 animate-shake">
              <span className="text-2xl">❌</span>
              <span className="flex-1 font-medium">{error}</span>
              <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg flex items-center gap-3 animate-slide-down">
              <span className="text-2xl">✅</span>
              <span className="flex-1 font-medium">{success}</span>
            </div>
          )}

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              autoComplete="name"
              placeholder="Enter your full name"
              ref={nameRef}
              required
              className="w-full p-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6A4EFF] focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:border-[#B8AAFF]"
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="your.email@fostiima.org"
              ref={emailRef}
              required
              className="w-full p-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6A4EFF] focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:border-[#B8AAFF]"
            />
            <p className="text-xs text-gray-500 mt-1">Must end with @fostiima.org</p>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="new-password"
                autoComplete="new-password"
                placeholder="Enter password (min. 6 characters)"
                ref={passwordRef}
                required
                minLength={6}
                className="w-full p-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6A4EFF] focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:border-[#B8AAFF] pr-12"
              />
              <button
                type="button"
                onClick={togglePassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#6356D7] transition-colors duration-200"
              >
                <span className="text-lg">{showPassword ? "🙈" : "👁️"}</span>
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm-password"
                autoComplete="new-password"
                placeholder="Confirm your password"
                ref={confirmPasswordRef}
                required
                minLength={6}
                className="w-full p-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6A4EFF] focus:border-transparent transition-all duration-300 focus:scale-[1.02] hover:border-[#B8AAFF] pr-12"
              />
              <button
                type="button"
                onClick={toggleConfirm}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#6356D7] transition-colors duration-200"
              >
                <span className="text-lg">{showConfirmPassword ? "🙈" : "👁️"}</span>
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <label className="flex items-center space-x-2 text-sm cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-4 h-4 accent-[#6356D7] rounded border-gray-300 focus:ring-[#6356D7] transition-all duration-200 group-hover:scale-110" 
            />
            <span className="font-medium text-gray-700 group-hover:text-[#6356D7] transition-colors duration-200">
              Remember Me
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="relative group w-full overflow-hidden rounded-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#6356D7] to-[#7E5FFF] rounded-xl blur-lg group-hover:blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
            <div className="relative w-full py-3 bg-gradient-to-r from-[#6356D7] to-[#7E5FFF] text-white rounded-xl font-semibold hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Sign Up"
              )}
            </div>
          </button>

          {/* Email Rules Info */}
          <div className="bg-gradient-to-r from-[#F1ECFF] to-[#E5DEFF] p-4 rounded-xl border border-[#B8AAFF]">
            <p className="font-semibold text-[#313053] mb-2 flex items-center gap-2">
              <span className="text-xl">📧</span>
              Email Requirements:
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#6356D7] rounded-full"></span>
                Everyone must sign up with <span className="font-mono font-semibold text-[#6356D7]">@fostiima.org</span> email
              </li>
            </ul>
          </div>

          {/* Mobile Sign In Link */}
          <div className="md:hidden text-center text-sm text-gray-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/auth/signin")}
              className="text-[#6356D7] font-semibold hover:underline"
            >
              Sign In
            </button>
          </div>
        </form>
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
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}