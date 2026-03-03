"use client"

import { useState, useEffect } from "react"

interface Team {
  id: string
  name: string
}

interface TeamResult {
  id: string
  name: string
  rank: number
  totalScore: number
}

interface Props {
  currentRound: number
}

export default function VoteManagement({ currentRound }: Props) {
  const [teams, setTeams] = useState<Team[]>([])
  const [winners, setWinners] = useState<TeamResult[]>([])
  const [scores, setScores] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [fetchingTeams, setFetchingTeams] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null)

  useEffect(() => {
    if (currentRound === 3) {
      fetchWinners()
    } else {
      fetchTeamsForRound()
    }
  }, [currentRound])

  useEffect(() => {
    if (teams.length > 0 && currentRound !== 3) {
      fetchExistingScores()
    }
  }, [currentRound, teams])

  const fetchWinners = async () => {
    setFetchingTeams(true)
    try {
      const res = await fetch("/api/results?round=2")
      if (!res.ok) throw new Error('Failed to fetch winners')
      const data = await res.json()
      const top3Winners = data.slice(0, 3)
      setWinners(top3Winners)
    } catch (error) {
      console.error("Error fetching winners:", error)
      setMessage({ 
        type: 'error', 
        text: 'Failed to load winners. Please ensure Round 2 scores are entered.' 
      })
    } finally {
      setFetchingTeams(false)
    }
  }

  const fetchTeamsForRound = async () => {
    setFetchingTeams(true)
    try {
      if (currentRound === 1) {
        await fetchAllTeams()
      } else if (currentRound === 2) {
        await fetchRound2Teams()
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
      setMessage({ type: 'error', text: 'Error fetching teams' })
    } finally {
      setFetchingTeams(false)
    }
  }

  const fetchAllTeams = async () => {
    const res = await fetch("/api/teams")
    if (!res.ok) throw new Error('Failed to fetch teams')
    const data = await res.json()
    setTeams(data)
  }

  const fetchRound2Teams = async () => {
    try {
      const resultsRes = await fetch("/api/results?round=1")
      if (!resultsRes.ok) throw new Error('Failed to fetch Round 1 results')
      const resultsData = await resultsRes.json()
      
      const top6Teams = resultsData.slice(0, 6)
      
      if (top6Teams.length === 0) {
        setMessage({ 
          type: 'error', 
          text: 'No Round 1 results found. Please ensure Round 1 scores are entered first.' 
        })
        setTeams([])
        return
      }

      const teamsRes = await fetch("/api/teams")
      if (!teamsRes.ok) throw new Error('Failed to fetch teams')
      const allTeams = await teamsRes.json()
      
      const top6TeamIds = top6Teams.map((t: any) => t.id)
      const round2Teams = allTeams.filter((team: Team) => top6TeamIds.includes(team.id))
      
      const sortedTeams = top6Teams.map((t: any) => 
        round2Teams.find((team: Team) => team.id === t.id)
      ).filter(Boolean)
      
      setTeams(sortedTeams)
      
      setMessage({ 
        type: 'info', 
        text: 'Showing top 6 teams from Round 1 results' 
      })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error("Error fetching Round 2 teams:", error)
      throw error
    }
  }

  const fetchExistingScores = async () => {
    try {
      const res = await fetch(`/api/panelist-scores?round=${currentRound}`)
      if (res.ok) {
        const data = await res.json()
        const scoresRecord: Record<string, number> = {}
        data.forEach((score: any) => {
          scoresRecord[score.teamId] = score.score
        })
        setScores(scoresRecord)
      }
    } catch (error) {
      console.error("Error fetching existing scores:", error)
    }
  }

  const handleScoreChange = (teamId: string, score: number) => {
    const validScore = Math.min(100, Math.max(0, score))
    setScores(prev => ({ ...prev, [teamId]: validScore }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    const missingTeams = teams.filter(team => !scores[team.id])
    if (missingTeams.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `Please enter scores for all teams: ${missingTeams.map(t => t.name).join(', ')}` 
      })
      setLoading(false)
      return
    }

    try {
      const scoresArray = Object.entries(scores).map(([teamId, score]) => ({
        teamId,
        score
      }))

      const res = await fetch("/api/panelist-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round: currentRound,
          scores: scoresArray
        })
      })

      const data = await res.json()

      if (res.ok) {
        if (currentRound === 1) {
          setMessage({ 
            type: 'success', 
            text: 'Round 1 scores saved! Top 6 teams will qualify for Round 2.' 
          })
        } else if (currentRound === 2) {
          setMessage({ 
            type: 'success', 
            text: 'Round 2 scores saved! Top 3 teams are the WINNERS! 🏆' 
          })
        }
        setTimeout(() => setMessage({ type: '', text: '' }), 5000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Error saving scores' })
      }
    } catch (error) {
      console.error("Error saving scores:", error)
      setMessage({ type: 'error', text: 'Error saving scores' })
    } finally {
      setLoading(false)
    }
  }

  if (fetchingTeams) {
    return (
      <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl p-6 md:p-8">
        <div className="flex flex-col items-center justify-center py-12 md:py-16">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading teams...</p>
        </div>
      </div>
    )
  }

  // Round 3 - Show Winners (Enhanced UI)
  if (currentRound === 3) {
    return (
      <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            🏆 FINAL WINNERS 🏆
          </h2>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">Based on Round 2 Results</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm sm:text-base ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-700 border-l-4 border-red-500'
              : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
          }`}>
            {message.text}
          </div>
        )}

        {winners.length === 0 ? (
          <div className="text-center py-12 md:py-16 bg-gray-50 rounded-2xl">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-gray-600 text-lg mb-2">No winners determined yet</p>
            <p className="text-sm text-gray-400">Please complete Round 2 voting first</p>
          </div>
        ) : (
          <div className="space-y-8 md:space-y-10">
            {/* Podium Style Display - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              {/* 2nd Place - Shows first on mobile, second on desktop */}
              {winners[1] && (
                <div className="order-1 sm:order-1 transform hover:scale-105 transition-all duration-300">
                  <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl p-6 text-center border-2 border-gray-300 shadow-lg h-full">
                    <div className="relative mb-4">
                      <div className="text-5xl md:text-6xl animate-bounce-slow">🥈</div>
                      <div className="absolute -top-2 -right-2 bg-gray-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">
                        2
                      </div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 break-words">{winners[1].name}</h3>
                    <div className="bg-white/50 backdrop-blur rounded-lg p-3">
                      <p className="text-2xl md:text-3xl font-bold text-gray-700">{winners[1].totalScore}</p>
                      <p className="text-xs text-gray-500 mt-1">Total Score</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place - Shows second on mobile, first on desktop */}
              {winners[0] && (
                <div className="order-2 sm:order-2 sm:-mt-8 transform hover:scale-105 transition-all duration-300">
                  <div className="bg-gradient-to-b from-yellow-100 to-yellow-200 rounded-2xl p-6 text-center border-2 border-yellow-400 shadow-xl h-full">
                    <div className="relative mb-4">
                      <div className="text-6xl md:text-7xl animate-bounce">🥇</div>
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">
                        1
                      </div>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-yellow-800 mb-2 break-words">{winners[0].name}</h3>
                    <div className="bg-white/50 backdrop-blur rounded-lg p-3">
                      <p className="text-3xl md:text-4xl font-bold text-yellow-700">{winners[0].totalScore}</p>
                      <p className="text-xs text-yellow-600 mt-1">Champion Score</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place - Shows third on both */}
              {winners[2] && (
                <div className="order-3 sm:order-3 transform hover:scale-105 transition-all duration-300">
                  <div className="bg-gradient-to-b from-orange-100 to-orange-200 rounded-2xl p-6 text-center border-2 border-orange-400 shadow-lg h-full">
                    <div className="relative mb-4">
                      <div className="text-5xl md:text-6xl animate-bounce-slow">🥉</div>
                      <div className="absolute -top-2 -right-2 bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">
                        3
                      </div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-orange-800 mb-2 break-words">{winners[2].name}</h3>
                    <div className="bg-white/50 backdrop-blur rounded-lg p-3">
                      <p className="text-2xl md:text-3xl font-bold text-orange-700">{winners[2].totalScore}</p>
                      <p className="text-xs text-orange-600 mt-1">Total Score</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Winners List - Enhanced */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 md:p-8 border border-green-200">
              <h3 className="font-bold text-xl md:text-2xl text-green-800 mb-6 text-center flex items-center justify-center gap-2">
                <span>🏆 CHAMPIONS 🏆</span>
              </h3>
              <div className="space-y-3">
                {winners.map((team, index) => (
                  <div 
                    key={team.id} 
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-l-4"
                    style={{ 
                      borderLeftColor: index === 0 ? '#FBBF24' : index === 1 ? '#9CA3AF' : '#FB923C'
                    }}
                  >
                    <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                      <span className="text-3xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                      <div>
                        <span className="font-bold text-gray-800 text-lg">{team.name}</span>
                        <p className="text-xs text-gray-500">Rank #{team.rank}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                      <span className="text-gray-600 text-sm sm:hidden">Score:</span>
                      <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        {team.totalScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Note about no voting */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 text-center border border-yellow-200">
              <p className="text-yellow-800 text-sm md:text-base flex items-center justify-center gap-2">
                <span className="text-xl">📢</span>
                <span className="font-medium">No voting or marks entry for Round 3.</span>
                <span className="hidden sm:inline">Winners are determined from Round 2 results.</span>
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Round 1 and 2 - Marks Entry (Enhanced UI)
  return (
    <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 w-1 h-8 rounded-full"></div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            Round {currentRound} Panelist Marks
          </h2>
          {currentRound === 2 && (
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs sm:text-sm px-3 py-1 rounded-full font-semibold shadow-lg animate-pulse">
              FINALS 🏆
            </span>
          )}
        </div>
        
        {/* Round Badge */}
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 px-4 py-2 rounded-xl">
          <span className="text-purple-700 font-semibold text-sm">
            {currentRound === 1 ? '12 Teams Competing' : '6 Teams in Finals'}
          </span>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-xl text-sm md:text-base flex items-start gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
            : message.type === 'info'
            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
            : 'bg-red-50 text-red-700 border-l-4 border-red-500'
        }`}>
          <span className="text-xl">
            {message.type === 'success' ? '✅' : message.type === 'info' ? 'ℹ️' : '❌'}
          </span>
          <span className="flex-1">{message.text}</span>
        </div>
      )}

      {teams.length === 0 ? (
        <div className="text-center py-12 md:py-16 bg-gray-50 rounded-xl">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-600 text-lg mb-2">
            {currentRound === 1 ? 'No teams available' : 'No Round 1 results found'}
          </p>
          <p className="text-sm text-gray-400">
            {currentRound === 1 
              ? 'Please add teams in Team Management' 
              : 'Please enter Round 1 scores first'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          {/* Table - Mobile Optimized */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-purple-600 to-indigo-600">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white">Rank</th>
                      <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white">Team</th>
                      <th className="px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-white">Marks (0-100)</th>
                      <th className="px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-white hidden sm:table-cell">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teams.map((team, index) => (
                      <tr 
                        key={team.id} 
                        className={`hover:bg-purple-50 transition-colors duration-200 ${
                          hoveredTeam === team.id ? 'bg-purple-50' : ''
                        }`}
                        onMouseEnter={() => setHoveredTeam(team.id)}
                        onMouseLeave={() => setHoveredTeam(null)}
                      >
                        <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index < 3 && currentRound === 2
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {index + 1}
                            </span>
                            {currentRound === 2 && index < 3 && (
                              <span className="text-yellow-500 text-lg hidden sm:inline">⭐</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 text-sm sm:text-base">{team.name}</span>
                            <span className="text-xs text-gray-500 sm:hidden">
                              {scores[team.id] !== undefined ? '✓ Entered' : 'Pending'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex justify-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={scores[team.id] || ''}
                              onChange={(e) => handleScoreChange(team.id, parseFloat(e.target.value) || 0)}
                              className={`w-16 sm:w-20 md:w-24 px-2 sm:px-3 py-1.5 sm:py-2 text-center border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 text-sm sm:text-base ${
                                scores[team.id] !== undefined
                                  ? 'border-green-300 bg-green-50'
                                  : 'border-gray-300 hover:border-purple-300'
                              }`}
                              placeholder="0-100"
                              required
                            />
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-center hidden sm:table-cell">
                          {scores[team.id] !== undefined ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5"></span>
                              Entered
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5"></span>
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Round Info Card */}
          <div className={`rounded-xl p-4 md:p-6 ${
            currentRound === 1 
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
              : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{currentRound === 1 ? '📌' : '🏆'}</span>
              <div>
                <p className={`font-semibold text-sm md:text-base ${
                  currentRound === 1 ? 'text-blue-800' : 'text-green-800'
                }`}>
                  {currentRound === 1 
                    ? 'Round 1 Qualifiers' 
                    : 'Round 2 Finals'}
                </p>
                <p className={`text-xs md:text-sm mt-1 ${
                  currentRound === 1 ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {currentRound === 1 
                    ? 'After saving, top 6 teams will qualify for Round 2' 
                    : 'After saving, top 3 teams will be declared WINNERS!'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to clear all scores?')) {
                  setScores({})
                }
              }}
              className="w-full sm:w-auto order-2 sm:order-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105"
            >
              Clear All
            </button>
            <button
              type="submit"
              disabled={loading || teams.length === 0}
              className="w-full sm:w-auto order-1 sm:order-2 relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur-lg group-hover:blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
              <div className="relative px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save All Scores'
                )}
              </div>
            </button>
          </div>
        </form>
      )}

      {/* Summary Card */}
      {teams.length > 0 && (
        <div className="mt-6 md:mt-8 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-4 md:p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
            Round {currentRound} Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Teams</p>
              <p className="text-2xl font-bold text-purple-600">{teams.length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Scores Entered</p>
              <p className="text-2xl font-bold text-green-600">
                {Object.keys(scores).length} / {teams.length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Completion</p>
              <p className="text-2xl font-bold text-indigo-600">
                {Math.round((Object.keys(scores).length / teams.length) * 100)}%
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Average</p>
              <p className="text-2xl font-bold text-orange-600">
                {Object.keys(scores).length > 0
                  ? (Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length).toFixed(1)
                  : '0'}
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(Object.keys(scores).length / teams.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}