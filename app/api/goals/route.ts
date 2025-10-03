import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/db'
import { Goal } from '@/lib/models/Goal'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

const createGoalSchema = z.object({
  targetWeight: z.number().positive(),
  targetDate: z.string(),
})

// GET /api/goals
async function getGoals(req: AuthenticatedRequest) {
  try {
    await dbConnect()

    const goal = await Goal.findOne({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Get goal error:', error)
    return NextResponse.json({ error: 'Failed to get goal' }, { status: 500 })
  }
}

// POST /api/goals
async function createGoal(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const data = createGoalSchema.parse(body)

    await dbConnect()

    const goal = await Goal.create({
      userId: req.user!.userId,
      targetWeight: data.targetWeight,
      targetDate: new Date(data.targetDate),
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Create goal error:', error)
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getGoals)
export const POST = withAuth(createGoal)

