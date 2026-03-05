import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET current voting status for all rounds - accessible to all authenticated users
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Allow any authenticated user to view voting status
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      )
    }

    let votingControls = []
    
    // Try to get voting controls, handle case when table doesn't exist
    try {
      votingControls = await prisma.votingControl.findMany({
        orderBy: { round: "asc" }
      })
    } catch (dbError) {
      console.error("Database error (table might not exist):", dbError)
      // Return default values if table doesn't exist
      const defaultControls = [
        { round: 1, isActive: false },
        { round: 2, isActive: false },
        { round: 3, isActive: false }
      ]
      
      if (session.user?.role !== "ADMIN") {
        return NextResponse.json(defaultControls)
      }
      // Add null timestamps for admin
      return NextResponse.json(defaultControls.map(c => ({ ...c, startTime: null, endTime: null })))
    }

    // Create default controls for rounds that don't exist
    const rounds = [1, 2, 3]
    const completeControls = rounds.map(round => {
      const existing = votingControls.find(vc => vc.round === round)
      return existing || {
        round,
        isActive: false,
        startTime: null,
        endTime: null
      }
    })

    // For non-admin users, return only necessary fields
    if (session.user?.role !== "ADMIN") {
      const publicControls = completeControls.map(control => ({
        round: control.round,
        isActive: control.isActive
      }))
      return NextResponse.json(publicControls)
    }

    // For admin users, return all data
    return NextResponse.json(completeControls)
  } catch (error) {
    console.error("Error fetching voting controls:", error)
    // Return default values on error
    const defaultControls = [
      { round: 1, isActive: false },
      { round: 2, isActive: false },
      { round: 3, isActive: false }
    ]
    
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(defaultControls)
    }
    return NextResponse.json(defaultControls.map(c => ({ ...c, startTime: null, endTime: null })))
  }
}

// POST update voting status for a round - admin only
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const { round, isActive } = await req.json()

    if (!round || round < 1 || round > 3) {
      return NextResponse.json(
        { error: "Invalid round number" },
        { status: 400 }
      )
    }

    try {
      // Update or create voting control
      const votingControl = await prisma.votingControl.upsert({
        where: { round },
        update: {
          isActive,
          startTime: isActive ? new Date() : null,
          endTime: !isActive ? new Date() : null
        },
        create: {
          round,
          isActive,
          startTime: isActive ? new Date() : null,
          endTime: !isActive ? new Date() : null
        }
      })

      return NextResponse.json(votingControl)
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        { error: "Database error. Please run migrations first." },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error updating voting control:", error)
    return NextResponse.json(
      { error: "Error updating voting control" },
      { status: 500 }
    )
  }
}