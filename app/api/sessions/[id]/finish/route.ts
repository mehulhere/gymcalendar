import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/db'
import { Session } from '@/lib/models/Session'
import { Attendance } from '@/lib/models/Attendance'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import mongoose from 'mongoose'
import { getStartOfDayUtcForZone } from '@/lib/utils/time'
import { User } from '@/lib/models/User'

const finishSessionSchema = z.object({
  checkIn: z.boolean().default(true),
  makeupForDate: z.string().optional(), // ISO date string
  timeZone: z.string().optional(), // IANA time zone
})

// POST /api/sessions/:id/finish
async function finishSession(
  req: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const body = await req.json()
    const data = finishSessionSchema.parse(body)

    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      )
    }

    const session = await Session.findOne({
      _id: params.id,
      userId: req.user!.userId,
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'Session already completed' },
        { status: 400 }
      )
    }

    // Update session status
    session.status = 'completed'
    session.checkIn = data.checkIn
    session.endedAt = new Date()

    if (data.makeupForDate) {
      session.makeupForDate = new Date(data.makeupForDate)
    }

    await session.save()

    // Respect user setting for auto check-in
    let allowCheckIn = data.checkIn
    try {
      const me = await User.findById(req.user!.userId).select('settings.autoCheckIn')
      if (me && me.settings && me.settings.autoCheckIn === false) {
        allowCheckIn = false
      }
    } catch {}

    // Create or update attendance record
    if (allowCheckIn) {
      const userTz = data.timeZone || 'UTC'
      const sessionDateUtc = getStartOfDayUtcForZone(new Date(session.date), userTz)

      await Attendance.findOneAndUpdate(
        {
          userId: req.user!.userId,
          date: sessionDateUtc,
        },
        {
          $set: {
            status: 'attended',
          },
        },
        { upsert: true }
      )

      // If this is a make-up session, update the missed day
      if (data.makeupForDate) {
        const makeupDateUtc = getStartOfDayUtcForZone(new Date(data.makeupForDate), userTz)

        await Attendance.findOneAndUpdate(
          {
            userId: req.user!.userId,
            date: makeupDateUtc,
          },
          {
            $set: {
              status: 'attended',
              madeUpBySessionId: session._id,
            },
          },
          { upsert: true }
        )
      }
    }

    return NextResponse.json({
      session,
      message: 'Workout completed successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Finish session error:', error)
    return NextResponse.json(
      { error: 'Failed to finish session' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(finishSession)

