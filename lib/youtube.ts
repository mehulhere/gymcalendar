// YouTube deep linking utility based on implementation.md

export interface YouTubeConfig {
  exerciseName: string
  variant?: 'shorts' | 'tutorial'
  customQuery?: string
}

/**
 * Generate YouTube search query for an exercise
 */
export function generateYouTubeQuery(config: YouTubeConfig): string {
  const { exerciseName, variant = 'shorts', customQuery } = config

  if (customQuery) {
    return customQuery
  }

  return `${exerciseName} form ${variant}`
}

/**
 * Get YouTube deep link URLs for mobile app opening
 */
export function getYouTubeLinks(query: string) {
  const encodedQuery = encodeURIComponent(query)

  return {
    // Android intent
    android: `intent://results?search_query=${encodedQuery}#Intent;package=com.google.android.youtube;end`,

    // iOS app URL scheme
    ios: `youtube://results?search_query=${encodedQuery}`,

    // Web fallbacks
    web: `https://www.youtube.com/results?search_query=${encodedQuery}`,
    mobile: `https://m.youtube.com/results?search_query=${encodedQuery}`,
  }
}

/**
 * Open YouTube with platform-appropriate method
 * Tries deep link first, then falls back to web
 */
export function openYouTubeExercise(
  exerciseName: string,
  variant: 'shorts' | 'tutorial' = 'shorts'
): void {
  const query = generateYouTubeQuery({ exerciseName, variant })
  const links = getYouTubeLinks(query)

  // Detect platform
  const isAndroid = /Android/i.test(navigator.userAgent)
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

  if (isAndroid) {
    // Try Android intent
    window.location.href = links.android
    // Fallback to mobile web after timeout
    setTimeout(() => {
      window.location.href = links.mobile
    }, 300)
  } else if (isIOS) {
    // Try iOS app URL scheme
    window.location.href = links.ios
    // Fallback to mobile web after timeout
    setTimeout(() => {
      window.location.href = links.mobile
    }, 300)
  } else {
    // Desktop or unknown - open web version
    window.open(links.web, '_blank')
  }
}

/**
 * React component helper for YouTube button
 */
export function useYouTubeLink(
  exerciseName: string,
  variant: 'shorts' | 'tutorial' = 'shorts'
) {
  const handleOpen = () => {
    openYouTubeExercise(exerciseName, variant)
  }

  return {
    handleOpen,
    query: generateYouTubeQuery({ exerciseName, variant }),
  }
}

