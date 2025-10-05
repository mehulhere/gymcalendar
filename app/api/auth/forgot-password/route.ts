import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import dbConnect from '@/lib/db'
import { User } from '@/lib/models/User'
import { sendEmail, generatePasswordResetEmail } from '@/lib/email'

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = forgotPasswordSchema.parse(body)

    await dbConnect()

    // Find user by email
    const user = await User.findOne({ email, provider: 'credentials' })

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Save reset token to user
    user.passwordResetToken = resetToken
    user.passwordResetExpires = resetExpires
    await user.save()

    // Send email
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`
    const emailContent = generatePasswordResetEmail(user.name, resetUrl)

    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Password Reset - GymCalender',
      html: emailContent.html,
      text: emailContent.text,
    })

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send password reset email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
