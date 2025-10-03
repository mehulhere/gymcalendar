import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Session } from '@/lib/models/Session'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

// GET /api/sessions - List user's sessions with date range
async function getSessions(req: AuthenticatedRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    await dbConnect()

    const query: any = { userId: req.user!.userId }

    if (from || to) {
      query.date = {}
      if (from) query.date.$gte = new Date(from)
      if (to) query.date.$lte = new Date(to)
    }

    const sessions = await Session.find(query)
      .populate('exercises.exerciseId', 'name equipment')
      .sort({ date: -1 })
      .limit(100)
      .lean()

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to get sessions' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getSessions)

