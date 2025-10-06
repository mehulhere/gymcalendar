import { addDays, addMonths, differenceInCalendarDays, startOfMonth, startOfWeek, subDays, subMonths } from 'date-fns'
import { Types } from 'mongoose'

interface SessionSet {
    reps: number
    weight: number
}

interface PopulatedExerciseDoc {
    _id: Types.ObjectId | string
    name: string
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

interface WeighInEntry {
    date: Date | string
    weight: number
}

export type ProgressPeriod = 'weekly' | 'monthly'

export interface ProgressSummaryItem {
    currentVolume: number
    previousVolume: number
    percentChange: number
}

export interface ProgressSummaryResponse {
    weekly: ProgressSummaryItem
    monthly: ProgressSummaryItem
}

interface ComparisonSeries {
    labels: string[]
    currentSeries: number[]
    previousSeries: number[]
    weightSeries: number[] | null
}

export type RecordCategory = 'PB' | 'BEST_1Y' | 'BEST_3M' | 'BEST_1M'
export type WorstCategory = 'PW' | 'WORST_1Y' | 'WORST_3M' | 'WORST_1M'

export interface ProgressRecordEntry {
    exerciseId: string
    exerciseName: string
    category: RecordCategory
    date: string
    reps: number
    weight: number
    volume: number
}

export interface ProgressWorstEntry {
    exerciseId: string
    exerciseName: string
    category: WorstCategory
    date: string
    reps: number
    weight: number
    volume: number
}

export interface ProgressDetailResponse extends ProgressSummaryItem {
    period: ProgressPeriod
    comparison: ComparisonSeries
    bestRecords: ProgressRecordEntry[]
    worstRecords: ProgressWorstEntry[]
}

interface ProcessedSet {
    exerciseId: string
    exerciseName: string
    date: Date
    weight: number
    reps: number
    volume: number
}

interface SlidingWindowEntry {
    date: Date
    volume: number
}

interface ExerciseRecordState {
    bestEver: SlidingWindowEntry & { reps: number; weight: number } | null
    worstEver: SlidingWindowEntry & { reps: number; weight: number } | null
    window30: SlidingWindowEntry[]
    window90: SlidingWindowEntry[]
    window365: SlidingWindowEntry[]
    window30Worst: SlidingWindowEntry[]
    window90Worst: SlidingWindowEntry[]
    window365Worst: SlidingWindowEntry[]
}

function isValidSet(set: SessionSet | undefined): set is SessionSet {
    return !!set && typeof set.reps === 'number' && typeof set.weight === 'number' && set.reps > 0 && set.weight > 0
}

function toObjectIdString(id: Types.ObjectId | string | undefined): string | null {
    if (!id) return null
    if (typeof id === 'string') return id
    return id.toString()
}

export function extractSetsFromSessions(sessions: PopulatedSession[]): ProcessedSet[] {
    const result: ProcessedSet[] = []

    for (const session of sessions) {
        const sessionDate = new Date(session.date)
        for (const exercise of session.exercises || []) {
            const exerciseDoc = exercise.exerciseId
            const exerciseId = toObjectIdString(exerciseDoc?._id)
            if (!exerciseDoc || !exerciseId || !exerciseDoc.name) continue

            for (const set of exercise.sets || []) {
                if (!isValidSet(set)) continue
                result.push({
                    exerciseId,
                    exerciseName: exerciseDoc.name,
                    date: sessionDate,
                    weight: set.weight,
                    reps: set.reps,
                    volume: set.weight * set.reps,
                })
            }
        }
    }

    return result.sort((a, b) => a.date.getTime() - b.date.getTime())
}

function pruneWindow(window: SlidingWindowEntry[], threshold: Date) {
    while (window.length > 0 && window[0].date < threshold) {
        window.shift()
    }
}

function getWindowMax(window: SlidingWindowEntry[]): number {
    if (window.length === 0) return 0
    let max = 0
    for (const entry of window) {
        if (entry.volume > max) {
            max = entry.volume
        }
    }
    return max
}

function getWindowMin(window: SlidingWindowEntry[]): number {
    if (window.length === 0) return 0
    let min = Infinity
    for (const entry of window) {
        if (entry.volume < min) {
            min = entry.volume
        }
    }
    return min === Infinity ? 0 : min
}

const bestPriority: RecordCategory[] = ['PB', 'BEST_1Y', 'BEST_3M', 'BEST_1M']
const worstPriority: WorstCategory[] = ['PW', 'WORST_1Y', 'WORST_3M', 'WORST_1M']

interface RecordDetectionResult {
    best: ProgressRecordEntry[]
    worst: ProgressWorstEntry[]
}

export function detectRecordBreakers(
    sets: ProcessedSet[],
    periodStart: Date,
    periodEnd: Date
): RecordDetectionResult {
    const states = new Map<string, ExerciseRecordState>()
    const bestResults: ProgressRecordEntry[] = []
    const worstResults: ProgressWorstEntry[] = []

    for (const set of sets) {
        let state = states.get(set.exerciseId)
        if (!state) {
            state = {
                bestEver: null,
                worstEver: null,
                window30: [],
                window90: [],
                window365: [],
                window30Worst: [],
                window90Worst: [],
                window365Worst: [],
            }
            states.set(set.exerciseId, state)
        }

        const currentDate = set.date

        pruneWindow(state.window30, subDays(currentDate, 30))
        pruneWindow(state.window90, subDays(currentDate, 90))
        pruneWindow(state.window365, subDays(currentDate, 365))
        pruneWindow(state.window30Worst, subDays(currentDate, 30))
        pruneWindow(state.window90Worst, subDays(currentDate, 90))
        pruneWindow(state.window365Worst, subDays(currentDate, 365))

        const previousBest = state.bestEver?.volume ?? 0
        const previousWorst = state.worstEver?.volume ?? 0
        const previousBest30 = getWindowMax(state.window30)
        const previousBest90 = getWindowMax(state.window90)
        const previousBest365 = getWindowMax(state.window365)
        const previousWorst30 = getWindowMin(state.window30Worst)
        const previousWorst90 = getWindowMin(state.window90Worst)
        const previousWorst365 = getWindowMin(state.window365Worst)

        const isWithinPeriod = currentDate >= periodStart && currentDate < periodEnd

        if (isWithinPeriod) {
            // Detect best category in priority order
            if (previousBest > 0 && set.volume > previousBest) {
                bestResults.push({
                    exerciseId: set.exerciseId,
                    exerciseName: set.exerciseName,
                    category: 'PB',
                    date: set.date.toISOString(),
                    reps: set.reps,
                    weight: set.weight,
                    volume: set.volume,
                })
            } else if (previousBest365 > 0 && set.volume > previousBest365) {
                bestResults.push({
                    exerciseId: set.exerciseId,
                    exerciseName: set.exerciseName,
                    category: 'BEST_1Y',
                    date: set.date.toISOString(),
                    reps: set.reps,
                    weight: set.weight,
                    volume: set.volume,
                })
            } else if (previousBest90 > 0 && set.volume > previousBest90) {
                bestResults.push({
                    exerciseId: set.exerciseId,
                    exerciseName: set.exerciseName,
                    category: 'BEST_3M',
                    date: set.date.toISOString(),
                    reps: set.reps,
                    weight: set.weight,
                    volume: set.volume,
                })
            } else if (set.volume > previousBest30) {
                // For 1M best, allow previous best to be zero (new lift)
                bestResults.push({
                    exerciseId: set.exerciseId,
                    exerciseName: set.exerciseName,
                    category: 'BEST_1M',
                    date: set.date.toISOString(),
                    reps: set.reps,
                    weight: set.weight,
                    volume: set.volume,
                })
            }

            // Detect worst category in priority order
            if (previousWorst > 0 && set.volume < previousWorst) {
                worstResults.push({
                    exerciseId: set.exerciseId,
                    exerciseName: set.exerciseName,
                    category: 'PW',
                    date: set.date.toISOString(),
                    reps: set.reps,
                    weight: set.weight,
                    volume: set.volume,
                })
            } else if (previousWorst365 > 0 && set.volume < previousWorst365) {
                worstResults.push({
                    exerciseId: set.exerciseId,
                    exerciseName: set.exerciseName,
                    category: 'WORST_1Y',
                    date: set.date.toISOString(),
                    reps: set.reps,
                    weight: set.weight,
                    volume: set.volume,
                })
            } else if (previousWorst90 > 0 && set.volume < previousWorst90) {
                worstResults.push({
                    exerciseId: set.exerciseId,
                    exerciseName: set.exerciseName,
                    category: 'WORST_3M',
                    date: set.date.toISOString(),
                    reps: set.reps,
                    weight: set.weight,
                    volume: set.volume,
                })
            } else if (previousWorst30 > 0 && set.volume < previousWorst30) {
                worstResults.push({
                    exerciseId: set.exerciseId,
                    exerciseName: set.exerciseName,
                    category: 'WORST_1M',
                    date: set.date.toISOString(),
                    reps: set.reps,
                    weight: set.weight,
                    volume: set.volume,
                })
            }
        }

        // Update state with current set after evaluations
        if (!state.bestEver || set.volume > state.bestEver.volume) {
            state.bestEver = { date: currentDate, volume: set.volume, reps: set.reps, weight: set.weight }
        }
        if (!state.worstEver || set.volume < state.worstEver.volume) {
            state.worstEver = { date: currentDate, volume: set.volume, reps: set.reps, weight: set.weight }
        }

        state.window30.push({ date: currentDate, volume: set.volume })
        state.window90.push({ date: currentDate, volume: set.volume })
        state.window365.push({ date: currentDate, volume: set.volume })
        state.window30Worst.push({ date: currentDate, volume: set.volume })
        state.window90Worst.push({ date: currentDate, volume: set.volume })
        state.window365Worst.push({ date: currentDate, volume: set.volume })
    }

    bestResults.sort((a, b) => {
        const priorityDiff = bestPriority.indexOf(a.category) - bestPriority.indexOf(b.category)
        if (priorityDiff !== 0) return priorityDiff
        return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    worstResults.sort((a, b) => {
        const priorityDiff = worstPriority.indexOf(a.category) - worstPriority.indexOf(b.category)
        if (priorityDiff !== 0) return priorityDiff
        return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    return {
        best: bestResults.slice(0, 5),
        worst: worstResults.slice(0, 5),
    }
}

export function calculateWeeklyComparison(
    sessions: PopulatedSession[],
    weighIns: WeighInEntry[],
    referenceDate: Date = new Date()
): ComparisonSeries {
    const currentWeekStart = startOfWeek(referenceDate, { weekStartsOn: 1 })
    const previousWeekStart = subDays(currentWeekStart, 7)
    const currentWeekEnd = addDays(currentWeekStart, 7)
    const previousWeekEnd = currentWeekStart

    const currentSeries = Array(7).fill(0)
    const previousSeries = Array(7).fill(0)
    const weightSeries = Array(7).fill(0)
    const weightCounts = Array(7).fill(0)

    for (const session of sessions) {
        const sessionDate = new Date(session.date)
        const volume = getSessionVolume(session)

        if (sessionDate >= currentWeekStart && sessionDate < currentWeekEnd) {
            const dayIndex = differenceInCalendarDays(sessionDate, currentWeekStart)
            if (dayIndex >= 0 && dayIndex < 7) {
                currentSeries[dayIndex] += volume
            }
        } else if (sessionDate >= previousWeekStart && sessionDate < previousWeekEnd) {
            const dayIndex = differenceInCalendarDays(sessionDate, previousWeekStart)
            if (dayIndex >= 0 && dayIndex < 7) {
                previousSeries[dayIndex] += volume
            }
        }
    }

    for (const weighIn of weighIns) {
        const weighDate = new Date(weighIn.date)
        if (weighDate >= currentWeekStart && weighDate < currentWeekEnd) {
            const dayIndex = differenceInCalendarDays(weighDate, currentWeekStart)
            if (dayIndex >= 0 && dayIndex < 7) {
                weightSeries[dayIndex] += weighIn.weight
                weightCounts[dayIndex] += 1
            }
        }
    }

    for (let i = 0; i < weightSeries.length; i++) {
        if (weightCounts[i] > 0) {
            weightSeries[i] = weightSeries[i] / weightCounts[i]
        } else {
            weightSeries[i] = 0
        }
    }

    const labels = Array.from({ length: 7 }, (_, index) => `Day ${index + 1}`)

    return {
        labels,
        currentSeries,
        previousSeries,
        weightSeries,
    }
}

export function calculateMonthlyComparison(
    sessions: PopulatedSession[],
    weighIns: WeighInEntry[],
    referenceDate: Date = new Date()
): ComparisonSeries {
    const currentMonthStart = startOfMonth(referenceDate)
    const previousMonthStart = startOfMonth(subMonths(referenceDate, 1))
    const nextMonthStart = addMonths(currentMonthStart, 1)
    const currentMonthLength = differenceInCalendarDays(nextMonthStart, currentMonthStart)
    const previousMonthLength = differenceInCalendarDays(currentMonthStart, previousMonthStart)
    const maxDays = Math.max(currentMonthLength, previousMonthLength)

    const currentSeries = Array(maxDays).fill(0)
    const previousSeries = Array(maxDays).fill(0)
    const weightSeries = Array(maxDays).fill(0)
    const weightCounts = Array(maxDays).fill(0)

    for (const session of sessions) {
        const sessionDate = new Date(session.date)
        const day = sessionDate.getDate() - 1
        const volume = getSessionVolume(session)

        if (sessionDate >= currentMonthStart && sessionDate < nextMonthStart) {
            if (day >= 0 && day < currentSeries.length) {
                currentSeries[day] += volume
            }
        } else if (sessionDate >= previousMonthStart && sessionDate < currentMonthStart) {
            if (day >= 0 && day < previousSeries.length) {
                previousSeries[day] += volume
            }
        }
    }

    for (const weighIn of weighIns) {
        const weighDate = new Date(weighIn.date)
        if (weighDate >= currentMonthStart && weighDate < nextMonthStart) {
            const day = weighDate.getDate() - 1
            if (day >= 0 && day < weightSeries.length) {
                weightSeries[day] += weighIn.weight
                weightCounts[day] += 1
            }
        }
    }

    for (let i = 0; i < weightSeries.length; i++) {
        if (weightCounts[i] > 0) {
            weightSeries[i] = weightSeries[i] / weightCounts[i]
        } else {
            weightSeries[i] = 0
        }
    }

    const labels = Array.from({ length: maxDays }, (_, index) => `Day ${index + 1}`)

    return {
        labels,
        currentSeries,
        previousSeries,
        weightSeries,
    }
}

export function getSessionVolume(session: PopulatedSession): number {
    let total = 0
    for (const exercise of session.exercises || []) {
        for (const set of exercise.sets || []) {
            if (!isValidSet(set)) continue
            total += set.weight * set.reps
        }
    }
    return total
}

export function calculateSummaryItem(currentVolume: number, previousVolume: number): ProgressSummaryItem {
    if (previousVolume <= 0 && currentVolume <= 0) {
        return {
            currentVolume,
            previousVolume,
            percentChange: 0,
        }
    }

    if (previousVolume <= 0 && currentVolume > 0) {
        return {
            currentVolume,
            previousVolume,
            percentChange: 100,
        }
    }

    const change = ((currentVolume - previousVolume) / previousVolume) * 100

    return {
        currentVolume,
        previousVolume,
        percentChange: Number.isFinite(change) ? change : 0,
    }
}

export function calculateWeeklySummary(sessions: PopulatedSession[], referenceDate: Date = new Date()): ProgressSummaryItem {
    const currentWeekStart = startOfWeek(referenceDate, { weekStartsOn: 1 })
    const previousWeekStart = subDays(currentWeekStart, 7)
    const currentWeekEnd = addDays(currentWeekStart, 7)

    let currentTotal = 0
    let previousTotal = 0

    for (const session of sessions) {
        const sessionDate = new Date(session.date)
        const volume = getSessionVolume(session)

        if (sessionDate >= currentWeekStart && sessionDate < currentWeekEnd) {
            currentTotal += volume
        } else if (sessionDate >= previousWeekStart && sessionDate < currentWeekStart) {
            previousTotal += volume
        }
    }

    return calculateSummaryItem(currentTotal, previousTotal)
}

export function calculateMonthlySummary(sessions: PopulatedSession[], referenceDate: Date = new Date()): ProgressSummaryItem {
    const currentMonthStart = startOfMonth(referenceDate)
    const previousMonthStart = startOfMonth(subMonths(referenceDate, 1))
    const nextMonthStart = addMonths(currentMonthStart, 1)

    let currentTotal = 0
    let previousTotal = 0

    for (const session of sessions) {
        const sessionDate = new Date(session.date)
        const volume = getSessionVolume(session)

        if (sessionDate >= currentMonthStart && sessionDate < nextMonthStart) {
            currentTotal += volume
        } else if (sessionDate >= previousMonthStart && sessionDate < currentMonthStart) {
            previousTotal += volume
        }
    }

    return calculateSummaryItem(currentTotal, previousTotal)
}

export function periodDateRange(period: ProgressPeriod, referenceDate: Date = new Date()): { start: Date; end: Date; comparisonStart: Date; comparisonEnd: Date } {
    if (period === 'weekly') {
        const currentWeekStart = startOfWeek(referenceDate, { weekStartsOn: 1 })
        const currentWeekEnd = addDays(currentWeekStart, 7)
        const previousWeekStart = subDays(currentWeekStart, 7)
        return {
            start: currentWeekStart,
            end: currentWeekEnd,
            comparisonStart: previousWeekStart,
            comparisonEnd: currentWeekStart,
        }
    }

    const currentMonthStart = startOfMonth(referenceDate)
    const nextMonthStart = addMonths(currentMonthStart, 1)
    const previousMonthStart = startOfMonth(subMonths(referenceDate, 1))

    return {
        start: currentMonthStart,
        end: nextMonthStart,
        comparisonStart: previousMonthStart,
        comparisonEnd: currentMonthStart,
    }
}

export function formatSetDisplay(reps: number, weight: number): string {
    return `${reps} x ${Number.isInteger(weight) ? weight : weight.toFixed(1)} kg`
}
