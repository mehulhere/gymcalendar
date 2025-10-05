import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import dbConnect from '@/lib/db'
import { User } from '@/lib/models/User'
import { generateAccessToken, generateRefreshToken, setRefreshTokenCookie } from '@/lib/auth'

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const envAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
const defaultAppUrl = 'http://localhost:3000'
const appUrl = envAppUrl || defaultAppUrl
const googleRedirectUri = `${appUrl}/api/auth/google`

const buildRedirectUrl = (req: NextRequest, pathname: string) => {
  const baseUrl = envAppUrl || req.nextUrl.origin
  return new URL(pathname, baseUrl)
}

export async function GET(req: NextRequest) {
  try {
    if (!googleClientId || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth environment variables are not configured')
      return NextResponse.redirect(buildRedirectUrl(req, '/auth/login?error=oauth_config'))
    }

    const googleClient = new OAuth2Client(
      googleClientId,
      process.env.GOOGLE_CLIENT_SECRET,
      googleRedirectUri
    )

    const url = new URL(req.url)
    const code = url.searchParams.get('code')

    if (!code) {
      return NextResponse.redirect(buildRedirectUrl(req, '/auth/login?error=missing_code'))
    }

    // Exchange code for tokens
    const { tokens } = await googleClient.getToken({ code, redirect_uri: googleRedirectUri })
    googleClient.setCredentials(tokens)

    // Get user info from Google
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: googleClientId,
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return NextResponse.redirect(buildRedirectUrl(req, '/auth/login?error=invalid_token'))
    }

    const { email, name, picture, sub: providerId } = payload

    if (!email || !name || !providerId) {
      return NextResponse.redirect(buildRedirectUrl(req, '/auth/login?error=missing_user_info'))
    }

    await dbConnect()

    // Check if user exists
    let user = await User.findOne({ email })

    if (user) {
      // Update existing user with OAuth info if they don't have it
      if (user.provider !== 'google' || !user.providerId) {
        user.provider = 'google'
        user.providerId = providerId
        user.image = picture || user.image
        await user.save()
      }
    } else {
      // Create new user
      user = await User.create({
        email,
        name,
        image: picture,
        provider: 'google',
        providerId,
        settings: {
          unit: 'kg',
          timezone: 'UTC',
          equipment: [],
          theme: 'dark',
        },
      })
    }

    // Generate tokens
    const jwtPayload = { userId: user._id.toString(), email: user.email }
    const accessToken = generateAccessToken(jwtPayload)
    const refreshToken = generateRefreshToken(jwtPayload)

    // Set refresh token cookie
    await setRefreshTokenCookie(refreshToken)

    // Redirect to home page with success
    return NextResponse.redirect(buildRedirectUrl(req, '/'))
  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(buildRedirectUrl(req, '/auth/login?error=oauth_failed'))
  }
}
