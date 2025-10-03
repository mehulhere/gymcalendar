// Volume calculation utilities based on implementation.md

export interface MuscleContribution {
  muscle: string
  factor: number // 1.0 for primary, 0.5 for strong synergist, 0.25 for minor synergist
}

export interface SetData {
  reps: number
  weight: number
  rpe?: number
}

export interface ExerciseVolume {
  exerciseId: string
  sets: SetData[]
  muscles: MuscleContribution[]
}

/**
 * Calculate volume for a single set
 * Formula: weight × reps
 */
export function calculateSetVolume(set: SetData): number {
  return set.weight * set.reps
}

/**
 * Calculate total volume for an exercise (sum of all sets)
 */
export function calculateExerciseVolume(sets: SetData[]): number {
  return sets.reduce((total, set) => total + calculateSetVolume(set), 0)
}

/**
 * Calculate volume contribution to each muscle group
 * Returns a map of muscle -> volume
 */
export function calculateMuscleVolumes(
  exercises: ExerciseVolume[]
): Map<string, number> {
  const muscleVolumes = new Map<string, number>()

  for (const exercise of exercises) {
    const exerciseVolume = calculateExerciseVolume(exercise.sets)

    for (const muscleContribution of exercise.muscles) {
      const muscleVolume = exerciseVolume * muscleContribution.factor
      const currentVolume = muscleVolumes.get(muscleContribution.muscle) || 0
      muscleVolumes.set(
        muscleContribution.muscle,
        currentVolume + muscleVolume
      )
    }
  }

  return muscleVolumes
}

/**
 * Calculate set count per muscle (with fractional contributions)
 */
export function calculateMuscleSets(
  exercises: ExerciseVolume[]
): Map<string, number> {
  const muscleSets = new Map<string, number>()

  for (const exercise of exercises) {
    const setCount = exercise.sets.length

    for (const muscleContribution of exercise.muscles) {
      const contributingSets = setCount * muscleContribution.factor
      const currentSets = muscleSets.get(muscleContribution.muscle) || 0
      muscleSets.set(
        muscleContribution.muscle,
        currentSets + contributingSets
      )
    }
  }

  return muscleSets
}

/**
 * Check if a muscle group is overworked (>20 sets/week)
 */
export function isOverworked(weeklySetCount: number): boolean {
  return weeklySetCount > 20
}

/**
 * Calculate volume for bodyweight exercises
 * Formula: bodyWeight × reps
 */
export function calculateBodyweightSetVolume(
  bodyWeight: number,
  reps: number
): number {
  return bodyWeight * reps
}

/**
 * Calculate volume for time-based exercises (planks, etc.)
 * Formula: bodyWeight × timeInSeconds
 */
export function calculateTimeBasedVolume(
  bodyWeight: number,
  timeInSeconds: number
): number {
  return bodyWeight * timeInSeconds
}

/**
 * Get recovery status based on weekly set count
 */
export function getRecoveryStatus(
  weeklySetCount: number
): 'low' | 'moderate' | 'optimal' | 'high' | 'overreached' {
  if (weeklySetCount < 5) return 'low'
  if (weeklySetCount < 10) return 'moderate'
  if (weeklySetCount <= 20) return 'optimal'
  if (weeklySetCount <= 25) return 'high'
  return 'overreached'
}

/**
 * Calculate total session volume
 */
export function calculateSessionVolume(exercises: ExerciseVolume[]): number {
  return exercises.reduce(
    (total, exercise) => total + calculateExerciseVolume(exercise.sets),
    0
  )
}

