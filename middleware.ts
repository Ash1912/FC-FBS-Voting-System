import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === "ADMIN"
    const path = req.nextUrl.pathname

    // Admin routes - only for admin users
    if (path.startsWith("/admin")) {
      if (!isAdmin) {
        // Redirect non-admin users to home page
        return NextResponse.redirect(new URL("/", req.url))
      }
      return NextResponse.next()
    }

    // Voting page - accessible to ALL authenticated users
    if (path.startsWith("/vote")) {
      // Any logged-in user can vote
      return NextResponse.next()
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token // User must be logged in
    }
  }
)

export const config = {
  matcher: ["/admin/:path*", "/vote/:path*"]
}