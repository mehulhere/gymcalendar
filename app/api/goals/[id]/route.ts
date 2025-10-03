import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/db'
import { Goal } from '@/lib/models/Goal'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import mongoose from 'mongoose'

const updateGoalSchema = z.object({
  targetWeight: z.number().positive().optional(),
  targetDate: z.string().optional(),
})

// PUT /api/goals/:id
async function updateGoal(
  req: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const body = await req.json()
    const data = updateGoalSchema.parse(body)

    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid goal ID' }, { status: 400 })
    }

    const updateData: any = {}
    if (data.targetWeight) updateData.targetWeight = data.targetWeight
    if (data.targetDate) updateData.targetDate = new Date(data.targetDate)

    const goal = await Goal.findOneAndUpdate(
      { _id: params.id, userId: req.user!.userId },
      { $set: updateData },
      { new: true }
    )

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    return NextResponse.json({ goal })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Update goal error:', error)
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    )
  }
}

export const PUT = withAuth(updateGoal)

