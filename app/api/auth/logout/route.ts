import { NextRequest, NextResponse } from 'next/server'
import { clearRefreshTokenCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    await clearRefreshTokenCookie()
    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


