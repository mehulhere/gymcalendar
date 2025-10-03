import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, generateAccessToken, getRefreshTokenFromCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const refreshToken = await getRefreshTokenFromCookie()

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      )
    }

    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    })

    return NextResponse.json({ accessToken })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


