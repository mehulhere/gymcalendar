import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Plan } from '@/lib/models/Plan'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import mongoose from 'mongoose'

// POST /api/plans/:id/activate - Set plan as active (deactivate others)
async function activatePlan(
  req: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    // Deactivate all user's plans
    await Plan.updateMany(
      { userId: req.user!.userId },
      { $set: { isActive: false } }
    )

    // Activate the selected plan
    const plan = await Plan.findOneAndUpdate(
      { _id: params.id, userId: req.user!.userId },
      { $set: { isActive: true } },
      { new: true }
    )

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({ plan, message: 'Plan activated successfully' })
  } catch (error) {
    console.error('Activate plan error:', error)
    return NextResponse.json(
      { error: 'Failed to activate plan' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(activatePlan)

