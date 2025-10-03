import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, JWTPayload } from './auth'

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export function withAuth<T = any>(
  handler: (req: AuthenticatedRequest, context?: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: T) => {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const authenticatedReq = req as AuthenticatedRequest
    authenticatedReq.user = payload

    return handler(authenticatedReq, context)
  }
}

