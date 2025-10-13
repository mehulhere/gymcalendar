import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Attendance } from '@/lib/models/Attendance'
import { Session } from '@/lib/models/Session'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

// POST /api/attendance/reset - delete all attendance records for current user
async function resetAttendance(req: AuthenticatedRequest) {
  try {
    await dbConnect()
    await Attendance.deleteMany({ userId: req.user!.userId })
    await Session.updateMany({ userId: req.user!.userId }, { $set: { checkIn: false }, $unset: { madeUpBySessionId: 1 } })
    return NextResponse.json({ ok: true, deleted: true })
  } catch (error) {
    console.error('Reset attendance error:', error)
    return NextResponse.json({ error: 'Failed to reset attendance' }, { status: 500 })
  }
}

export const POST = withAuth(resetAttendance)


