import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const { name, description } = await req.json()
    
    if (!name) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      )
    }

    const team = await prisma.team.update({
      where: { id: params.id },
      data: { 
        name, 
        description: description || null 
      }
    })
    
    return NextResponse.json(team)
  } catch (error) {
    console.error("Error updating team:", error)
    return NextResponse.json(
      { error: "Error updating team" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    // First delete related records (votes and panelist scores)
    await prisma.$transaction([
      prisma.vote.deleteMany({
        where: { teamId: params.id }
      }),
      prisma.panelistScore.deleteMany({
        where: { teamId: params.id }
      }),
      prisma.team.delete({
        where: { id: params.id }
      })
    ])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting team:", error)
    return NextResponse.json(
      { error: "Error deleting team" },
      { status: 500 }
    )
  }
}