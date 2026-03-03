"use client"

import { useState, useEffect } from "react"

interface TeamResult {
  id: string
  name: string
  rank: number
  panelistScore: number
  audienceVotes: number
  panelistWeighted: number
  audienceWeighted: number
  totalScore: number
}

interface Props {
  currentRound: number
}

export default function Results({ currentRound }: Props) {
  const [results, setResults] = useState<TeamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null)

  useEffect(() => {
    fetchResults()
  }, [currentRound])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/results?round=${currentRound}`)
      if (!res.ok) throw new Error('Failed to fetch results')
      const data = await res.json()
      setResults(data)
    } catch (error) {
      console.error("Error fetching results:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRoundTitle = () => {
    switch(currentRound) {
      case 1:
        return { title: "Round 1 Results", subtitle: "Qualifying Round - Top 6 advance", icon: "🎯", color: "from-blue-600 to-indigo-600" }
      case 2:
        return { title: "Round 2 Results", subtitle: "FINALS - Top 3 are WINNERS! 🏆", icon: "⚡", color: "from-purple-600 to-pink-600" }
      case 3:
        return { title: "Final Standings", subtitle: "Champions Crowned! 🏆", icon: "🏆", color: "from-yellow-600 to-orange-600" }
      default:
        return { title: "Results", subtitle: "", icon: "📊", color: "from-gray-600 to-gray-700" }
    }
  }

  const getMedal = (rank: number) => {
    switch(rank) {
      case 1: return { emoji: "🥇", label: "Gold", color: "from-yellow-400 to-yellow-500" }
      case 2: return { emoji: "🥈", label: "Silver", color: "from-gray-300 to-gray-400" }
      case 3: return { emoji: "🥉", label: "Bronze", color: "from-orange-400 to-orange-500" }
      default: return { emoji: "", label: "", color: "" }
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium text-lg">Loading results...</p>
          <p className="text-sm text-gray-400">Please wait while we fetch the data</p>
        </div>
      </div>
    )
  }

  const roundInfo = getRoundTitle()

  return (
    <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl overflow-hidden">
      {/* Header with Gradient */}
      <div className={`bg-gradient-to-r ${roundInfo.color} p-6 md:p-8`}>
        <div className="flex items-center gap-4">
          <div className="text-5xl md:text-6xl animate-bounce-slow">{roundInfo.icon}</div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{roundInfo.title}</h2>
            <p className="text-white/90 text-lg flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              {roundInfo.subtitle}
            </p>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
            <p className="text-white/80 text-xs">Total Teams</p>
            <p className="text-white font-bold text-xl">{results.length}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
            <p className="text-white/80 text-xs">Top Score</p>
            <p className="text-white font-bold text-xl">{results[0]?.totalScore || 0}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
            <p className="text-white/80 text-xs">Total Votes</p>
            <p className="text-white font-bold text-xl">
              {results.reduce((acc, team) => acc + team.audienceVotes, 0)}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
            <p className="text-white/80 text-xs">Avg Score</p>
            <p className="text-white font-bold text-xl">
              {(results.reduce((acc, team) => acc + team.totalScore, 0) / results.length).toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Results Table - Enhanced */}
      <div className="p-6 md:p-8">
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-purple-50">
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Rank</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Team</th>
                <th className="py-4 px-6 text-center text-sm font-semibold text-gray-600" colSpan={2}>
                  Panelist (70%)
                </th>
                <th className="py-4 px-6 text-center text-sm font-semibold text-gray-600" colSpan={2}>
                  Audience (30%)
                </th>
                <th className="py-4 px-6 text-center text-sm font-semibold text-gray-600">Total</th>
              </tr>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2 text-center text-xs text-gray-500 font-medium">Raw</th>
                <th className="px-6 py-2 text-center text-xs text-gray-500 font-medium">Weighted</th>
                <th className="px-6 py-2 text-center text-xs text-gray-500 font-medium">Count</th>
                <th className="px-6 py-2 text-center text-xs text-gray-500 font-medium">Weighted</th>
                <th className="px-6 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.map((team, index) => {
                const medal = getMedal(team.rank)
                return (
                  <tr 
                    key={team.id} 
                    className={`
                      transition-all duration-300 cursor-pointer
                      ${hoveredTeam === team.id ? 'bg-gradient-to-r from-purple-50 to-indigo-50 scale-[1.02] shadow-lg' : ''}
                      ${team.rank === 1 ? 'bg-gradient-to-r from-yellow-50/50 to-amber-50/50' : ''}
                      ${team.rank === 2 ? 'bg-gradient-to-r from-gray-50/50 to-slate-50/50' : ''}
                      ${team.rank === 3 ? 'bg-gradient-to-r from-orange-50/50 to-amber-50/50' : ''}
                    `}
                    onMouseEnter={() => setHoveredTeam(team.id)}
                    onMouseLeave={() => setHoveredTeam(null)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                          ${team.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' : ''}
                          ${team.rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white' : ''}
                          ${team.rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' : ''}
                          ${team.rank > 3 ? 'bg-gray-200 text-gray-700' : ''}
                        `}>
                          {team.rank}
                        </span>
                        {medal.emoji && (
                          <span className="text-2xl animate-bounce-slow">{medal.emoji}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{team.name}</span>
                        <span className="text-xs text-gray-500">ID: {team.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-mono text-gray-600">{team.panelistScore}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-bold text-purple-600">{team.panelistWeighted}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-mono text-gray-600">{team.audienceVotes}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-bold text-indigo-600">{team.audienceWeighted}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`
                        font-bold text-lg px-3 py-1 rounded-full
                        ${team.rank === 1 ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800' : ''}
                        ${team.rank === 2 ? 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800' : ''}
                        ${team.rank === 3 ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800' : ''}
                        ${team.rank > 3 ? 'bg-gray-100 text-gray-700' : ''}
                      `}>
                        {team.totalScore}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Round-Specific Sections */}
        <div className="mt-8 space-y-6">
          {/* Round 1 - Qualifiers */}
          {currentRound === 1 && results.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500 rounded-lg p-2">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-blue-800">🏆 Teams Qualifying for Round 2</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.slice(0, 6).map((team, index) => (
                  <div key={team.id} className="bg-white rounded-lg p-3 shadow-md flex items-center gap-3 transform hover:scale-105 transition-all duration-300">
                    <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{team.name}</p>
                      <p className="text-xs text-gray-500">Score: {team.totalScore}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Round 2 - Winners */}
          {currentRound === 2 && results.length > 0 && (
            <div className="space-y-6">
              {/* Podium */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-green-500 rounded-lg p-2">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-green-800">🏆 WINNERS PODIUM 🏆</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  {/* 2nd Place */}
                  {results[1] && (
                    <div className="order-1 md:order-1 transform hover:scale-105 transition-all duration-300">
                      <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-t-2xl p-6 text-center border-2 border-gray-300 shadow-lg">
                        <div className="text-5xl mb-3 animate-bounce-slow">🥈</div>
                        <h4 className="font-bold text-gray-800 text-lg mb-1">{results[1].name}</h4>
                        <p className="text-2xl font-bold text-gray-700">{results[1].totalScore}</p>
                        <p className="text-xs text-gray-500 mt-2">2nd Place</p>
                      </div>
                    </div>
                  )}

                  {/* 1st Place */}
                  {results[0] && (
                    <div className="order-2 md:order-2 md:-mt-8 transform hover:scale-105 transition-all duration-300">
                      <div className="bg-gradient-to-b from-yellow-100 to-yellow-200 rounded-t-2xl p-8 text-center border-2 border-yellow-400 shadow-xl">
                        <div className="text-6xl mb-3 animate-bounce">🥇</div>
                        <h4 className="font-bold text-yellow-800 text-xl mb-1">{results[0].name}</h4>
                        <p className="text-3xl font-bold text-yellow-700">{results[0].totalScore}</p>
                        <p className="text-sm text-yellow-600 mt-2 font-semibold">CHAMPION</p>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {results[2] && (
                    <div className="order-3 md:order-3 transform hover:scale-105 transition-all duration-300">
                      <div className="bg-gradient-to-b from-orange-100 to-orange-200 rounded-t-2xl p-6 text-center border-2 border-orange-300 shadow-lg">
                        <div className="text-5xl mb-3 animate-bounce-slow">🥉</div>
                        <h4 className="font-bold text-orange-800 text-lg mb-1">{results[2].name}</h4>
                        <p className="text-2xl font-bold text-orange-700">{results[2].totalScore}</p>
                        <p className="text-xs text-gray-500 mt-2">3rd Place</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* All Teams Ranking */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                  Complete Rankings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {results.map((team) => (
                    <div key={team.id} className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-500 w-6">#{team.rank}</span>
                        <span className="font-medium text-gray-800">{team.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-purple-600">{team.totalScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Round 3 - Final Winners */}
          {currentRound === 3 && results.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-8 border border-purple-200">
              <div className="text-center mb-8">
                <div className="text-7xl mb-4 animate-bounce">🏆</div>
                <h3 className="text-3xl font-bold text-purple-800 mb-2">FINAL CHAMPIONS</h3>
                <p className="text-purple-600">Based on Round 2 Results</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {results.slice(0, 3).map((team, index) => {
                  const medal = getMedal(team.rank)
                  return (
                    <div 
                      key={team.id} 
                      className={`
                        rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300
                        ${index === 0 ? 'bg-gradient-to-b from-yellow-50 to-yellow-100 border-2 border-yellow-400 shadow-xl' : ''}
                        ${index === 1 ? 'bg-gradient-to-b from-gray-50 to-gray-100 border-2 border-gray-400 shadow-lg' : ''}
                        ${index === 2 ? 'bg-gradient-to-b from-orange-50 to-orange-100 border-2 border-orange-400 shadow-lg' : ''}
                      `}
                    >
                      <div className="text-6xl mb-4 animate-pulse">{medal.emoji}</div>
                      <h4 className="text-2xl font-bold text-gray-800 mb-2">{team.name}</h4>
                      <p className="text-3xl font-bold text-purple-600 mb-3">{team.totalScore}</p>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600">Panelist: {team.panelistWeighted}</p>
                        <p className="text-gray-600">Audience: {team.audienceWeighted}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/50">
                        <span className="text-xs font-medium px-3 py-1 bg-white/50 rounded-full">
                          {medal.label} Medal
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              // Add export functionality here
              console.log("Export results")
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Results
          </button>
        </div>
      </div>

      {/* Add global styles for animations */}
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
      `}</style>
    </div>
  )
}