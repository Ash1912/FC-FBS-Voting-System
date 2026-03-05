"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface VotingControl {
  round: number
  isActive: boolean
  startTime: string | null
  endTime: string | null
}

interface Props {
  currentRound: number
  onRoundChange?: (round: number) => void
}

export default function VotingControl({ currentRound, onRoundChange }: Props) {
  const { data: session } = useSession()
  const [votingControls, setVotingControls] = useState<VotingControl[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchVotingControls()
    }
  }, [session])

  const fetchVotingControls = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/voting-control")
      
      if (res.status === 401) {
        setMessage({ type: 'error', text: 'Unauthorized access. Please refresh and sign in again.' })
        return
      }
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to fetch voting controls")
      }
      
      const data = await res.json()
      // Ensure we have data for all rounds
      const completeData = [
        data.find((d: any) => d.round === 1) || { round: 1, isActive: false, startTime: null, endTime: null },
        data.find((d: any) => d.round === 2) || { round: 2, isActive: false, startTime: null, endTime: null },
        data.find((d: any) => d.round === 3) || { round: 3, isActive: false, startTime: null, endTime: null }
      ]
      setVotingControls(completeData)
    } catch (error: any) {
      console.error("Error fetching voting controls:", error)
      setMessage({ type: 'error', text: error.message || 'Failed to load voting controls' })
      // Set default values on error
      setVotingControls([
        { round: 1, isActive: false, startTime: null, endTime: null },
        { round: 2, isActive: false, startTime: null, endTime: null },
        { round: 3, isActive: false, startTime: null, endTime: null }
      ])
    } finally {
      setLoading(false)
    }
  }

  const toggleVoting = async (round: number, currentStatus: boolean) => {
    setUpdating(round)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch("/api/admin/voting-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          round, 
          isActive: !currentStatus 
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to update voting status")
      }

      setMessage({ 
        type: 'success', 
        text: `Round ${round} voting ${!currentStatus ? 'started' : 'stopped'} successfully!` 
      })
      
      // Update local state
      setVotingControls(prev => 
        prev.map(vc => 
          vc.round === round 
            ? { 
                ...vc, 
                isActive: !currentStatus,
                startTime: !currentStatus ? new Date().toISOString() : vc.startTime,
                endTime: currentStatus ? new Date().toISOString() : vc.endTime
              }
            : vc
        )
      )

      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error: any) {
      console.error("Error updating voting control:", error)
      setMessage({ type: 'error', text: error.message || "Failed to update voting status" })
    } finally {
      setUpdating(null)
    }
  }

  const getRoundIcon = (round: number) => {
    switch(round) {
      case 1: return "🎯"
      case 2: return "⚡"
      case 3: return "🏆"
      default: return "📊"
    }
  }

  const getRoundColor = (round: number) => {
    switch(round) {
      case 1: return "from-blue-600 to-indigo-600"
      case 2: return "from-purple-600 to-pink-600"
      case 3: return "from-yellow-600 to-orange-600"
      default: return "from-gray-600 to-gray-700"
    }
  }

  if (!session || session.user?.role !== "ADMIN") {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-gray-600">Admin access required</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-2">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800">Voting Control</h3>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
            : 'bg-red-50 text-red-700 border-l-4 border-red-500'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {votingControls.map((control) => (
          <div 
            key={control.round}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              control.isActive 
                ? 'border-green-400 bg-green-50/50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getRoundColor(control.round)} flex items-center justify-center text-white text-lg`}>
                  {getRoundIcon(control.round)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">
                    Round {control.round}
                    {control.round === 2 && " - Finals"}
                    {control.round === 3 && " - Winners"}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      control.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {control.isActive ? '● Active' : '○ Inactive'}
                    </span>
                    {control.startTime && (
                      <span className="text-xs text-gray-500">
                        Started: {new Date(control.startTime).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onRoundChange?.(control.round)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentRound === control.round
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Select
                </button>

                <button
                  onClick={() => toggleVoting(control.round, control.isActive)}
                  disabled={updating === control.round}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    control.isActive
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {updating === control.round ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    control.isActive ? 'Stop Voting' : 'Start Voting'
                  )}
                </button>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {control.isActive 
                    ? 'Voting is currently OPEN for audience'
                    : 'Voting is currently CLOSED for audience'
                  }
                </span>
                {control.endTime && (
                  <span className="text-gray-500">
                    Ended: {new Date(control.endTime).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
        <p>💡 When voting is active, audience members can cast their votes for that round. When stopped, the voting page will show that voting is closed.</p>
      </div>
    </div>
  )
}