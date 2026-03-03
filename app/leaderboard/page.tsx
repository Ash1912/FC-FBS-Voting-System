"use client"

import { useState, useEffect, useRef } from "react"

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

export default function LeaderboardPage() {
  const [currentRound, setCurrentRound] = useState(1)
  const [results, setResults] = useState<TeamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null) // Fixed: useRef instead of useState

  useEffect(() => {
    fetchResults()
  }, [currentRound])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchResults = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/results?round=${currentRound}`)
      if (!res.ok) {
        throw new Error('Failed to fetch results')
      }
      const data = await res.json()
      
      if (!data || data.length === 0) {
        setError(`No results available for Round ${currentRound}`)
      } else {
        setResults(data)
      }
    } catch (error) {
      console.error("Error fetching results:", error)
      setError("Failed to load results. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getRoundInfo = () => {
    switch(currentRound) {
      case 1:
        return {
          title: "Round 1 Results",
          description: "All 12 teams competing. Top 6 will qualify for Round 2.",
          icon: "🎯",
          color: "from-blue-600 to-indigo-600",
          bgColor: "from-blue-50 to-indigo-50",
          shortLabel: "Round 1",
          longLabel: "Round 1 Results (12 Teams)",
          emoji: "🎯"
        }
      case 2:
        return {
          title: "Round 2 Results - FINALS",
          description: "Top 6 teams from Round 1 competing in the FINALS!",
          icon: "⚡",
          color: "from-purple-600 to-pink-600",
          bgColor: "from-purple-50 to-pink-50",
          shortLabel: "Round 2",
          longLabel: "Round 2 Results - FINALS (6 Teams)",
          emoji: "⚡"
        }
      case 3:
        return {
          title: "🏆 CHAMPIONS 🏆",
          description: "Final Winners - Based on Round 2 performance",
          icon: "🏆",
          color: "from-yellow-600 to-orange-600",
          bgColor: "from-yellow-50 to-orange-50",
          shortLabel: "Winners",
          longLabel: "🏆 Final Winners (Top 3) 🏆",
          emoji: "🏆"
        }
      default:
        return {
          title: "Leaderboard",
          description: "",
          icon: "📊",
          color: "from-gray-600 to-gray-700",
          bgColor: "from-gray-50 to-gray-100",
          shortLabel: "Results",
          longLabel: "View Results",
          emoji: "📊"
        }
    }
  }

  const getMedal = (rank: number) => {
    switch(rank) {
      case 1: return { emoji: "🥇", label: "Gold", color: "from-yellow-400 to-yellow-500", bg: "bg-yellow-50" }
      case 2: return { emoji: "🥈", label: "Silver", color: "from-gray-300 to-gray-400", bg: "bg-gray-50" }
      case 3: return { emoji: "🥉", label: "Bronze", color: "from-orange-400 to-orange-500", bg: "bg-orange-50" }
      default: return { emoji: "", label: "", color: "", bg: "" }
    }
  }

  const roundInfo = getRoundInfo()

  const roundOptions = [
    { value: 1, label: "Round 1 Results (12 Teams)", emoji: "🎯", color: "blue" },
    { value: 2, label: "Round 2 Results - FINALS (6 Teams)", emoji: "⚡", color: "purple" },
    { value: 3, label: "🏆 Final Winners (Top 3) 🏆", emoji: "🏆", color: "yellow" }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl p-12">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-full blur-2xl animate-pulse"></div>
              </div>
              <p className="mt-8 text-2xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Loading Results
              </p>
              <p className="text-gray-500 mt-2">Please wait while we fetch the latest scores...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl flex items-center justify-center transform hover:rotate-6 transition-all duration-300">
                  <span className="text-4xl">📊</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Event Leaderboard
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Live Results • Real-time Updates
                </p>
              </div>
            </div>

            {/* Custom Enhanced Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="group relative w-full md:w-80 bg-white/80 backdrop-blur-sm hover:bg-white rounded-2xl shadow-lg border border-white/50 p-1 transition-all duration-300 hover:shadow-xl"
              >
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${
                      currentRound === 1 ? 'from-blue-500 to-indigo-500' :
                      currentRound === 2 ? 'from-purple-500 to-pink-500' :
                      'from-yellow-500 to-orange-500'
                    } flex items-center justify-center text-white text-lg shadow-md`}>
                      {roundOptions.find(r => r.value === currentRound)?.emoji}
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500">Viewing</p>
                      <p className="font-semibold text-gray-800">
                        {roundOptions.find(r => r.value === currentRound)?.label}
                      </p>
                    </div>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-full md:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-fade-in-down">
                  <div className="p-2 space-y-1">
                    {roundOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setCurrentRound(option.value)
                          setIsDropdownOpen(false)
                        }}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300
                          ${currentRound === option.value 
                            ? `bg-gradient-to-r ${
                                option.color === 'blue' ? 'from-blue-50 to-indigo-50 border-l-4 border-blue-500' :
                                option.color === 'purple' ? 'from-purple-50 to-pink-50 border-l-4 border-purple-500' :
                                'from-yellow-50 to-orange-50 border-l-4 border-yellow-500'
                              }` 
                            : 'hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${
                          option.color === 'blue' ? 'from-blue-500 to-indigo-500' :
                          option.color === 'purple' ? 'from-purple-500 to-pink-500' :
                          'from-yellow-500 to-orange-500'
                        } flex items-center justify-center text-white text-lg shadow-md`}>
                          {option.emoji}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-medium ${
                            currentRound === option.value 
                              ? option.color === 'blue' ? 'text-blue-700' :
                                option.color === 'purple' ? 'text-purple-700' :
                                'text-yellow-700'
                              : 'text-gray-700'
                          }`}>
                            {option.label}
                          </p>
                          <p className="text-xs text-gray-400">
                            {option.value === 1 ? '12 teams competing' :
                             option.value === 2 ? '6 teams in finals' :
                             'Top 3 champions'}
                          </p>
                        </div>
                        {currentRound === option.value && (
                          <div className={`w-2 h-2 rounded-full ${
                            option.color === 'blue' ? 'bg-blue-500' :
                            option.color === 'purple' ? 'bg-purple-500' :
                            'bg-yellow-500'
                          } animate-pulse`}></div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {/* Dropdown Footer */}
                  <div className="p-3 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-center text-gray-500">
                      {results.length} teams • Last updated {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Decorative Line */}
          <div className="mt-6 h-1 w-full bg-gradient-to-r from-purple-200 via-indigo-200 to-purple-200 rounded-full"></div>
        </div>

        {/* Round Info Card */}
        <div className={`mb-8 bg-gradient-to-r ${roundInfo.color} rounded-2xl shadow-xl p-6 text-white`}>
          <div className="flex items-center gap-4">
            <div className="text-5xl animate-bounce-slow">{roundInfo.icon}</div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{roundInfo.title}</h2>
              <p className="text-white/90 text-lg">{roundInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {!error && results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
              <p className="text-sm text-gray-500 mb-1">Total Teams</p>
              <p className="text-2xl font-bold text-gray-800">{results.length}</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
              <p className="text-sm text-gray-500 mb-1">Top Score</p>
              <p className="text-2xl font-bold text-purple-600">{results[0]?.totalScore || 0}</p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
              <p className="text-sm text-gray-500 mb-1">Total Votes</p>
              <p className="text-2xl font-bold text-indigo-600">
                {results.reduce((acc, team) => acc + team.audienceVotes, 0)}
              </p>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
              <p className="text-sm text-gray-500 mb-1">Avg Score</p>
              <p className="text-2xl font-bold text-pink-600">
                {(results.reduce((acc, team) => acc + team.totalScore, 0) / results.length).toFixed(1)}
              </p>
            </div>
          </div>
        )}

        {error ? (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center gap-3 animate-shake">
            <span className="text-2xl">❌</span>
            <span className="flex-1 font-medium">{error}</span>
            <button onClick={() => fetchResults()} className="text-red-500 hover:text-red-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            {currentRound === 3 ? (
              // Final Winners Display - Enhanced
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50">
                <div className="text-center mb-10">
                  <div className="text-8xl mb-4 animate-bounce">🏆</div>
                  <h2 className="text-5xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">
                    CHAMPIONS
                  </h2>
                  <p className="text-gray-500 text-lg">Based on Round 2 Results</p>
                </div>
                
                {results.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl">
                    <div className="text-6xl mb-4">🏆</div>
                    <p className="text-gray-600 text-xl mb-2">No winners determined yet</p>
                    <p className="text-gray-400">Please complete Round 2 voting first.</p>
                  </div>
                ) : (
                  <>
                    {/* Podium Style Display - Enhanced */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-12">
                      {/* 2nd Place */}
                      {results[1] && (
                        <div className="order-1 md:order-1 transform hover:scale-105 transition-all duration-300">
                          <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-t-3xl p-8 text-center border-2 border-gray-300 shadow-xl h-72 flex flex-col justify-end">
                            <div className="text-6xl mb-4 animate-bounce-slow">🥈</div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{results[1].name}</h3>
                            <p className="text-3xl font-bold text-gray-700 mb-3">{results[1].totalScore}</p>
                            <p className="text-gray-600 font-medium">2nd Place</p>
                            <div className="mt-4 text-sm text-gray-500 bg-white/50 rounded-lg p-2">
                              <div>Panelist: {results[1].panelistWeighted}</div>
                              <div>Audience: {results[1].audienceWeighted}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 1st Place */}
                      {results[0] && (
                        <div className="order-2 md:order-2 md:-mt-12 transform hover:scale-105 transition-all duration-300">
                          <div className="bg-gradient-to-b from-yellow-100 to-yellow-200 rounded-t-3xl p-10 text-center border-2 border-yellow-400 shadow-2xl h-96 flex flex-col justify-end">
                            <div className="text-7xl mb-4 animate-bounce">🥇</div>
                            <h3 className="text-3xl font-bold text-yellow-800 mb-2">{results[0].name}</h3>
                            <p className="text-4xl font-bold text-yellow-700 mb-3">{results[0].totalScore}</p>
                            <p className="text-yellow-700 font-bold text-lg">CHAMPION</p>
                            <div className="mt-4 text-sm text-yellow-600 bg-white/50 rounded-lg p-2">
                              <div>Panelist: {results[0].panelistWeighted}</div>
                              <div>Audience: {results[0].audienceWeighted}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3rd Place */}
                      {results[2] && (
                        <div className="order-3 md:order-3 transform hover:scale-105 transition-all duration-300">
                          <div className="bg-gradient-to-b from-orange-100 to-orange-200 rounded-t-3xl p-8 text-center border-2 border-orange-400 shadow-xl h-64 flex flex-col justify-end">
                            <div className="text-6xl mb-4 animate-bounce-slow">🥉</div>
                            <h3 className="text-2xl font-bold text-orange-800 mb-2">{results[2].name}</h3>
                            <p className="text-3xl font-bold text-orange-700 mb-3">{results[2].totalScore}</p>
                            <p className="text-gray-600 font-medium">3rd Place</p>
                            <div className="mt-4 text-sm text-gray-500 bg-white/50 rounded-lg p-2">
                              <div>Panelist: {results[2].panelistWeighted}</div>
                              <div>Audience: {results[2].audienceWeighted}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Winners List - Enhanced */}
                    <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 p-8 rounded-2xl border border-yellow-200">
                      <h3 className="font-bold text-2xl text-center mb-6 flex items-center justify-center gap-3">
                        <span className="text-3xl">🏆</span>
                        <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                          WINNERS PODIUM
                        </span>
                        <span className="text-3xl">🏆</span>
                      </h3>
                      <div className="space-y-4">
                        {results.map((team, index) => {
                          const medal = getMedal(team.rank)
                          return (
                            <div 
                              key={team.id} 
                              className={`
                                flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 rounded-xl
                                ${medal.bg} border-2 transition-all duration-300
                                ${hoveredTeam === team.id ? 'scale-[1.02] shadow-xl border-purple-300' : 'border-transparent'}
                              `}
                              onMouseEnter={() => setHoveredTeam(team.id)}
                              onMouseLeave={() => setHoveredTeam(null)}
                            >
                              <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${medal.color} flex items-center justify-center text-2xl shadow-lg`}>
                                  {medal.emoji}
                                </div>
                                <div>
                                  <span className="font-bold text-gray-800 text-lg block">{team.name}</span>
                                  <p className="text-sm text-gray-500">Rank #{team.rank}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-4">
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">Total Score</p>
                                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                    {team.totalScore}
                                  </p>
                                </div>
                                <div className="hidden md:block text-xs text-gray-400">
                                  <div>P: {team.panelistWeighted}</div>
                                  <div>A: {team.audienceWeighted}</div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Round 1 and 2 Results Table - Enhanced
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className={`bg-gradient-to-r ${roundInfo.color}`}>
                        <th className="py-4 px-6 text-left text-sm font-semibold text-white">Rank</th>
                        <th className="py-4 px-6 text-left text-sm font-semibold text-white">Team</th>
                        <th className="py-4 px-6 text-center text-sm font-semibold text-white">Panelist (70%)</th>
                        <th className="py-4 px-6 text-center text-sm font-semibold text-white">Audience Votes</th>
                        <th className="py-4 px-6 text-center text-sm font-semibold text-white">Audience (30%)</th>
                        <th className="py-4 px-6 text-center text-sm font-semibold text-white">Total Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {results.map((team) => {
                        const medal = getMedal(team.rank)
                        return (
                          <tr 
                            key={team.id} 
                            className={`
                              transition-all duration-300 cursor-pointer
                              ${hoveredTeam === team.id ? 'bg-gradient-to-r from-purple-50 to-indigo-50 scale-[1.01] shadow-lg' : ''}
                              ${team.rank === 1 ? medal.bg : ''}
                              ${team.rank === 2 ? medal.bg : ''}
                              ${team.rank === 3 ? medal.bg : ''}
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
                                  <span className="text-xl animate-bounce-slow">{medal.emoji}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-800">{team.name}</span>
                                <span className="text-xs text-gray-400">ID: {team.id.slice(0, 8)}</span>
                              </div>
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
              </div>
            )}

            {/* Qualification/Winners Info - Enhanced */}
            {currentRound === 1 && results.length > 0 && (
              <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-500 rounded-lg p-2">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-800">🏆 Teams Qualifying for Round 2</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {results.slice(0, 6).map((team, i) => (
                    <div key={team.id} className="bg-white rounded-xl p-3 shadow-md flex items-center gap-3 transform hover:scale-105 transition-all duration-300">
                      <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {i + 1}
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

            {currentRound === 2 && results.length > 0 && (
              <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-500 rounded-lg p-2">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-green-800">🏆 WINNERS - Top 3 Teams</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {results.slice(0, 3).map((team, i) => {
                    const medal = getMedal(team.rank)
                    return (
                      <div key={team.id} className="bg-white rounded-xl p-5 shadow-lg text-center transform hover:scale-105 transition-all duration-300">
                        <div className={`text-5xl mb-3 inline-block p-3 rounded-full bg-gradient-to-r ${medal.color} bg-opacity-10`}>
                          {medal.emoji}
                        </div>
                        <h4 className="font-bold text-xl text-gray-800 mb-2">{team.name}</h4>
                        <p className="text-2xl font-bold text-purple-600 mb-2">{team.totalScore}</p>
                        <p className="text-sm text-gray-500">{medal.label} Medal</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Global Styles for Animations */}
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}