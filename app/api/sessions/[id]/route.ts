import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/db'
import { Session } from '@/lib/models/Session'
import { Exercise } from '@/lib/models/Exercise'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { calculateSessionVolume, ExerciseVolume } from '@/lib/volume'
import mongoose from 'mongoose'

const updateSessionSchema = z.object({
  exercises: z.array(
    z.object({
      exerciseId: z.string(),
      altOfExerciseId: z.string().optional(),
      sets: z.array(
        z.object({
          reps: z.number().min(0),
          weight: z.number().min(0),
          rpe: z.number().min(1).max(10).optional(),
        })
      ),
      notes: z.string().optional(),
    })
  ),
})

// GET /api/sessions/:id
async function getSession(
  req: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
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
      .populate('exercises.exerciseId')
      .lean()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    )
  }
}

// PUT /api/sessions/:id - Update session (for auto-save during workout)
async function updateSession(
  req: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const body = await req.json()
    const data = updateSessionSchema.parse(body)

    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      )
    }

    // Calculate total volume
    const exerciseVolumes: ExerciseVolume[] = []
    for (const exercise of data.exercises) {
      const exerciseDoc = await Exercise.findById(exercise.exerciseId)
      if (exerciseDoc) {
        exerciseVolumes.push({
          exerciseId: exercise.exerciseId,
          sets: exercise.sets,
          muscles: [
            ...exerciseDoc.primary_muscles.map((m) => ({
              muscle: m,
              factor: 1.0,
            })),
            ...exerciseDoc.secondary_muscles.map((m) => ({
              muscle: m,
              factor: 0.5,
            })),
          ],
        })
      }
    }

    const totalVolume = calculateSessionVolume(exerciseVolumes)

    const session = await Session.findOneAndUpdate(
      { _id: params.id, userId: req.user!.userId },
      {
        $set: {
          exercises: data.exercises,
          totalVolume,
        },
      },
      { new: true }
    )

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Update session error:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getSession)
export const PUT = withAuth(updateSession)

