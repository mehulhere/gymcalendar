# 🏋️ Gym Tracker – Feature Implementation Guide

**Version:** 1.0  
**Last Updated:** October 2025

---

## Overview

This document provides implementation-ready specifications for core features in the Gym Tracker app. It defines precise logic, data structures, and behavior rules for developers to implement directly.

---

## 1. Set Counting & Volume Calculations

### 1.1 Volume Formula

```typescript
setVolume = weight × reps
exerciseVolume = Σ(setVolume) // sum of all sets
muscleVolume = Σ(exerciseVolume × muscleContributionFactor)
```

### 1.2 Muscle Contribution Factors

- **Primary movers:** `1.0`
- **Synergists (strong):** `0.5`
- **Synergists (minor):** `0.25`
- **Isolation exercises:** always `1.0` for target muscle

**Example:** Bench Press
- Chest: `1.0`
- Triceps: `0.5`
- Anterior Deltoids: `0.25`

### 1.3 Bodyweight Exercises

All bodyweight movements use the user's stored bodyweight value:

```typescript
// Standard bodyweight exercises
setVolume = bodyWeight × reps

// Time-based exercises (planks, wall sits, etc.)
setVolume = bodyWeight × timeInSeconds
```

### 1.4 Weekly Set Volume Tracking

- Count sets using the same fractional contribution factors
- Display warning (red indicator) if **>20 sets/week** for any muscle group
- Use rolling 7-day window for calculations
- Update calculations in real-time as workouts are logged

---

## 2. Calendar & Attendance System

### 2.1 Schedule Configuration

**User Settings:**
- Sessions per week: `1–7`
- Week start day: `Monday–Sunday` (configurable)
- Schedule mode: `Weekday` or `Sequence`

### 2.2 Schedule Modes

#### Weekday Mode
Fixed days each week:

```typescript
{
  scheduleMode: "weekday",
  scheduledDays: {
    monday: "planDay1",
    wednesday: "planDay2", 
    friday: "planDay3"
  }
}
```

#### Sequence Mode
Rotating workout days:

```typescript
{
  scheduleMode: "sequence",
  sequenceOrder: ["day1", "day2", "day3"]
}
```

- Cycles continuously regardless of calendar date
- Skipped days don't shift the sequence
- Next workout is always the next day in rotation

### 2.3 Day Cell Visual States

| Status | Color | Description |
|--------|-------|-------------|
| Completed | Green fill | Session logged on scheduled day |
| Missed | Red fill | Scheduled day with no session |
| Rest/Unscheduled | Gray | Not a scheduled workout day |
| Future | Light gray | Upcoming scheduled days |
| Double session | Double green ring | Extra session eligible for make-up |

### 2.4 Week-Level Indicator

If weekly target met (e.g., 3/3 sessions completed):
- Shade entire week row with light green background
- Show checkmark badge on week number

---

## 3. Streak & Backlog System

### 3.1 Backlog Accumulation

```typescript
// Increment backlog at midnight after each missed scheduled day
if (scheduledDay && !attended && currentTime >= dayEnd) {
  backlog = Math.min(backlog + 1, 3); // Cap at 3
}
```

### 3.2 Backlog Reduction

Extra sessions reduce backlog in chronological order:

```typescript
if (extraSessionLogged && backlog > 0) {
  // Apply to oldest missed day first
  backlogDays.sort((a, b) => a.date - b.date);
  backlogDays[0].status = "made-up";
  backlog--;
}
```

### 3.3 Streak Rules

