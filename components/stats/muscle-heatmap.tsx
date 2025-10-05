'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

interface MuscleHeatmapProps {
    muscleVolumes: Record<string, number>
    muscleSets: Record<string, number>
}

export function MuscleHeatmap({ muscleVolumes, muscleSets }: MuscleHeatmapProps) {
    const router = useRouter()
    const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null)
    const [activeView, setActiveView] = useState<'front' | 'back'>('front')
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    const getColor = (muscle: string) => {
        // Try to find sets with case-insensitive matching
        const muscleLower = muscle.toLowerCase()
        let sets = 0

        // Check for exact match or partial match
        for (const [key, val] of Object.entries(muscleSets)) {
            if (key.toLowerCase() === muscleLower ||
                key.toLowerCase().includes(muscleLower) ||
                muscleLower.includes(key.toLowerCase())) {
                sets += val
            }
        }

        // Use set-based thresholds for weekly training
        // Low: < 5 sets, Light: 5-8 sets, Moderate: 8-15 sets, High: > 15 sets, Very High: > 20 sets
        if (sets === 0) return '#1e293b' // slate-800 - no activity
        if (sets > 20) return '#dc2626' // red-600 - very high (overwork warning)
        if (sets > 15) return '#f59e0b' // amber-500 - high
        if (sets >= 8) return '#10b981' // emerald-500 - moderate
        if (sets >= 5) return '#3b82f6' // blue-500 - light
        return '#6366f1' // indigo-500 - low
    }

    const handleMuscleClick = (muscle: string) => {
        router.push(`/stats/${muscle.toLowerCase()}`)
    }

    const getVolume = (muscle: string) => {
        // Try to find volume with case-insensitive matching
        const muscleLower = muscle.toLowerCase()
        let volume = 0

        for (const [key, val] of Object.entries(muscleVolumes)) {
            if (key.toLowerCase() === muscleLower ||
                key.toLowerCase().includes(muscleLower) ||
                muscleLower.includes(key.toLowerCase())) {
                volume += val
            }
        }

        return volume
    }

    const getSets = (muscle: string) => {
        // Try to find sets with case-insensitive matching
        const muscleLower = muscle.toLowerCase()
        let sets = 0

        for (const [key, val] of Object.entries(muscleSets)) {
            if (key.toLowerCase() === muscleLower ||
                key.toLowerCase().includes(muscleLower) ||
                muscleLower.includes(key.toLowerCase())) {
                sets += val
            }
        }

        return sets
    }

    // Swipe detection - minimum swipe distance (in px)
    const minSwipeDistance = 50

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return

        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > minSwipeDistance
        const isRightSwipe = distance < -minSwipeDistance

        if (isLeftSwipe && activeView === 'front') {
            setActiveView('back')
        } else if (isRightSwipe && activeView === 'back') {
            setActiveView('front')
        }
    }

    return (
        <div className="w-full space-y-6">
            <p className="text-xs text-center text-muted-foreground italic">
                💡 Click on any body part for detailed stats
            </p>

            {/* Dual View Container */}
            <div
                className="relative overflow-hidden"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Desktop: Both views side by side, Mobile: One view at a time */}
                <div className="flex justify-center gap-12 md:flex-wrap">
                    {/* FRONT VIEW */}
                    <div className={`flex flex-col items-center transition-all duration-300 ${activeView === 'front' ? 'block' : 'hidden md:flex'
                        }`}>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Front View</h3>
                        <svg
                            viewBox="0 0 200 450"
                            className="w-44 h-auto"
                        >
                            {/* Head */}
                            <ellipse cx="100" cy="30" rx="22" ry="28" fill="#475569" stroke="#334155" strokeWidth="2" />

                            {/* Neck */}
                            <path
                                d="M 88 55 L 85 75 L 115 75 L 112 55 Z"
                                fill={getColor('neck')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('neck')}
                                onMouseEnter={() => setHoveredMuscle('Neck')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Shoulders - Anterior Deltoids */}
                            <ellipse
                                cx="65" cy="85" rx="20" ry="18"
                                fill={getColor('anterior deltoids')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('anterior deltoids')}
                                onMouseEnter={() => setHoveredMuscle('Shoulders')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <ellipse
                                cx="135" cy="85" rx="20" ry="18"
                                fill={getColor('anterior deltoids')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('anterior deltoids')}
                                onMouseEnter={() => setHoveredMuscle('Shoulders')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Chest - Upper, Mid, Lower */}
                            <g>
                                {/* Upper Chest */}
                                <path
                                    d="M 82 78 Q 100 75 118 78 L 115 95 Q 100 92 85 95 Z"
                                    fill={getColor('chest')}
                                    stroke="#1e293b"
                                    strokeWidth="1"
                                    onClick={() => handleMuscleClick('chest')}
                                    onMouseEnter={() => setHoveredMuscle('Upper Chest')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                />
                                {/* Mid Chest */}
                                <path
                                    d="M 85 95 Q 100 92 115 95 L 115 115 Q 100 110 85 115 Z"
                                    fill={getColor('chest')}
                                    stroke="#1e293b"
                                    strokeWidth="1"
                                    onClick={() => handleMuscleClick('chest')}
                                    onMouseEnter={() => setHoveredMuscle('Mid Chest')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                />
                                {/* Lower Chest */}
                                <path
                                    d="M 85 115 Q 100 110 115 115 L 108 130 Q 100 128 92 130 Z"
                                    fill={getColor('chest')}
                                    stroke="#1e293b"
                                    strokeWidth="1"
                                    onClick={() => handleMuscleClick('chest')}
                                    onMouseEnter={() => setHoveredMuscle('Lower Chest')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                />
                            </g>

                            {/* Biceps */}
                            <ellipse
                                cx="55" cy="115" rx="11" ry="28"
                                fill={getColor('biceps')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('biceps')}
                                onMouseEnter={() => setHoveredMuscle('Biceps')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <ellipse
                                cx="145" cy="115" rx="11" ry="28"
                                fill={getColor('biceps')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('biceps')}
                                onMouseEnter={() => setHoveredMuscle('Biceps')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Forearms */}
                            <path
                                d="M 49 140 L 46 180 L 54 180 L 57 140 Z"
                                fill={getColor('forearms')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('forearms')}
                                onMouseEnter={() => setHoveredMuscle('Forearms')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <path
                                d="M 143 140 L 146 180 L 154 180 L 151 140 Z"
                                fill={getColor('forearms')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('forearms')}
                                onMouseEnter={() => setHoveredMuscle('Forearms')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Abs */}
                            <rect
                                x="85" y="135" width="30" height="45" rx="8"
                                fill={getColor('abs')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('abs')}
                                onMouseEnter={() => setHoveredMuscle('Abs')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Obliques */}
                            <path
                                d="M 75 140 Q 70 155 72 170 L 80 165 L 82 145 Z"
                                fill={getColor('obliques')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('obliques')}
                                onMouseEnter={() => setHoveredMuscle('Obliques')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <path
                                d="M 125 140 Q 130 155 128 170 L 120 165 L 118 145 Z"
                                fill={getColor('obliques')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('obliques')}
                                onMouseEnter={() => setHoveredMuscle('Obliques')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Hip/Adductors */}
                            <ellipse
                                cx="100" cy="195" rx="18" ry="15"
                                fill={getColor('adductors')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('adductors')}
                                onMouseEnter={() => setHoveredMuscle('Hip Flexors')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Quads */}
                            <path
                                d="M 75 210 L 70 300 L 80 302 L 88 210 Z"
                                fill={getColor('quads')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('quads')}
                                onMouseEnter={() => setHoveredMuscle('Quads')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <path
                                d="M 112 210 L 120 302 L 130 300 L 125 210 Z"
                                fill={getColor('quads')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('quads')}
                                onMouseEnter={() => setHoveredMuscle('Quads')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Calves */}
                            <ellipse
                                cx="75" cy="360" rx="12" ry="45"
                                fill={getColor('calves')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('calves')}
                                onMouseEnter={() => setHoveredMuscle('Calves')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <ellipse
                                cx="125" cy="360" rx="12" ry="45"
                                fill={getColor('calves')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('calves')}
                                onMouseEnter={() => setHoveredMuscle('Calves')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Feet */}
                            <ellipse cx="75" cy="415" rx="10" ry="8" fill="#475569" stroke="#334155" strokeWidth="1" />
                            <ellipse cx="125" cy="415" rx="10" ry="8" fill="#475569" stroke="#334155" strokeWidth="1" />
                        </svg>
                    </div>

                    {/* BACK VIEW */}
                    <div className={`flex flex-col items-center transition-all duration-300 ${activeView === 'back' ? 'block' : 'hidden md:flex'
                        }`}>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Back View</h3>
                        <svg
                            viewBox="0 0 200 450"
                            className="w-44 h-auto"
                        >
                            {/* Head */}
                            <ellipse cx="100" cy="30" rx="22" ry="28" fill="#475569" stroke="#334155" strokeWidth="2" />

                            {/* Neck (back) */}
                            <rect
                                x="88" y="55" width="24" height="20" rx="4"
                                fill={getColor('neck')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('neck')}
                                onMouseEnter={() => setHoveredMuscle('Neck')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Traps */}
                            <path
                                d="M 85 70 L 70 80 L 75 100 L 90 95 Z"
                                fill={getColor('traps')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('traps')}
                                onMouseEnter={() => setHoveredMuscle('Traps')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <path
                                d="M 115 70 L 130 80 L 125 100 L 110 95 Z"
                                fill={getColor('traps')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('traps')}
                                onMouseEnter={() => setHoveredMuscle('Traps')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Posterior Deltoids */}
                            <ellipse
                                cx="65" cy="85" rx="20" ry="18"
                                fill={getColor('posterior deltoids')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('posterior deltoids')}
                                onMouseEnter={() => setHoveredMuscle('Rear Delts')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <ellipse
                                cx="135" cy="85" rx="20" ry="18"
                                fill={getColor('posterior deltoids')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('posterior deltoids')}
                                onMouseEnter={() => setHoveredMuscle('Rear Delts')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Lats */}
                            <path
                                d="M 78 100 L 60 115 L 68 155 L 85 145 Z"
                                fill={getColor('lats')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('lats')}
                                onMouseEnter={() => setHoveredMuscle('Lats')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <path
                                d="M 122 100 L 140 115 L 132 155 L 115 145 Z"
                                fill={getColor('lats')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('lats')}
                                onMouseEnter={() => setHoveredMuscle('Lats')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Upper/Mid/Lower Back */}
                            <rect
                                x="85" y="95" width="30" height="25" rx="4"
                                fill={getColor('upper back')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('upper back')}
                                onMouseEnter={() => setHoveredMuscle('Upper Back')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <rect
                                x="85" y="120" width="30" height="25" rx="4"
                                fill={getColor('mid back')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('mid back')}
                                onMouseEnter={() => setHoveredMuscle('Mid Back')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <rect
                                x="88" y="145" width="24" height="30" rx="6"
                                fill={getColor('lower back')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('lower back')}
                                onMouseEnter={() => setHoveredMuscle('Lower Back')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Triceps */}
                            <ellipse
                                cx="55" cy="115" rx="11" ry="28"
                                fill={getColor('triceps')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('triceps')}
                                onMouseEnter={() => setHoveredMuscle('Triceps')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <ellipse
                                cx="145" cy="115" rx="11" ry="28"
                                fill={getColor('triceps')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('triceps')}
                                onMouseEnter={() => setHoveredMuscle('Triceps')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Forearms (back) */}
                            <path
                                d="M 49 140 L 46 180 L 54 180 L 57 140 Z"
                                fill={getColor('forearms')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('forearms')}
                                onMouseEnter={() => setHoveredMuscle('Forearms')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <path
                                d="M 143 140 L 146 180 L 154 180 L 151 140 Z"
                                fill={getColor('forearms')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('forearms')}
                                onMouseEnter={() => setHoveredMuscle('Forearms')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Glutes */}
                            <ellipse
                                cx="87" cy="185" rx="16" ry="20"
                                fill={getColor('glutes')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('glutes')}
                                onMouseEnter={() => setHoveredMuscle('Glutes')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <ellipse
                                cx="113" cy="185" rx="16" ry="20"
                                fill={getColor('glutes')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('glutes')}
                                onMouseEnter={() => setHoveredMuscle('Glutes')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Hamstrings */}
                            <path
                                d="M 75 210 L 70 300 L 80 302 L 88 210 Z"
                                fill={getColor('hamstrings')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('hamstrings')}
                                onMouseEnter={() => setHoveredMuscle('Hamstrings')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <path
                                d="M 112 210 L 120 302 L 130 300 L 125 210 Z"
                                fill={getColor('hamstrings')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('hamstrings')}
                                onMouseEnter={() => setHoveredMuscle('Hamstrings')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Calves (back) */}
                            <ellipse
                                cx="75" cy="360" rx="12" ry="45"
                                fill={getColor('calves')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('calves')}
                                onMouseEnter={() => setHoveredMuscle('Calves')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <ellipse
                                cx="125" cy="360" rx="12" ry="45"
                                fill={getColor('calves')}
                                stroke="#1e293b"
                                strokeWidth="1"
                                onClick={() => handleMuscleClick('calves')}
                                onMouseEnter={() => setHoveredMuscle('Calves')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Feet */}
                            <ellipse cx="75" cy="415" rx="10" ry="8" fill="#475569" stroke="#334155" strokeWidth="1" />
                            <ellipse cx="125" cy="415" rx="10" ry="8" fill="#475569" stroke="#334155" strokeWidth="1" />
                        </svg>
                    </div>
                </div>

                {/* View Indicators (Mobile Only) */}
                <div className="flex md:hidden justify-center gap-2 mt-4">
                    <button
                        onClick={() => setActiveView('front')}
                        className={`w-2 h-2 rounded-full transition-all ${activeView === 'front' ? 'bg-primary w-6' : 'bg-muted'
                            }`}
                        aria-label="Switch to front view"
                    />
                    <button
                        onClick={() => setActiveView('back')}
                        className={`w-2 h-2 rounded-full transition-all ${activeView === 'back' ? 'bg-primary w-6' : 'bg-muted'
                            }`}
                        aria-label="Switch to back view"
                    />
                </div>
            </div>

            {/* Hovered Muscle Display */}
            {hoveredMuscle && (
                <div className="text-center py-2">
                    <p className="text-sm font-semibold text-primary">
                        {hoveredMuscle}: {getSets(hoveredMuscle.toLowerCase())} sets • {getVolume(hoveredMuscle.toLowerCase()).toLocaleString()} kg
                    </p>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-3 justify-center text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#6366f1' }} />
                    <span>Low (&lt;5 sets)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }} />
                    <span>Light (5-7 sets)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }} />
                    <span>Moderate (8-15 sets)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }} />
                    <span>High (16-20 sets)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#dc2626' }} />
                    <span>Very High (&gt;20 sets)</span>
                </div>
            </div>
        </div>
    )
}
