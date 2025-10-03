import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { WeighIn } from '@/lib/models/WeighIn'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import mongoose from 'mongoose'

// DELETE /api/weighins/:id
async function deleteWeighIn(
  req: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid weigh-in ID' },
        { status: 400 }
      )
    }

    const weighIn = await WeighIn.findOneAndDelete({
      _id: params.id,
      userId: req.user!.userId,
    })

    if (!weighIn) {
      return NextResponse.json(
        { error: 'Weigh-in not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Weigh-in deleted successfully' })
  } catch (error) {
    console.error('Delete weigh-in error:', error)
    return NextResponse.json(
      { error: 'Failed to delete weigh-in' },
      { status: 500 }
    )
  }
}

export const DELETE = withAuth(deleteWeighIn)

