import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/db'
import { Attendance } from '@/lib/models/Attendance'
import { Session } from '@/lib/models/Session'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { getStartOfDayUtcForZone } from '@/lib/utils/time'

const checkinSchema = z.object({
  date: z.string(), // ISO date string
  timeZone: z.string().optional(), // IANA time zone
})

// POST /api/attendance/checkin - Manual check-in without session
async function checkin(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const data = checkinSchema.parse(body)

    await dbConnect()

    // Normalize to the user's local day start and store as UTC timestamp
    const userTz = data.timeZone || 'UTC'
    const inputDate = new Date(data.date)
    const startOfUserDayUtc = getStartOfDayUtcForZone(inputDate, userTz)

    // Check if already checked in
    const existing = await Attendance.findOne({
      userId: req.user!.userId,
      date: startOfUserDayUtc,
    })

    if (existing && existing.status === 'attended') {
      return NextResponse.json(
        { error: 'Already checked in for this date' },
        { status: 400 }
      )
    }

    // Check how many sessions already completed today
    const sessionsToday = await Session.countDocuments({
      userId: req.user!.userId,
      date: {
        $gte: startOfUserDayUtc,
        $lt: new Date(startOfUserDayUtc.getTime() + 24 * 60 * 60 * 1000),
      },
      status: 'completed',
      checkIn: true,
    })

    // If this is an extra session (4th workout when target is 3), suggest make-up
    const suggestMakeup = sessionsToday > 3 // This should be based on user's weekly target

    // Create or update attendance
    const attendance = await Attendance.findOneAndUpdate(
      {
        userId: req.user!.userId,
        date: startOfUserDayUtc,
      },
      {
        $set: {
          status: 'attended',
        },
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({
      attendance,
      suggestMakeup,
      message: 'Checked in successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Check-in error:', error)
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 })
  }
}

export const POST = withAuth(checkin)

