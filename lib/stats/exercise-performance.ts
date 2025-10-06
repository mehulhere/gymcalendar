import { Types } from 'mongoose'

interface SessionSet {
    reps: number
    weight: number
}

interface PopulatedExerciseDoc {
    _id: Types.ObjectId | string
    name: string
    equipment?: string
    primary_muscles: string[]
    secondary_muscles: string[]
    youtube_query_override?: string
}

interface PopulatedSessionExercise {
    exerciseId?: PopulatedExerciseDoc | null
    sets?: SessionSet[]
}

interface PopulatedSession {
    _id: Types.ObjectId | string
    date: Date | string
    exercises?: PopulatedSessionExercise[]
}

export interface BestSetRecord {
    weight: number
    reps: number
    volume: number
    date: string
}

export interface ExerciseSummary {
    exerciseId: string
    name: string
    equipment?: string
    primaryMuscles: string[]
    secondaryMuscles: string[]
    lastPerformedAt: string | null
    totalSessions: number
    totalSets: number
    personalBest: BestSetRecord | null
}

export interface ExerciseDetailStats {
    exerciseId: string
    personalBest: BestSetRecord | null
    best1M: BestSetRecord | null
    best3M: BestSetRecord | null
    best1Y: BestSetRecord | null
    volumeByDate: Array<{ date: string; peakVolume: number }>
    totalSessions: number
    totalSets: number
    lastPerformedAt: string | null
}

interface MutableSummary {
    exerciseId: string
    name: string
    equipment?: string
    primaryMuscles: string[]
    secondaryMuscles: string[]
    lastPerformedAt: string | null
    totalSets: number
    sessionIds: Set<string>
    personalBest: BestSetRecord | null
}

function isValidSet(set: SessionSet | undefined): set is SessionSet {
    return !!set && typeof set.reps === 'number' && typeof set.weight === 'number' && set.reps > 0 && set.weight > 0
}

function toObjectIdString(id: Types.ObjectId | string | undefined): string | null {
    if (!id) return null
    if (typeof id === 'string') return id
    return id.toString()
}

function toISO(date: Date): string {
    return date.toISOString()
}

function toDateOnlyKey(date: Date): string {
    return date.toISOString().split('T')[0]
}

function buildBestRecord(set: SessionSet, sessionDate: Date): BestSetRecord {
    return {
        weight: set.weight,
        reps: set.reps,
        volume: set.weight * set.reps,
        date: toISO(sessionDate),
    }
}

function isBetterRecord(candidate: BestSetRecord, current: BestSetRecord | null): boolean {
    if (!current) return true
    if (candidate.weight > current.weight) return true
    if (candidate.weight < current.weight) return false

    if (candidate.volume > current.volume) return true
    if (candidate.volume < current.volume) return false

    return new Date(candidate.date).getTime() > new Date(current.date).getTime()
}

export function summarizeExercises(sessions: PopulatedSession[]): ExerciseSummary[] {
    const summaryMap = new Map<string, MutableSummary>()

    for (const session of sessions) {
        const sessionDate = new Date(session.date)
        const sessionId = toObjectIdString(session._id)
        if (!session.exercises || !sessionId) continue

        for (const exercise of session.exercises) {
            const exerciseDoc = exercise.exerciseId
            if (!exerciseDoc || !exercise.sets) continue
            const exerciseId = toObjectIdString(exerciseDoc._id)
            if (!exerciseId) continue

            let validSetCount = 0
            let summary = summaryMap.get(exerciseId)

            if (!summary) {
                summary = {
                    exerciseId,
                    name: exerciseDoc.name,
                    equipment: exerciseDoc.equipment,
                    primaryMuscles: [...exerciseDoc.primary_muscles],
                    secondaryMuscles: [...exerciseDoc.secondary_muscles],
                    lastPerformedAt: null,
                    totalSets: 0,
                    sessionIds: new Set<string>(),
                    personalBest: null,
                }
                summaryMap.set(exerciseId, summary)
            }

            for (const set of exercise.sets) {
                if (!isValidSet(set)) continue
                validSetCount += 1
                const bestCandidate = buildBestRecord(set, sessionDate)
                if (isBetterRecord(bestCandidate, summary.personalBest)) {
                    summary.personalBest = bestCandidate
                }
            }

            if (validSetCount > 0) {
                summary.totalSets += validSetCount
                summary.sessionIds.add(sessionId)
                if (!summary.lastPerformedAt || sessionDate.getTime() > new Date(summary.lastPerformedAt).getTime()) {
                    summary.lastPerformedAt = toISO(sessionDate)
                }
            }
        }
    }

    return Array.from(summaryMap.values()).map(summary => ({
        exerciseId: summary.exerciseId,
        name: summary.name,
        equipment: summary.equipment,
        primaryMuscles: summary.primaryMuscles,
        secondaryMuscles: summary.secondaryMuscles,
        lastPerformedAt: summary.lastPerformedAt,
        totalSessions: summary.sessionIds.size,
        totalSets: summary.totalSets,
        personalBest: summary.personalBest,
    }))
}

