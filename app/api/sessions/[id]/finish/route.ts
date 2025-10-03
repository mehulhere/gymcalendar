import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/db'
import { Session } from '@/lib/models/Session'
import { Attendance } from '@/lib/models/Attendance'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import mongoose from 'mongoose'

const finishSessionSchema = z.object({
  checkIn: z.boolean().default(true),
  makeupForDate: z.string().optional(), // ISO date string
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

    // Create or update attendance record
    if (data.checkIn) {
      const sessionDate = new Date(session.date)
      sessionDate.setHours(0, 0, 0, 0)

      await Attendance.findOneAndUpdate(
        {
          userId: req.user!.userId,
          date: sessionDate,
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
        const makeupDate = new Date(data.makeupForDate)
        makeupDate.setHours(0, 0, 0, 0)

        await Attendance.findOneAndUpdate(
          {
            userId: req.user!.userId,
            date: makeupDate,
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

