import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/db'
import { Attendance } from '@/lib/models/Attendance'
import { Session } from '@/lib/models/Session'
import { Plan } from '@/lib/models/Plan'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns'

const makeupSchema = z.object({
  sessionId: z.string(),
  missedDate: z.string().optional(), // If not provided, auto-select earliest missed day
})

// POST /api/attendance/makeup
async function assignMakeup(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const data = makeupSchema.parse(body)

    await dbConnect()

    const session = await Session.findOne({
      _id: data.sessionId,
      userId: req.user!.userId,
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const sessionDate = new Date(session.date)
    sessionDate.setHours(0, 0, 0, 0)

    // Get current week and next week range
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
    const nextWeekEnd = endOfWeek(addWeeks(currentWeekStart, 1), {
      weekStartsOn: 1,
    })

    let missedDate: Date

    if (data.missedDate) {
      missedDate = new Date(data.missedDate)
      missedDate.setHours(0, 0, 0, 0)

      // Validate make-up window (current week and next week only)
      if (missedDate < currentWeekStart || missedDate > nextWeekEnd) {
        return NextResponse.json(
          {
            error:
              'Make-ups only allowed for current week and next week',
          },
          { status: 400 }
        )
      }
    } else {
      // Auto-select earliest missed day in the allowed window
      const activePlan = await Plan.findOne({
        userId: req.user!.userId,
        isActive: true,
      })

      if (!activePlan) {
        return NextResponse.json(
          { error: 'No active plan found' },
          { status: 400 }
        )
      }

      // Find all missed days in the make-up window
      const missedDays = await Attendance.find({
        userId: req.user!.userId,
        date: {
          $gte: currentWeekStart,
          $lte: nextWeekEnd,
        },
        status: 'missed',
      })
        .sort({ date: 1 })
        .lean()

      if (missedDays.length === 0) {
        return NextResponse.json(
          { error: 'No missed days found in make-up window' },
          { status: 400 }
        )
      }

      missedDate = new Date(missedDays[0].date)
    }

    // Update session with make-up reference
    session.makeupForDate = missedDate
    await session.save()

    // Update missed day attendance
    await Attendance.findOneAndUpdate(
      {
        userId: req.user!.userId,
        date: missedDate,
      },
      {
        $set: {
          status: 'attended',
          madeUpBySessionId: session._id,
        },
      },
      { upsert: true }
    )

    return NextResponse.json({
      session,
      missedDate: format(missedDate, 'yyyy-MM-dd'),
      message: 'Make-up assigned successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Assign make-up error:', error)
    return NextResponse.json(
      { error: 'Failed to assign make-up' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(assignMakeup)

