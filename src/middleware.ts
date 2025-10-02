import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // No authentication middleware needed for admin-only site
  return NextResponse.next()
}

export const config = {
  matcher: []
}


