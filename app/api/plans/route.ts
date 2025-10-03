import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/db'
import { Plan } from '@/lib/models/Plan'
import { Exercise } from '@/lib/models/Exercise'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

const createPlanSchema = z.object({
  name: z.string().min(1),
  sessionsPerWeek: z.number().min(1).max(7),
  schedule: z.object({
    mode: z.enum(['weekday', 'sequence']),
    weekdayMap: z.record(z.string(), z.string()).optional(),
    sequenceOrder: z.array(z.string()).optional(),
  }),
  days: z.array(
    z.object({
      name: z.string(),
      notes: z.string().optional(),
      exercises: z.array(
        z.object({
          exerciseId: z.string(),
          sets: z.number().min(1),
          defaultReps: z.number().min(1).optional(),
          targetWeight: z.number().optional(),
          musclesOverride: z
            .object({
              primary: z.array(z.string()),
              secondary: z.array(z.string()),
            })
            .optional(),
          alternates: z.array(z.string()).optional(),
        })
      ),
    })
  ),
})

// GET /api/plans - List user's plans
async function getPlans(req: AuthenticatedRequest) {
  try {
    await dbConnect()
    
    // Ensure Exercise model is registered
    Exercise

    const plans = await Plan.find({ userId: req.user!.userId })
      .populate('days.exercises.exerciseId', 'name equipment primary_muscles')
      .sort({ isActive: -1, updatedAt: -1 })
      .lean()

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Get plans error:', error)
    return NextResponse.json(
      { error: 'Failed to get plans' },
      { status: 500 }
    )
  }
}

// POST /api/plans - Create new plan
async function createPlan(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const data = createPlanSchema.parse(body)

    await dbConnect()

    // Create the plan first to get day IDs
    const plan = await Plan.create({
      userId: req.user!.userId,
      name: data.name,
      sessionsPerWeek: data.sessionsPerWeek,
      schedule: {
        mode: data.schedule.mode,
        weekdayMap: data.schedule.weekdayMap,
        sequenceOrder: undefined, // Will populate after days are created
      },
      days: data.days,
      isActive: false,
    })

    // If sequence mode, populate sequenceOrder with day IDs
    if (data.schedule.mode === 'sequence' && plan.days.length > 0) {
      plan.schedule.sequenceOrder = plan.days.map(day => day._id)
      await plan.save()
    }

    // If weekday mode and weekdayMap is provided with day names, map to IDs
    if (data.schedule.mode === 'weekday' && data.schedule.weekdayMap) {
      const dayNameToId: Record<string, any> = {}
      plan.days.forEach(day => {
        dayNameToId[day.name] = day._id
      })

      const weekdayMap: any = {}
      Object.entries(data.schedule.weekdayMap).forEach(([weekday, dayName]) => {
        if (dayNameToId[dayName]) {
          weekdayMap[weekday] = dayNameToId[dayName]
        }
      })

      plan.schedule.weekdayMap = weekdayMap
      await plan.save()
    }

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Create plan error:', error)
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getPlans)
export const POST = withAuth(createPlan)

