import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is logged in
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in to vote" },
        { status: 401 }
      )
    }

    // Check if user is audience (admins cannot vote)
    if (session.user?.role === "ADMIN") {
      return NextResponse.json(
        { error: "Admins cannot vote" },
        { status: 403 }
      )
    }

    const { teamId, round } = await req.json()

    // Validate input
    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      )
    }

    if (!round || round < 1 || round > 3) {
      return NextResponse.json(
        { error: "Valid round number (1-3) is required" },
        { status: 400 }
      )
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    })

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      )
    }

    // Check if user has already voted in this round
    const existingVote = await prisma.vote.findFirst({
      where: {
        userId: session.user.id,
        round: round
      }
    })

    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted in this round" },
        { status: 400 }
      )
    }

    // Create vote
    const vote = await prisma.vote.create({
      data: {
        userId: session.user.id,
        teamId: teamId,
        round: round
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Vote cast successfully!",
      vote 
    })

  } catch (error) {
    console.error("Error casting vote:", error)
    return NextResponse.json(
      { error: "Failed to cast vote. Please try again." },
      { status: 500 }
    )
  }
}