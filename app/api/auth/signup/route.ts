import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/db'
import { User } from '@/lib/models/User'
import { hashPassword, generateAccessToken, generateRefreshToken, setRefreshTokenCookie } from '@/lib/auth'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name } = signupSchema.parse(body)

    await dbConnect()

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password and create user
    const password_hash = await hashPassword(password)
    const user = await User.create({
      email,
      password_hash,
      name,
      settings: {
        unit: 'kg',
        timezone: 'UTC',
        equipment: [],
        theme: 'dark',
      },
    })

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
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

