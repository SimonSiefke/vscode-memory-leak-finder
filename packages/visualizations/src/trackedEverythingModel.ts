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
    candidate.eventFile.length > 0 &&
    !/^(?:[a-z]+:|[\\/])/i.test(candidate.eventFile) &&
    Number.isInteger(candidate.eventCount) &&
    candidate.eventCount! >= 0 &&
    Number.isFinite(candidate.durationMs) &&
    candidate.durationMs! >= 0 &&
    Array.isArray(candidate.sites) &&
    candidate.sites.every(
      (site, index) =>
        Number.isInteger(site?.id) &&
        site.id === index &&
        typeof site?.location === 'string' &&
        typeof site?.type === 'string' &&
        (site.originalSource === null || typeof site.originalSource === 'string') &&
        (site.originalLocation === null || typeof site.originalLocation === 'string') &&
        (site.originalLine === null || Number.isInteger(site.originalLine)) &&
        (site.originalColumn === null || Number.isInteger(site.originalColumn)),
    ) &&
    Array.isArray(candidate.timeMarks) &&
    candidate.timeMarks.length > 0 &&
    candidate.timeMarks.every(
      (mark, index) =>
        Number.isInteger(mark?.eventIndex) &&
        mark.eventIndex >= 0 &&
        mark.eventIndex <= candidate.eventCount! &&
        Number.isFinite(mark?.elapsedMs) &&
        mark.elapsedMs >= 0 &&
        mark.elapsedMs <= candidate.durationMs! &&
        (index === 0 ||
          (mark.eventIndex >= candidate.timeMarks![index - 1].eventIndex && mark.elapsedMs >= candidate.timeMarks![index - 1].elapsedMs)),
    ) &&
    candidate.timeMarks[0].eventIndex === 0 &&
    candidate.timeMarks.at(-1)!.eventIndex === candidate.eventCount
  )
}

export const getSitePath = (site: TrackedEverythingDataset['sites'][number]): string => {
  if (site.originalSource) {
    return site.originalSource.replaceAll('\\', '/')
  }
  const match = site.location.match(/^(.+):\d+:\d+$/)
  return (match?.[1] || 'runtime/unmapped').replaceAll('\\', '/')
}

export const decodeTrackedEverythingEvents = (buffer: ArrayBuffer, dataset: TrackedEverythingDataset): Uint32Array => {
  if (buffer.byteLength !== dataset.eventCount * 4) {
    throw new Error(`Invalid event stream length: expected ${dataset.eventCount * 4} bytes, received ${buffer.byteLength}`)
  }
  const endianProbe = new Uint16Array([1])
  const isLittleEndian = new Uint8Array(endianProbe.buffer)[0] === 1
  const events = isLittleEndian
    ? new Uint32Array(buffer)
    : Uint32Array.from({ length: dataset.eventCount }, (_, index) => new DataView(buffer).getUint32(index * 4, true))
  for (const siteId of events) {
    if (!dataset.sites[siteId] || dataset.sites[siteId].id !== siteId) {
      throw new Error(`Invalid tracked-everything site id ${siteId}`)
    }
  }
  return events
}

export const moveTrackedEverythingCursor = (
  events: Uint32Array,
  counts: Uint32Array,
  currentCursor: number,
  requestedCursor: number,
): number => {
  const nextCursor = Math.max(0, Math.min(events.length, Math.round(requestedCursor)))
  if (nextCursor > currentCursor) {
    for (let index = currentCursor; index < nextCursor; index++) {
      counts[events[index]]++
    }
  } else {
    for (let index = currentCursor - 1; index >= nextCursor; index--) {
      counts[events[index]]--
    }
  }
  return nextCursor
}

export const timeToEventIndex = (timeMarks: readonly TrackedEverythingTimeMark[], elapsedMs: number, eventCount: number): number => {
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

export const eventIndexToTime = (timeMarks: readonly TrackedEverythingTimeMark[], eventIndex: number, durationMs: number): number => {
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
