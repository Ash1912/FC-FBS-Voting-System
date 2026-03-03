import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route" // Import authOptions

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { name: "asc" }
    })
    return NextResponse.json(teams)
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json(
      { error: "Error fetching teams" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    // Get session with authOptions
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const { name, description } = await req.json()
    
    // Validate input
    if (!name) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      )
    }

    const team = await prisma.team.create({
      data: { 
        name, 
        description: description || null 
      }
    })
    
    return NextResponse.json(team)
  } catch (error) {
    console.error("Error creating team:", error)
    return NextResponse.json(
      { error: "Error creating team" },
      { status: 500 }
    )
  }
}