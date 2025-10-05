import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/db'
import { User } from '@/lib/models/User'
import { hashPassword, generateAccessToken, generateRefreshToken, setRefreshTokenCookie } from '@/lib/auth'

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = resetPasswordSchema.parse(body)

    await dbConnect()

    // Find user by reset token and check if token is still valid
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
      provider: 'credentials'
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash new password
    const password_hash = await hashPassword(password)

    // Update user password and clear reset token
    user.password_hash = password_hash
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    // Generate new tokens
    const jwtPayload = { userId: user._id.toString(), email: user.email }
    const accessToken = generateAccessToken(jwtPayload)
    const refreshToken = generateRefreshToken(jwtPayload)

    // Set refresh token cookie
    await setRefreshTokenCookie(refreshToken)

    return NextResponse.json({
      message: 'Password reset successfully',
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

    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
