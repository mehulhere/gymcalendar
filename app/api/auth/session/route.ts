import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { User } from '@/lib/models/User'
import { generateAccessToken, getRefreshTokenFromCookie, verifyRefreshToken } from '@/lib/auth'

export async function GET() {
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

    await dbConnect()

    const user = await User.findById(payload.userId).lean()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
    })

    return NextResponse.json({
      accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        settings: user.settings,
      },
    })
  } catch (error) {
    console.error('Session retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

