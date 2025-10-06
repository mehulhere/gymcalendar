import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/db'
import { Session } from '@/lib/models/Session'
import { Exercise } from '@/lib/models/Exercise'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { summarizeExerciseDetail } from '@/lib/stats/exercise-performance'

async function getExerciseDetail(
    req: AuthenticatedRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
        return NextResponse.json({ error: 'Invalid exercise id' }, { status: 400 })
    }

    try {
        await dbConnect()

        const exercise = await Exercise.findById(params.id)
            .select('name equipment primary_muscles secondary_muscles youtube_query_override category')
            .lean()

        if (!exercise) {
            return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
        }

        const sessions = await Session.find({
            userId: req.user!.userId,
            status: 'completed',
            'exercises.exerciseId': exercise._id,
        })
            .select('_id date exercises')
            .populate('exercises.exerciseId', 'name equipment primary_muscles secondary_muscles youtube_query_override')
            .sort({ date: -1 })
            .lean()

        const stats = summarizeExerciseDetail(sessions as any, exercise._id.toString())

        const alternativesRaw = await Exercise.find({
            _id: { $ne: exercise._id },
            $or: [
                { primary_muscles: { $in: exercise.primary_muscles } },
                { secondary_muscles: { $in: exercise.primary_muscles } },
            ],
        })
            .select('name equipment primary_muscles secondary_muscles youtube_query_override category')
            .limit(20)
            .lean()

        const targetMuscles = new Set(exercise.primary_muscles.map(m => m.toLowerCase()))

        const alternatives = alternativesRaw
            .map(alt => {
                const primaryMatches = alt.primary_muscles.filter(m => targetMuscles.has(m.toLowerCase())).length
                const secondaryMatches = alt.secondary_muscles.filter(m => targetMuscles.has(m.toLowerCase())).length
                const score = primaryMatches * 2 + secondaryMatches
                return { ...alt, score }
            })
            .filter(alt => alt.score > 0)
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score
                return a.name.localeCompare(b.name)
            })
            .slice(0, 5)
            .map(({ score, ...alt }) => alt)

        const youtubeQuery = exercise.youtube_query_override
            ? exercise.youtube_query_override
            : `${exercise.name} shorts`

        return NextResponse.json({
            exercise: {
                _id: exercise._id.toString(),
                name: exercise.name,
                equipment: exercise.equipment,
                primary_muscles: exercise.primary_muscles,
                secondary_muscles: exercise.secondary_muscles,
                category: exercise.category,
                youtube_query_override: exercise.youtube_query_override,
            },
            stats,
            alternatives: alternatives.map(alt => ({
                _id: alt._id.toString(),
                name: alt.name,
                equipment: alt.equipment,
                primary_muscles: alt.primary_muscles,
                secondary_muscles: alt.secondary_muscles,
                category: alt.category,
                youtube_query_override: alt.youtube_query_override,
            })),
            youtubeQuery,
        })
    } catch (error) {
        console.error('Exercise stats detail error:', error)
        return NextResponse.json({ error: 'Failed to load exercise details' }, { status: 500 })
    }
}

export const GET = withAuth(getExerciseDetail)

