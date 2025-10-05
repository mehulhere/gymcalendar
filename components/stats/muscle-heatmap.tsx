
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

    const outlineColor = '#0f172a'
    const outlineWidth = 2

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
                            <ellipse cx="100" cy="30" rx="22" ry="28" fill="#475569" stroke={outlineColor} strokeWidth={outlineWidth} />

                            {/* Eyes */}
                            <circle cx="92" cy="26" r="3" fill="#FFFFFF" />
                            <circle cx="108" cy="26" r="3" fill="#FFFFFF" />


                            {/* Neck */}
                            <path
                                d="M 84 55 L 80 78 L 120 78 L 116 55 Z"
                                fill={getColor('neck')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('neck')}
                                onMouseEnter={() => setHoveredMuscle('Neck')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Shoulders - Anterior Deltoids */}
                            <ellipse
                                cx="52" cy="88" rx="30" ry="22"
                                fill={getColor('anterior deltoids')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('anterior deltoids')}
                                onMouseEnter={() => setHoveredMuscle('Shoulders')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <ellipse
                                cx="148" cy="88" rx="30" ry="22"
                                fill={getColor('anterior deltoids')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('anterior deltoids')}
                                onMouseEnter={() => setHoveredMuscle('Shoulders')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Chest - Upper, Mid, Lower */}
                            <g>
                                {/* Upper Chest */}
                                <path
                                    d="M 65 76 Q 100 68 135 76 L 128 98 Q 100 90 72 98 Z"
                                    fill={getColor('chest')}
                                    stroke={outlineColor}
                                    strokeWidth={outlineWidth}
                                    onClick={() => handleMuscleClick('chest')}
                                    onMouseEnter={() => setHoveredMuscle('Upper Chest')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                />
                                {/* Mid Chest */}
                                <path
                                    d="M 72 98 Q 100 90 128 98 L 128 120 Q 100 112 72 120 Z"
                                    fill={getColor('chest')}
                                    stroke={outlineColor}
                                    strokeWidth={outlineWidth}
                                    onClick={() => handleMuscleClick('chest')}
                                    onMouseEnter={() => setHoveredMuscle('Mid Chest')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                />
                                {/* Lower Chest */}
                                <path
                                    d="M 72 120 Q 100 112 128 120 L 120 140 Q 100 132 80 140 Z"
                                    fill={getColor('chest')}
                                    stroke={outlineColor}
                                    strokeWidth={outlineWidth}
                                    onClick={() => handleMuscleClick('chest')}
                                    onMouseEnter={() => setHoveredMuscle('Lower Chest')}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                />
                            </g>

                            {/* Forearms (drawn first so biceps overlap the seam) */}
                            <path
                                d="M 40 160 Q 20 170 25 220 L 55 220 Q 60 190 50 160 Z"
                                fill={getColor('forearms')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('forearms')}
                                onMouseEnter={() => setHoveredMuscle('Forearms')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <path
                                d="M 160 160 Q 180 170 175 220 L 145 220 Q 140 190 150 160 Z"
                                fill={getColor('forearms')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('forearms')}
                                onMouseEnter={() => setHoveredMuscle('Forearms')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Hands (Front View) */}
                            <ellipse cx="42" cy="227" rx="10" ry="8" fill="#475569" stroke={outlineColor} strokeWidth={outlineWidth} />
                            <ellipse cx="158" cy="227" rx="10" ry="8" fill="#475569" stroke={outlineColor} strokeWidth={outlineWidth} />

                            {/* Biceps (drawn after forearms to cover joint) */}
                            <ellipse
                                cx="45" cy="128" rx="17" ry="34"
                                fill={getColor('biceps')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('biceps')}
                                onMouseEnter={() => setHoveredMuscle('Biceps')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <ellipse
                                cx="155" cy="128" rx="17" ry="34"
                                fill={getColor('biceps')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('biceps')}
                                onMouseEnter={() => setHoveredMuscle('Biceps')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Abs */}
                            <rect
                                x="82" y="135" width="36" height="52" rx="10"
                                fill={getColor('abs')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('abs')}
                                onMouseEnter={() => setHoveredMuscle('Abs')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Obliques */}
                            <path
                                d="M 70 142 Q 58 172 68 202 L 86 192 L 92 150 Z"
                                fill={getColor('obliques')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('obliques')}
                                onMouseEnter={() => setHoveredMuscle('Obliques')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <path
                                d="M 130 142 Q 142 172 132 202 L 114 192 L 108 150 Z"
                                fill={getColor('obliques')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('obliques')}
                                onMouseEnter={() => setHoveredMuscle('Obliques')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Hip/Adductors */}
                            <ellipse
                                cx="100" cy="198" rx="22" ry="18"
                                fill={getColor('adductors')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('adductors')}
                                onMouseEnter={() => setHoveredMuscle('Hip Flexors')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Quads */}
                            <path
                                d="M 66 210 L 52 335 L 84 340 L 96 210 Z"
                                fill={getColor('quads')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('quads')}
                                onMouseEnter={() => setHoveredMuscle('Quads')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <path
                                d="M 134 210 L 148 335 L 116 340 L 104 210 Z"
                                fill={getColor('quads')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('quads')}
                                onMouseEnter={() => setHoveredMuscle('Quads')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Calves */}
                            <ellipse
                                cx="70" cy="362" rx="14" ry="50"
                                fill={getColor('calves')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('calves')}
                                onMouseEnter={() => setHoveredMuscle('Calves')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <ellipse
                                cx="130" cy="362" rx="14" ry="50"
                                fill={getColor('calves')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('calves')}
                                onMouseEnter={() => setHoveredMuscle('Calves')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Feet */}
                            <ellipse cx="70" cy="415" rx="10" ry="8" fill="#475569" stroke={outlineColor} strokeWidth={outlineWidth} />
                            <ellipse cx="130" cy="415" rx="10" ry="8" fill="#475569" stroke={outlineColor} strokeWidth={outlineWidth} />
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
                            <ellipse cx="100" cy="30" rx="22" ry="28" fill="#475569" stroke={outlineColor} strokeWidth={outlineWidth} />

                            {/* Neck (back) */}
                            <rect
                                x="86" y="55" width="28" height="24" rx="6"
                                fill={getColor('neck')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('neck')}
                                onMouseEnter={() => setHoveredMuscle('Neck')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Traps */}
                            <path
                                d="M 82 68 L 58 86 L 70 112 L 94 100 Z"
                                fill={getColor('traps')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('traps')}
                                onMouseEnter={() => setHoveredMuscle('Traps')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <path
                                d="M 118 68 L 142 86 L 130 112 L 106 100 Z"
                                fill={getColor('traps')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('traps')}
                                onMouseEnter={() => setHoveredMuscle('Traps')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Posterior Deltoids */}
                            <ellipse
                                cx="52" cy="92" rx="30" ry="22"
                                fill={getColor('posterior deltoids')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('posterior deltoids')}
                                onMouseEnter={() => setHoveredMuscle('Rear Delts')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <ellipse
                                cx="148" cy="92" rx="30" ry="22"
                                fill={getColor('posterior deltoids')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('posterior deltoids')}
                                onMouseEnter={() => setHoveredMuscle('Rear Delts')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Lats */}
                            <path
                                d="M 78 104 L 52 128 L 66 170 L 92 150 Z"
                                fill={getColor('lats')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('lats')}
                                onMouseEnter={() => setHoveredMuscle('Lats')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <path
                                d="M 122 104 L 148 128 L 134 170 L 108 150 Z"
                                fill={getColor('lats')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('lats')}
                                onMouseEnter={() => setHoveredMuscle('Lats')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Upper/Mid/Lower Back */}
                            <rect
                                x="80" y="95" width="40" height="28" rx="6"
                                fill={getColor('upper back')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('upper back')}
                                onMouseEnter={() => setHoveredMuscle('Upper Back')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <rect
                                x="80" y="123" width="40" height="28" rx="6"
                                fill={getColor('mid back')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('mid back')}
                                onMouseEnter={() => setHoveredMuscle('Mid Back')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <rect
                                x="82" y="148" width="36" height="34" rx="8"
                                fill={getColor('lower back')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('lower back')}
                                onMouseEnter={() => setHoveredMuscle('Lower Back')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Forearms (back) first so triceps cover the joint) */}
                            <path
                                d="M 40 160 Q 20 170 25 222 L 55 222 Q 60 190 50 160 Z"
                                fill={getColor('forearms')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('forearms')}
                                onMouseEnter={() => setHoveredMuscle('Forearms')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <path
                                d="M 160 160 Q 180 170 175 222 L 145 222 Q 140 190 150 160 Z"
                                fill={getColor('forearms')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('forearms')}
                                onMouseEnter={() => setHoveredMuscle('Forearms')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Hands (Back View) */}
                            <ellipse cx="42" cy="229" rx="10" ry="8" fill="#475569" stroke={outlineColor} strokeWidth={outlineWidth} />
                            <ellipse cx="158" cy="229" rx="10" ry="8" fill="#475569" stroke={outlineColor} strokeWidth={outlineWidth} />

                            {/* Triceps (drawn after to overlap seam) */}
                            <ellipse
                                cx="45" cy="130" rx="17" ry="34"
                                fill={getColor('triceps')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('triceps')}
                                onMouseEnter={() => setHoveredMuscle('Triceps')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <ellipse
                                cx="155" cy="130" rx="17" ry="34"
                                fill={getColor('triceps')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('triceps')}
                                onMouseEnter={() => setHoveredMuscle('Triceps')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Glutes */}
                            <ellipse
                                cx="88" cy="190" rx="20" ry="24"
                                fill={getColor('glutes')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('glutes')}
                                onMouseEnter={() => setHoveredMuscle('Glutes')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <ellipse
                                cx="112" cy="190" rx="20" ry="24"
                                fill={getColor('glutes')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('glutes')}
                                onMouseEnter={() => setHoveredMuscle('Glutes')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Hamstrings */}
                            <path
                                d="M 66 212 L 50 338 L 84 344 L 98 212 Z"
                                fill={getColor('hamstrings')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('hamstrings')}
                                onMouseEnter={() => setHoveredMuscle('Hamstrings')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <path
                                d="M 134 212 L 150 338 L 116 344 L 102 212 Z"
                                fill={getColor('hamstrings')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('hamstrings')}
                                onMouseEnter={() => setHoveredMuscle('Hamstrings')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Calves (back) */}
                            <ellipse
                                cx="70" cy="362" rx="14" ry="50"
                                fill={getColor('calves')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('calves')}
                                onMouseEnter={() => setHoveredMuscle('Calves')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <ellipse
                                cx="130" cy="362" rx="14" ry="50"
                                fill={getColor('calves')}
                                stroke={outlineColor}
                                strokeWidth={outlineWidth}
                                onClick={() => handleMuscleClick('calves')}
                                onMouseEnter={() => setHoveredMuscle('Calves')}
                                onMouseLeave={() => setHoveredMuscle(null)}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            />

                            {/* Feet */}
                            <ellipse cx="70" cy="415" rx="10" ry="8" fill="#475569" stroke={outlineColor} strokeWidth={outlineWidth} />
                            <ellipse cx="130" cy="415" rx="10" ry="8" fill="#475569" stroke={outlineColor} strokeWidth={outlineWidth} />
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
