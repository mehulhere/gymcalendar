import { NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/db'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { Session } from '@/lib/models/Session'
import { Plan } from '@/lib/models/Plan'
import { Exercise } from '@/lib/models/Exercise'
import { Types } from 'mongoose'

const bodySchema = z.object({
  exerciseIndex: z.number().int().min(0),
})

// POST /api/sessions/:id/alternate
async function switchAlternate(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { exerciseIndex } = bodySchema.parse(body)

    await dbConnect()

    // Load session and ensure ownership
    const session = await Session.findOne({ _id: params.id, userId: req.user!.userId }).populate('exercises.exerciseId', 'name primary_muscles equipment')
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (!session.exercises[exerciseIndex]) {
      return NextResponse.json({ error: 'Invalid exercise index' }, { status: 400 })
    }

    const current = session.exercises[exerciseIndex]
    const currentExercise: any = current.exerciseId

    // Get alternates from the plan/day definition if possible (ordered)
    let alternates: any[] = []
    if (session.planId && session.planDayId) {
      const plan = await Plan.findOne({ _id: session.planId, userId: req.user!.userId }).populate('days.exercises.exerciseId', 'name').populate('days.exercises.alternates', 'name')
      const day = plan?.days?.find((d: any) => d._id?.toString() === session.planDayId?.toString())
      const planExercise = day?.exercises?.[exerciseIndex]
      alternates = planExercise?.alternates || []
    }

    // Build pool of plan-defined alternates + original and choose randomly (excluding current)
    const originalId = current.altOfExerciseId?.toString() || currentExercise._id.toString()
    const poolIds: string[] = [originalId, ...alternates.map((a: any) => a._id.toString())]
    const currentId = currentExercise._id.toString()

    let nextExerciseId: string | null = null
    if (poolIds.length > 1) {
      const candidates = poolIds.filter((id) => id !== currentId && id !== originalId)
      if (candidates.length > 0) {
        nextExerciseId = candidates[Math.floor(Math.random() * candidates.length)]
      }
    }

    // If no more plan alternates or none configured, auto-suggest by primary muscles
    if (!nextExerciseId) {
      // Exclude everything in the pool and the current exercise to avoid repeats
      const exclude = Array.from(new Set([...poolIds, currentId]))
      const muscles: string[] = currentExercise.primary_muscles || []
      // Try random pick by primary muscles
      let suggestionArr = await Exercise.aggregate([
        { $match: { _id: { $nin: exclude.map((id) => new Types.ObjectId(id)) }, primary_muscles: { $in: muscles } } },
        { $sample: { size: 1 } },
        { $project: { _id: 1, name: 1, primary_muscles: 1, equipment: 1 } }
      ])
      if (suggestionArr.length === 0) {
        // Fallback: allow secondary muscles too
        suggestionArr = await Exercise.aggregate([
          { $match: { _id: { $nin: exclude.map((id) => new Types.ObjectId(id)) }, secondary_muscles: { $in: muscles } } },
          { $sample: { size: 1 } },
          { $project: { _id: 1, name: 1, primary_muscles: 1, equipment: 1 } }
        ])
      }
      const suggestion: any = suggestionArr[0]
      if (!suggestion) {
        return NextResponse.json({ error: 'No suitable alternate found' }, { status: 404 })
      }
      nextExerciseId = suggestion._id.toString()
      // Assign suggested exercise
      current.exerciseId = suggestion._id
    } else {
      // Use plan-defined next alternate
      current.exerciseId = nextExerciseId
    }

    // Preserve original
    if (!current.altOfExerciseId) {
      current.altOfExerciseId = originalId
    }

    await session.save()
    await session.populate('exercises.exerciseId', 'name equipment primary_muscles')

    return NextResponse.json({ exercise: session.exercises[exerciseIndex] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 })
    }
    console.error('Alternate switch error:', error)
    return NextResponse.json({ error: 'Failed to switch alternate' }, { status: 500 })
  }
}

export const POST = withAuth(switchAlternate)
