import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/db'
import { Plan } from '@/lib/models/Plan'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import mongoose from 'mongoose'

const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  schedule: z
    .object({
      mode: z.enum(['weekday', 'sequence']),
      weekdayMap: z.record(z.string(), z.string()).optional(),
      sequenceOrder: z.array(z.string()).optional(),
    })
    .optional(),
  days: z
    .array(
      z.object({
        _id: z.string().optional(),
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
    )
    .optional(),
})

// GET /api/plans/:id
async function getPlan(
  req: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    const plan = await Plan.findOne({
      _id: params.id,
      userId: req.user!.userId,
    })
      .populate('days.exercises.exerciseId')
      .populate('days.exercises.alternates')
      .lean()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Get plan error:', error)
    return NextResponse.json(
      { error: 'Failed to get plan' },
      { status: 500 }
    )
  }
}

// PUT /api/plans/:id
async function updatePlan(
  req: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const body = await req.json()
    const data = updatePlanSchema.parse(body)

    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    const plan = await Plan.findOneAndUpdate(
      { _id: params.id, userId: req.user!.userId },
      { $set: data },
      { new: true }
    )

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({ plan })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Update plan error:', error)
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    )
  }
}

// DELETE /api/plans/:id
async function deletePlan(
  req: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    const plan = await Plan.findOneAndDelete({
      _id: params.id,
      userId: req.user!.userId,
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Plan deleted successfully' })
  } catch (error) {
    console.error('Delete plan error:', error)
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getPlan)
export const PUT = withAuth(updatePlan)
export const DELETE = withAuth(deletePlan)