export function summarizeExerciseDetail(
    sessions: PopulatedSession[],
    targetExerciseId: string
): ExerciseDetailStats {
    const sessionIds = new Set<string>()
    const volumeByDate = new Map<string, number>()

    let totalSets = 0
    let lastPerformedAt: string | null = null
    let personalBest: BestSetRecord | null = null
    let best1M: BestSetRecord | null = null
    let best3M: BestSetRecord | null = null
    let best1Y: BestSetRecord | null = null

    const now = new Date()
    const oneMonthAgo = new Date(now)
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)
    const threeMonthsAgo = new Date(now)
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90)
    const oneYearAgo = new Date(now)
    oneYearAgo.setDate(oneYearAgo.getDate() - 365)

    for (const session of sessions) {
        const sessionDate = new Date(session.date)
        const sessionId = toObjectIdString(session._id)
        if (!session.exercises || !sessionId) continue

        for (const exercise of session.exercises) {
            const exerciseDoc = exercise.exerciseId
            const exerciseId = toObjectIdString(exerciseDoc?._id)
            if (!exerciseDoc || exerciseId !== targetExerciseId || !exercise.sets) continue

            let bestVolumeThisSession = 0
            let hasValidSet = false

            for (const set of exercise.sets) {
                if (!isValidSet(set)) continue
                hasValidSet = true
                totalSets += 1

                const record = buildBestRecord(set, sessionDate)
                if (isBetterRecord(record, personalBest)) {
                    personalBest = record
                }
                if (sessionDate.getTime() >= oneMonthAgo.getTime() && isBetterRecord(record, best1M)) {
                    best1M = record
                }
                if (sessionDate.getTime() >= threeMonthsAgo.getTime() && isBetterRecord(record, best3M)) {
                    best3M = record
                }
                if (sessionDate.getTime() >= oneYearAgo.getTime() && isBetterRecord(record, best1Y)) {
                    best1Y = record
                }

                if (record.volume > bestVolumeThisSession) {
                    bestVolumeThisSession = record.volume
                }
            }

            if (hasValidSet) {
                sessionIds.add(sessionId)
                const dateKey = toDateOnlyKey(sessionDate)
                const existing = volumeByDate.get(dateKey) || 0
                if (bestVolumeThisSession > existing) {
                    volumeByDate.set(dateKey, bestVolumeThisSession)
                }
                if (!lastPerformedAt || sessionDate.getTime() > new Date(lastPerformedAt).getTime()) {
                    lastPerformedAt = toISO(sessionDate)
                }
            }
        }
    }

    return {
        exerciseId: targetExerciseId,
        personalBest,
        best1M,
        best3M,
        best1Y,
        volumeByDate: Array.from(volumeByDate.entries())
            .map(([date, peakVolume]) => ({ date, peakVolume }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        totalSessions: sessionIds.size,
        totalSets,
        lastPerformedAt,
    }
}

