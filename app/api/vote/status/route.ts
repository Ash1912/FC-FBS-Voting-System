import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const round = parseInt(searchParams.get("round") || "1")

    if (round < 1 || round > 3) {
      return NextResponse.json(
        { error: "Invalid round number" },
        { status: 400 }
      )
    }

    const vote = await prisma.vote.findFirst({
      where: {
        userId: session.user.id,
        round: round
      }
    })

    return NextResponse.json({ 
      hasVoted: !!vote,
      round: round 
    })

  } catch (error) {
    console.error("Error checking vote status:", error)
    return NextResponse.json(
      { error: "Failed to check vote status" },
      { status: 500 }
    )
  }
}