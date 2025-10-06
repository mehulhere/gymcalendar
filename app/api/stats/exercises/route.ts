import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Session } from '@/lib/models/Session'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { summarizeExercises } from '@/lib/stats/exercise-performance'

async function getExerciseSummaries(req: AuthenticatedRequest) {
    try {
        const searchParams = req.nextUrl.searchParams
        const query = searchParams.get('q')?.trim().toLowerCase()

        await dbConnect()

        const sessions = await Session.find({
            userId: req.user!.userId,
            status: 'completed',
        })
            .populate('exercises.exerciseId', 'name equipment primary_muscles secondary_muscles youtube_query_override')
            .sort({ date: -1 })
            .lean()

        let summaries = summarizeExercises(sessions as any)

        if (query && query.length > 0) {
            summaries = summaries.filter(summary => {
                const nameMatch = summary.name.toLowerCase().includes(query)
                const primaryMatch = summary.primaryMuscles.some(muscle => muscle.toLowerCase().includes(query))
                const secondaryMatch = summary.secondaryMuscles.some(muscle => muscle.toLowerCase().includes(query))
                return nameMatch || primaryMatch || secondaryMatch
            })
        }

        summaries.sort((a, b) => {
            const aDate = a.lastPerformedAt ? new Date(a.lastPerformedAt).getTime() : 0
            const bDate = b.lastPerformedAt ? new Date(b.lastPerformedAt).getTime() : 0
            if (bDate !== aDate) {
                return bDate - aDate
            }
            return a.name.localeCompare(b.name)
        })

        return NextResponse.json({ exercises: summaries })
    } catch (error) {
        console.error('Exercise stats summary error:', error)
        return NextResponse.json({ error: 'Failed to load exercise stats' }, { status: 500 })
    }
}

export const GET = withAuth(getExerciseSummaries)

