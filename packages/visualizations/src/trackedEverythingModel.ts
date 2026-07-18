import type { TrackedEverythingDataset, TrackedEverythingTimeMark } from './trackedEverythingTypes.ts'

export const isTrackedEverythingDataset = (value: unknown): value is TrackedEverythingDataset => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Partial<TrackedEverythingDataset>
  return (
    candidate.kind === 'tracked-everything' &&
    candidate.schemaVersion === 1 &&
    typeof candidate.scenario === 'string' &&
    typeof candidate.eventFile === 'string' &&
    Number.isInteger(candidate.eventCount) &&
    Number.isFinite(candidate.durationMs) &&
    Array.isArray(candidate.sites) &&
    candidate.sites.every(
      (site) =>
        Number.isInteger(site?.id) &&
        typeof site?.location === 'string' &&
        typeof site?.type === 'string' &&
        (site.originalSource === null || typeof site.originalSource === 'string'),
    ) &&
    Array.isArray(candidate.timeMarks) &&
    candidate.timeMarks.every((mark) => Number.isInteger(mark?.eventIndex) && Number.isFinite(mark?.elapsedMs))
  )
}

export const getSitePath = (site: TrackedEverythingDataset['sites'][number]): string => {
  if (site.originalSource) {
    return site.originalSource.replaceAll('\\', '/')
  }
  const match = site.location.match(/^(.+):\d+:\d+$/)
  return (match?.[1] || 'runtime/unmapped').replaceAll('\\', '/')
}

export const decodeTrackedEverythingEvents = (
  buffer: ArrayBuffer,
  dataset: TrackedEverythingDataset,
): Uint32Array => {
  if (buffer.byteLength !== dataset.eventCount * 4) {
    throw new Error(`Invalid event stream length: expected ${dataset.eventCount * 4} bytes, received ${buffer.byteLength}`)
  }
  const events = new Uint32Array(buffer)
  for (const siteId of events) {
    if (!dataset.sites[siteId] || dataset.sites[siteId].id !== siteId) {
      throw new Error(`Invalid tracked-everything site id ${siteId}`)
    }
  }
  return events
}

export const timeToEventIndex = (
  timeMarks: readonly TrackedEverythingTimeMark[],
  elapsedMs: number,
  eventCount: number,
): number => {
  if (timeMarks.length === 0 || elapsedMs <= timeMarks[0].elapsedMs) {
    return 0
  }
  const last = timeMarks.at(-1)!
  if (elapsedMs >= last.elapsedMs) {
    return eventCount
  }
  let low = 0
  let high = timeMarks.length - 1
  while (low + 1 < high) {
    const middle = (low + high) >> 1
    if (timeMarks[middle].elapsedMs <= elapsedMs) {
      low = middle
    } else {
      high = middle
    }
  }
  const left = timeMarks[low]
  const right = timeMarks[high]
  const progress = right.elapsedMs === left.elapsedMs ? 0 : (elapsedMs - left.elapsedMs) / (right.elapsedMs - left.elapsedMs)
  return Math.max(0, Math.min(eventCount, Math.round(left.eventIndex + (right.eventIndex - left.eventIndex) * progress)))
}

export const eventIndexToTime = (
  timeMarks: readonly TrackedEverythingTimeMark[],
  eventIndex: number,
  durationMs: number,
): number => {
  if (timeMarks.length === 0 || eventIndex <= 0) {
    return 0
  }
  const last = timeMarks.at(-1)!
  if (eventIndex >= last.eventIndex) {
    return durationMs
  }
  let low = 0
  let high = timeMarks.length - 1
  while (low + 1 < high) {
    const middle = (low + high) >> 1
    if (timeMarks[middle].eventIndex <= eventIndex) {
      low = middle
    } else {
      high = middle
    }
  }
  const left = timeMarks[low]
  const right = timeMarks[high]
  const progress = right.eventIndex === left.eventIndex ? 0 : (eventIndex - left.eventIndex) / (right.eventIndex - left.eventIndex)
  return left.elapsedMs + (right.elapsedMs - left.elapsedMs) * progress
}
