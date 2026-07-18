/// <reference lib="webworker" />

import { getSitePath } from './trackedEverythingModel.ts'
import type { TrackedEverythingAggregates, TrackedEverythingDataset } from './trackedEverythingTypes.ts'

let dataset: TrackedEverythingDataset
let events = new Uint32Array()
let counts = new Uint32Array()
let cursor = 0
let selectedType = ''
const timelineBinCount = 320
let timeline: Record<string, number[]> = Object.create(null)
let types: string[] = []

const buildTimeline = (): void => {
  types = [...new Set(dataset.sites.map((site) => site.type))].sort()
  timeline = Object.fromEntries(types.map((type) => [type, Array.from({ length: timelineBinCount }, () => 0)]))
  for (let index = 0; index < events.length; index++) {
    const site = dataset.sites[events[index]]
    const bin = Math.min(timelineBinCount - 1, Math.floor((index / Math.max(1, events.length)) * timelineBinCount))
    timeline[site.type][bin]++
  }
}

const moveCursor = (nextCursor: number): void => {
  nextCursor = Math.max(0, Math.min(events.length, Math.round(nextCursor)))
  if (nextCursor > cursor) {
    for (let index = cursor; index < nextCursor; index++) {
      counts[events[index]]++
    }
  } else {
    for (let index = cursor - 1; index >= nextCursor; index--) {
      counts[events[index]]--
    }
  }
  cursor = nextCursor
}

const publish = (): void => {
  const fileCounts: Record<string, number> = Object.create(null)
  const typeCounts: Record<string, number> = Object.create(null)
  for (let siteId = 0; siteId < counts.length; siteId++) {
    const count = counts[siteId]
    if (count === 0) {
      continue
    }
    const site = dataset.sites[siteId]
    typeCounts[site.type] = (typeCounts[site.type] || 0) + count
    if (!selectedType || site.type === selectedType) {
      const path = getSitePath(site)
      fileCounts[path] = (fileCounts[path] || 0) + count
    }
  }
  const message: TrackedEverythingAggregates & { readonly kind: 'aggregates' } = {
    cursor,
    fileCounts,
    kind: 'aggregates',
    siteCounts: Array.from(counts),
    timeline,
    typeCounts,
    types,
  }
  postMessage(message)
}

self.onmessage = (
  event: MessageEvent<
    | { readonly buffer: ArrayBuffer; readonly dataset: TrackedEverythingDataset; readonly kind: 'init' }
    | { readonly cursor: number; readonly kind: 'cursor'; readonly selectedType: string }
  >,
): void => {
  if (event.data.kind === 'init') {
    dataset = event.data.dataset
    events = new Uint32Array(event.data.buffer)
    counts = new Uint32Array(dataset.sites.length)
    buildTimeline()
    publish()
    return
  }
  selectedType = event.data.selectedType
  moveCursor(event.data.cursor)
  publish()
}
