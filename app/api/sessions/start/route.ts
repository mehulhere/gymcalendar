import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/db'
import { Session } from '@/lib/models/Session'
import { Plan } from '@/lib/models/Plan'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { getStartOfDayUtcForZone } from '@/lib/utils/time'

const startSessionSchema = z.object({
  planId: z.string().optional(),
  planDayId: z.string().optional(),
  date: z.string().optional(), // ISO date string
  timeZone: z.string().optional(), // IANA time zone
})

// POST /api/sessions/start
async function startSession(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const data = startSessionSchema.parse(body)

    await dbConnect()

    // If planId provided, verify it belongs to user and get exercises
    let planDayData = null
    if (data.planId && data.planDayId) {
      const plan = await Plan.findOne({
        _id: data.planId,
        userId: req.user!.userId,
      })

      if (!plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      }

      planDayData = plan.days.find(
        (day) => day._id.toString() === data.planDayId
      )

      if (!planDayData) {
        return NextResponse.json(
          { error: 'Plan day not found' },
          { status: 404 }
        )
      }
    }

    const userTz = data.timeZone || 'UTC'
    const chosenDate = data.date ? new Date(data.date) : new Date()
    const sessionDateUtc = getStartOfDayUtcForZone(chosenDate, userTz)

    const session = await Session.create({
      userId: req.user!.userId,
      date: sessionDateUtc,
      planId: data.planId,
      planDayId: data.planDayId,
      status: 'in_progress',
      checkIn: false,
      startedAt: new Date(),
      exercises: planDayData
        ? planDayData.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            sets: Array(ex.sets).fill({ reps: 0, weight: 0 }),
            notes: '',
          }))
        : [],
      totalVolume: 0,
    })

    // Populate exercise details
    await session.populate('exercises.exerciseId', 'name equipment primary_muscles')

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Start session error:', error)
    return NextResponse.json(
      { error: 'Failed to start session' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(startSession)

