// Utilities for working with calendar days in a specific IANA time zone

type DateParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function getParts(date: Date, timeZone: string): DateParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value])
  ) as Record<string, string>

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  }
}

export function formatZonedDayKey(date: Date, timeZone: string): string {
  // Returns YYYY-MM-DD for the date in the given time zone
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return fmt.format(date)
}

export function getStartOfDayUtcForZoneFromYMD(
  year: number,
  month: number,
  day: number,
  timeZone: string
): Date {
  // Start with a UTC midnight guess for the Y/M/D
  const utcGuess = Date.UTC(year, month - 1, day)
  const asDate = new Date(utcGuess)
  const { hour, minute, second } = getParts(asDate, timeZone)
  const offsetMs = ((hour * 60 + minute) * 60 + second) * 1000
  return new Date(utcGuess - offsetMs)
}

export function getStartOfDayUtcForZone(date: Date, timeZone: string): Date {
  const { year, month, day } = getParts(date, timeZone)
  return getStartOfDayUtcForZoneFromYMD(year, month, day, timeZone)
}

export function getMonthRangeUtcExclusive(
  year: number,
  month: number,
  timeZone: string
): { startUtc: Date; endUtcExclusive: Date } {
  const startUtc = getStartOfDayUtcForZoneFromYMD(year, month, 1, timeZone)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const endUtcExclusive = getStartOfDayUtcForZoneFromYMD(
    nextYear,
    nextMonth,
    1,
    timeZone
  )
  return { startUtc, endUtcExclusive }
}


