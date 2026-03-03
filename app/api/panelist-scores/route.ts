import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

// GET existing scores for a round
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const round = parseInt(searchParams.get("round") || "1")

    const scores = await prisma.panelistScore.findMany({
      where: { round },
      include: {
        team: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json(scores)
  } catch (error) {
    console.error("Error fetching scores:", error)
    return NextResponse.json(
      { error: "Error fetching scores" },
      { status: 500 }
    )
  }
}

// POST save panelist scores for a round
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { round, scores } = await req.json()

    if (!round || !scores || !Array.isArray(scores)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      )
    }

    // Delete existing scores for this round
    await prisma.panelistScore.deleteMany({
      where: { round }
    })

    // Create new scores
    const createdScores = await prisma.$transaction(
      scores.map((score: { teamId: string; score: number }) =>
        prisma.panelistScore.create({
          data: {
            teamId: score.teamId,
            panelistId: session.user.id, // Store which admin entered the scores
            round,
            score: score.score
          }
        })
      )
    )

    return NextResponse.json({ 
      success: true, 
      message: "Scores saved successfully",
      count: createdScores.length 
    })
  } catch (error) {
    console.error("Error saving scores:", error)
    return NextResponse.json(
      { error: "Error saving scores" },
      { status: 500 }
    )
  }
}