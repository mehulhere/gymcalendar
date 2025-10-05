import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
    })
    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error }
  }
}

export function generatePasswordResetEmail(name: string, resetUrl: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>You have requested to reset your password for your GymCalender account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
      </div>
      <p>If you didn't request this password reset, you can safely ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
      <p>Best regards,<br>The GymCalender Team</p>
    </div>
  `

  const text = `
    Password Reset Request

    Hello ${name},

    You have requested to reset your password for your GymCalender account.

    Click the following link to reset your password:
    ${resetUrl}

    If you didn't request this password reset, you can safely ignore this email.

    This link will expire in 1 hour.

    Best regards,
    The GymCalender Team
  `

  return { html, text }
}
