import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Exercise } from '@/lib/models/Exercise'
import mongoose from 'mongoose'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid exercise ID' },
        { status: 400 }
      )
    }

    const exercise = await Exercise.findById(params.id).lean()

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ exercise })
  } catch (error) {
    console.error('Get exercise error:', error)
    return NextResponse.json(
      { error: 'Failed to get exercise' },
      { status: 500 }
    )
  }
}

