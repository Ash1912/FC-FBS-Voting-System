import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// List of admin email addresses
const ADMIN_EMAILS = [
  "27ashish.mishra@fostiima.org",
  "27shagun.malhotra@fostiima.org"
]

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate fostiima email
    if (!email.endsWith("@fostiima.org")) {
      return NextResponse.json(
        { message: "Please use your fostiima.org email address" },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      )
    }

    // Determine role based on email
    const role = ADMIN_EMAILS.includes(email) ? "ADMIN" : "AUDIENCE"

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role
      }
    })

    // Don't send password back
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { 
        message: role === "ADMIN" 
          ? "Admin account created successfully" 
          : "Audience account created successfully. You can now vote!",
        user: userWithoutPassword 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    )
  }
}