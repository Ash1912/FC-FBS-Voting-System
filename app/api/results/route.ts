import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const round = parseInt(searchParams.get("round") || "1")

  try {
    // Get all teams
    const teams = await prisma.team.findMany({
      orderBy: { name: "asc" }
    })

    // Calculate results for each team
    const results = await Promise.all(
      teams.map(async (team) => {
        // Get panelist scores for this round
        const panelistScores = await prisma.panelistScore.findMany({
          where: {
            teamId: team.id,
            round
          }
        })

        // Calculate average panelist score
        const avgPanelistScore = panelistScores.length > 0
          ? panelistScores.reduce((sum, ps) => sum + ps.score, 0) / panelistScores.length
          : 0

        // Get audience votes for this round
        const audienceVotes = await prisma.vote.count({
          where: {
            teamId: team.id,
            round
          }
        })

        // Calculate weighted score
        const panelistWeighted = avgPanelistScore * 0.7
        const audienceWeighted = audienceVotes * 0.3
        const totalScore = panelistWeighted + audienceWeighted

        return {
          id: team.id,
          name: team.name,
          panelistScore: Number(avgPanelistScore.toFixed(2)),
          audienceVotes,
          panelistWeighted: Number(panelistWeighted.toFixed(2)),
          audienceWeighted: Number(audienceWeighted.toFixed(2)),
          totalScore: Number(totalScore.toFixed(2))
        }
      })
    )

    // Sort by total score descending
    results.sort((a, b) => b.totalScore - a.totalScore)

    // Add rank
    const rankedResults = results.map((result, index) => ({
      ...result,
      rank: index + 1
    }))

    // For round 2, only return top 6 teams from round 1
    if (round === 2) {
      // Get round 1 results to know which teams qualified
      const round1Results = await Promise.all(
        teams.map(async (team) => {
          const round1Scores = await prisma.panelistScore.findMany({
            where: {
              teamId: team.id,
              round: 1
            }
          })

          const avgRound1Score = round1Scores.length > 0
            ? round1Scores.reduce((sum, ps) => sum + ps.score, 0) / round1Scores.length
            : 0

          const round1Votes = await prisma.vote.count({
            where: {
              teamId: team.id,
              round: 1
            }
          })

          const round1Total = (avgRound1Score * 0.7) + (round1Votes * 0.3)

          return {
            teamId: team.id,
            totalScore: round1Total
          }
        })
      )

      // Sort round 1 results and get top 6 team IDs
      round1Results.sort((a, b) => b.totalScore - a.totalScore)
      const top6TeamIds = round1Results.slice(0, 6).map(r => r.teamId)

      // Filter current results to only include top 6 teams from round 1
      const filteredResults = rankedResults.filter(r => top6TeamIds.includes(r.id))
      
      // Recalculate ranks for round 2
      const round2Results = filteredResults.map((result, index) => ({
        ...result,
        rank: index + 1
      }))

      return NextResponse.json(round2Results)
    }

    // For round 3, get winners from round 2 (top 3)
    if (round === 3) {
      // First get round 2 results to know the winners
      const round2PanelistScores = await Promise.all(
        teams.map(async (team) => {
          const scores = await prisma.panelistScore.findMany({
            where: {
              teamId: team.id,
              round: 2
            }
          })
          return {
            teamId: team.id,
            scores
          }
        })
      )

      const round2Votes = await Promise.all(
        teams.map(async (team) => {
          const votes = await prisma.vote.count({
            where: {
              teamId: team.id,
              round: 2
            }
          })
          return {
            teamId: team.id,
            votes
          }
        })
      )

      // Calculate round 2 results
      const round2Results = teams.map(team => {
        const panelistScores = round2PanelistScores.find(p => p.teamId === team.id)?.scores || []
        const avgPanelistScore = panelistScores.length > 0
          ? panelistScores.reduce((sum, ps) => sum + ps.score, 0) / panelistScores.length
          : 0
        const audienceVotes = round2Votes.find(v => v.teamId === team.id)?.votes || 0
        
        const panelistWeighted = avgPanelistScore * 0.7
        const audienceWeighted = audienceVotes * 0.3
        const totalScore = panelistWeighted + audienceWeighted

        return {
          id: team.id,
          name: team.name,
          panelistScore: Number(avgPanelistScore.toFixed(2)),
          audienceVotes,
          panelistWeighted: Number(panelistWeighted.toFixed(2)),
          audienceWeighted: Number(audienceWeighted.toFixed(2)),
          totalScore: Number(totalScore.toFixed(2))
        }
      })

      // Sort and get top 3
      round2Results.sort((a, b) => b.totalScore - a.totalScore)
      const top3Winners = round2Results.slice(0, 3).map((result, index) => ({
        ...result,
        rank: index + 1
      }))

      return NextResponse.json(top3Winners)
    }

    // For round 1, return all teams
    return NextResponse.json(rankedResults)

  } catch (error) {
    console.error("Error calculating results:", error)
    return NextResponse.json(
      { error: "Error calculating results" },
      { status: 500 }
    )
  }
}