- **Streak continues:** As long as backlog ≤ 3
- **Streak breaks:** When backlog > 3
- **Streak increments:** Each completed scheduled session (make-ups don't increment)

### 3.4 Make-Up Window

- Allowed for **current week and next week only**
- Automatically select the earlist missing session on make up checkin. (Happens, when you do an extra workout, 4th workout of the week, when goal was 3 workouts. Even 2 Workouts on the same day)
- Extra session on same day = double session (shows double ring)

**Data Structure:**

```json
{
  "date": "2025-03-05",
  "status": "completed",
  "sessionId": "sess_xyz",
  "makeupForDate": "2025-03-03"
}
```

---

## 4. Muscle Heatmap Visualization

### 4.1 Muscle Groups

**Front View:**
- Neck, Anterior Deltoids, Chest (upper/mid/lower), Biceps, Forearms, Abs, Obliques, Quads, Adductors

**Back View:**
- Traps, Posterior/Lateral Deltoids, Lats, Upper/Mid/Lower Back, Triceps, Glutes, Hamstrings, Calves, Abductors

### 4.2 Fill Color Logic

```typescript
// Normalize volume to 0-1 scale
const normalized = (muscleVolume - minVolume) / (maxVolume - minVolume);

// Blue gradient scale
const color = interpolate(normalized, {
  0: "#e0f2fe",    // Light blue (low volume)
  1: "#0369a1"     // Dark blue (high volume)
});

// Add red stroke if overworked
if (weeklySets > 20) {
  strokeColor = "#dc2626";
  strokeWidth = 3;
}
```

### 4.3 Interaction

- Swipe or button to toggle Front/Back views
- Tap muscle group to show detailed stats:
  - Total volume this week
  - Set count
  - Contributing exercises
  - Recovery status

---

## 5. LLM Integration (Gemini)

### 5.1 Configuration

```typescript
// /lib/llm.ts
const LLM_CONFIG = {
  provider: "gemini",
  model: "gemini-1.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  timeout: 10000,
  retries: 2
};
```

### 5.2 Cache Strategy

**Cache Key Format:**
```
llm:<type>:<resourceId>:<userId>:<modelVersion>
```

**Example:**
```
llm:alternates:exercise_123:user_abc:gemini-1.5-flash
```

**Database Schema:**

```sql
CREATE TABLE llm_cache (
  id UUID PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  prompt TEXT NOT NULL,
  response JSONB NOT NULL,
  model_version TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

### 5.3 Prompt Templates

#### Exercise Alternates

```typescript
const prompt = `Suggest 3 alternative exercises for ${exerciseName} that target ${primaryMuscles.join(", ")}.

Return JSON only:
{
  "alternates": [
    {"name": "Exercise name", "reason": "Why it's a good substitute"}
  ]
}`;
```

#### Form Tips

```typescript
const prompt = `Provide coaching cues for ${exerciseName}:
- 3 concise form cues (max 20 words each)
- 2 safety warnings (max 20 words each)

Return JSON only:
{"cues": [...], "warnings": [...]}`;
```

#### Weekly Insights

```typescript
const prompt = `Analyze workout data for user ${userId} from ${startDate} to ${endDate}.

Data: ${JSON.stringify(volumeData)}

Provide 4-6 insights about:
- Muscle groups worked >20 sets/week
- Volume trends (increasing/decreasing)
- Imbalances (push vs pull ratio)
- Recovery concerns

Return 4-6 bullet points, max 25 words each.`;
```

### 5.4 Fallback Behavior

If LLM is unavailable:
- **Alternates:** Show rule-based suggestions from exercise database
- **Tips:** Display pre-written form cues stored in exercise metadata
- **Insights:** Show basic stats without commentary

---

## 6. Offline Queue & Sync

### 6.1 Queue Structure

Store in IndexedDB:

```typescript
interface QueueItem {
  id: string;
  method: "POST" | "PUT" | "DELETE";
  url: string;
  payload: Record<string, any>;
  timestamp: number;
  retryCount: number;
}
```

### 6.2 Sync Strategy

1. **Network-first:** Attempt immediate server sync
2. **Queue on fail:** Store in IndexedDB if offline
3. **Auto-retry:** When connection restored
4. **Retry limit:** 3 attempts, then mark as failed

### 6.3 Conflict Resolution

**Rule:** Last write wins (based on timestamp)

```typescript
if (serverTimestamp > localTimestamp) {
  // Server version is newer, discard local
  resolveConflict("server-wins");
} else {
  // Local version is newer, push to server
  resolveConflict("local-wins");
}
```

---

## 7. YouTube Integration

### 7.1 Search Query Format

```typescript
const query = `${exerciseName} form shorts`;
const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
```

### 7.2 Deep Linking

**Attempt native app first:**

```typescript
// Android
const intent = `intent://results?search_query=${query}#Intent;package=com.google.android.youtube;end`;

// iOS
const appUrl = `youtube://results?search_query=${query}`;

// Fallback to web
const webUrl = `https://m.youtube.com/results?search_query=${query}`;
```

**Implementation:**
1. Try deep link for 300ms
2. If timeout, open web URL
3. No user prompt needed

---

## 8. UI Guidelines

### 8.1 Touch Targets

- Minimum size: `44px × 44px`
- Spacing between targets: `8px`

### 8.2 Gesture Thresholds

```typescript
const SWIPE_THRESHOLD = {
  distance: 40,      // pixels
  velocity: 0.3,     // px/ms
  timeout: 300       // ms
};
```

### 8.3 Bottom Sheets

- Primary modal pattern for forms and details
- Snap points: `[30%, 60%, 90%]` of screen height
- Dismiss on background tap or drag down

### 8.4 Haptic Feedback

```typescript
// Check-in action
Haptics.impact(Haptics.ImpactFeedbackStyle.Light);

// Workout complete
Haptics.notification(Haptics.NotificationFeedbackType.Success);

// Error state
Haptics.notification(Haptics.NotificationFeedbackType.Error);
```

### 8.5 Animation Timing

```typescript
const SPRING_CONFIG = {
  stiffness: 200,
  damping: 25,
  mass: 1
};

const DURATION = {
  fast: 150,
  normal: 250,
  slow: 400
};
```

---

## 9. Testing Requirements

### 9.1 Unit Tests

- [ ] Set volume calculations with fractional factors
- [ ] Backlog increment/decrement logic
- [ ] Make-up assignment to specific dates
- [ ] Weekly volume aggregation
- [ ] Streak break conditions

### 9.2 Integration Tests

- [ ] Calendar rendering with correct colors
- [ ] Week-level completion shading
- [ ] Offline queue persistence and replay
- [ ] LLM cache hit/miss behavior

### 9.3 E2E Tests

**Critical User Flow:**
1. Create plan with 3x/week schedule
2. Complete Day 1
3. Miss Day 2 (verify red cell, backlog = 1)
4. Complete Day 3 + extra session (double ring)
5. Assign extra to Day 2 make-up
6. Verify: backlog = 0, streak continues, week turns green

### 9.4 Performance Benchmarks

- Calendar render: `<16ms/frame` (60fps)
- Heatmap SVG render: `<100ms`
- Offline sync replay: `<5s` for 50 queued items

---

## 10. Data Examples

### 10.1 Missed Day + Make-Up

```json
{
  "attendance": [
    {
      "date": "2025-03-03",
      "status": "missed",
      "sessionId": null
    },
    {
      "date": "2025-03-05",
      "status": "completed",
      "sessionId": "sess_xyz",
      "makeupForDate": "2025-03-03"
    }
  ],
  "backlog": 0
}
```

### 10.2 Weekly Summary

```json
{
  "weekId": "2025-W10",
  "sessionsCompleted": 3,
  "sessionsTarget": 3,
  "status": "complete",
  "styling": {
    "backgroundColor": "#f0fdf4",
    "badge": "✓"
  }
}
```

### 10.3 Exercise Contribution Map

```json
{
  "exerciseId": "bench_press",
  "muscles": {
    "chest": 1.0,
    "triceps": 0.5,
    "anterior_delts": 0.25
  }
}
```

---

## Implementation Checklist

- [ ] Set counting with fractional muscle contributions
- [ ] Weekly volume tracking with 20+ set warnings
- [ ] Calendar with weekday/sequence modes
- [ ] Backlog system (cap at 3, midnight increment)
- [ ] Streak tracking with break conditions
- [ ] Make-up session assignment (current/next week only)
- [ ] Muscle heatmap (front/back views, blue gradient)
- [ ] Gemini integration with caching
- [ ] Offline queue (IndexedDB, last-write-wins)
- [ ] YouTube deep linking with fallback
- [ ] Haptic feedback for key actions
- [ ] Bottom sheet modals
- [ ] Touch target sizing (44px min)

---

**Ready to implement.** Each section provides formulas, code examples, and validation rules needed for development.