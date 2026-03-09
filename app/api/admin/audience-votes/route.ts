import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const round = searchParams.get("round")
    const pgp = searchParams.get("pgp")
    const section = searchParams.get("section")
    const search = searchParams.get("search")

    // Build where clause based on filters
    const whereClause: any = {}
    
    // Round filter
    if (round && round !== "all") {
      whereClause.round = parseInt(round)
    }

    // User filters
    const userWhereClause: any = {}
    
    if (pgp && pgp !== "all") {
      userWhereClause.pgp = pgp
    }
    
    if (section && section !== "all") {
      userWhereClause.section = section
    }
    
    if (search) {
      userWhereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Only add user filter if any user filters are applied
    if (Object.keys(userWhereClause).length > 0) {
      whereClause.user = userWhereClause
    }

    // Get all votes with user and team details
    const votes = await prisma.vote.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            pgp: true,
            section: true,
            role: true,
            createdAt: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { round: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Get voting control data for timestamps
    const votingControls = await prisma.votingControl.findMany({
      where: {
        round: round && round !== "all" ? parseInt(round) : undefined
      }
    })

    // Create a map of round to voting control
    const votingControlMap = new Map()
    votingControls.forEach(vc => {
      votingControlMap.set(vc.round, vc)
    })

    // Get unique PGP and section values for filters
    const uniquePgps = await prisma.user.findMany({
      where: {
        pgp: { not: null }
      },
      select: {
        pgp: true
      },
      distinct: ['pgp']
    })

    const uniqueSections = await prisma.user.findMany({
      where: {
        section: { not: null }
      },
      select: {
        section: true
      },
      distinct: ['section']
    })

    // Format the response
    const formattedVotes = votes.map(vote => ({
      id: vote.id,
      round: vote.round,
      votedAt: vote.createdAt,
      voter: {
        id: vote.user.id,
        name: vote.user.name || 'Anonymous',
        email: vote.user.email,
        pgp: vote.user.pgp || null,
        section: vote.user.section || null,
        role: vote.user.role,
        registeredAt: vote.user.createdAt
      },
      team: {
        id: vote.team.id,
        name: vote.team.name
      },
      votingSession: votingControlMap.get(vote.round) ? {
        startTime: votingControlMap.get(vote.round).startTime,
        endTime: votingControlMap.get(vote.round).endTime,
        wasActive: votingControlMap.get(vote.round).isActive
      } : null
    }))

    // Get summary statistics
    const summary = {
      totalVotes: votes.length,
      uniqueVoters: new Set(votes.map(v => v.user.id)).size,
      votesPerRound: {} as Record<number, number>,
      votersPerRound: {} as Record<number, number>,
      votesPerPgp: {} as Record<string, number>,
      votesPerSection: {} as Record<string, number>
    }

    votes.forEach(vote => {
      // Count votes per round
      summary.votesPerRound[vote.round] = (summary.votesPerRound[vote.round] || 0) + 1
      
      // Count votes per PGP
      if (vote.user.pgp) {
        summary.votesPerPgp[vote.user.pgp] = (summary.votesPerPgp[vote.user.pgp] || 0) + 1
      }
      
      // Count votes per Section
      if (vote.user.section) {
        summary.votesPerSection[vote.user.section] = (summary.votesPerSection[vote.user.section] || 0) + 1
      }
    })

    // Count unique voters per round
    const votersByRound: Record<number, Set<string>> = {}
    votes.forEach(vote => {
      if (!votersByRound[vote.round]) {
        votersByRound[vote.round] = new Set()
      }
      votersByRound[vote.round].add(vote.user.id)
    })

    Object.entries(votersByRound).forEach(([round, voters]) => {
      summary.votersPerRound[parseInt(round)] = voters.size
    })

    // Prepare filter options
    const filterOptions = {
      pgps: uniquePgps.map(p => p.pgp).filter(Boolean),
      sections: uniqueSections.map(s => s.section).filter(Boolean),
      rounds: [1, 2, 3]
    }

    return NextResponse.json({
      votes: formattedVotes,
      summary,
      filters: {
        round: round || 'all',
        pgp: pgp || 'all',
        section: section || 'all',
        search: search || ''
      },
      filterOptions
    })
  } catch (error) {
    console.error("Error fetching audience votes:", error)
    return NextResponse.json(
      { error: "Error fetching audience votes" },
      { status: 500 }
    )
  }
}