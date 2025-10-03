import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/db'
import { User } from '@/lib/models/User'
import { verifyPassword, generateAccessToken, generateRefreshToken, setRefreshTokenCookie } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = loginSchema.parse(body)

    await dbConnect()

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate tokens
    const payload = { userId: user._id.toString(), email: user.email }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    // Set refresh token cookie
    await setRefreshTokenCookie(refreshToken)

    return NextResponse.json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        settings: user.settings,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

