import prettyBytes from 'pretty-bytes'

interface ChromiumMemoryProcessTotals {
  readonly privateFootprintBytes: number | null
}

interface ChromiumMemoryProcessComparison {
  readonly delta: ChromiumMemoryProcessTotals
  readonly displayName: string
}

interface ChromiumMemoryAllocatorComparison {
  readonly deltaBytes: number | null
  readonly path: string
  readonly pid: number
  readonly processName: string
}

interface ChromiumMemoryPeriodicProcess {
  readonly displayName: string
  readonly peakResidentSetBytes: {
    readonly max: number | null
    readonly resettable: boolean
  }
  readonly privateFootprintBytes: {
    readonly max: number | null
  }
}

interface ChromiumMemoryPeriodicResult {
  readonly maxTotalPrivateFootprintBytes: number | null
  readonly medianIntervalMs: number | null
  readonly outsideEndpointWindowCount: number
  readonly processes: readonly ChromiumMemoryPeriodicProcess[]
  readonly requestedIntervalMs: number
  readonly sampleCount: number
}

export interface ChromiumMemoryDumpResult {
  readonly allocatorCount: number
  readonly allocators: readonly ChromiumMemoryAllocatorComparison[]
  readonly complete: boolean
  readonly dataLossOccurred: boolean
  readonly dumpCount: number
  readonly isLeak: false
  readonly levelOfDetail: 'detailed'
  readonly ownershipEdges: {
    readonly after: readonly unknown[]
    readonly before: readonly unknown[]
  }
  readonly periodic?: ChromiumMemoryPeriodicResult
  readonly processCount: number
  readonly processes: readonly ChromiumMemoryProcessComparison[]
  readonly supported: boolean
  readonly summary: {
    readonly largestAllocatorChanges: readonly unknown[]
    readonly largestProcessChanges: readonly unknown[]
  }
  readonly unsupportedReason: string
}

export function createUnsupportedResult(unsupportedReason: string): ChromiumMemoryDumpResult {
  return {
    allocatorCount: 0,
    allocators: [],
    complete: false,
    dataLossOccurred: false,
    dumpCount: 0,
    isLeak: false,
    levelOfDetail: 'detailed',
    ownershipEdges: {
      after: [],
      before: [],
    },
    processCount: 0,
    processes: [],
    supported: false,
    summary: {
      largestAllocatorChanges: [],
      largestProcessChanges: [],
    },
    unsupportedReason,
  }
}

function formatBytes(value: number | null): string {
  if (value === null) {
    return 'unavailable'
  }
  return prettyBytes(value, { binary: true, signed: true }).trimStart()
}

function formatSize(value: number | null): string {
  if (value === null) {
    return 'unavailable'
  }
  return prettyBytes(value, { binary: true })
}

function addPeriodicLines(lines: string[], periodic: ChromiumMemoryPeriodicResult): void {
  const interval = periodic.medianIntervalMs === null ? 'unavailable' : `${periodic.medianIntervalMs} ms`
  lines.push(
    `Periodic light dumps: ${periodic.sampleCount} (requested every ${periodic.requestedIntervalMs} ms, median ${interval}, outside window: ${periodic.outsideEndpointWindowCount})`,
    `Sampled peak total private footprint: ${formatSize(periodic.maxTotalPrivateFootprintBytes)}`,
    'Largest sampled private-footprint peaks:',
  )
  for (const process of periodic.processes.slice(0, 5)) {
    const peakRss = process.peakResidentSetBytes.resettable ? formatSize(process.peakResidentSetBytes.max) : 'not resettable'
    lines.push(`${process.displayName} | ${formatSize(process.privateFootprintBytes.max)} | peak RSS ${peakRss}`)
  }
}

export function formatChromiumMemoryDumpSummary(result: ChromiumMemoryDumpResult): string {
  if (!result.supported || !result.complete) {
    return `Chromium detailed memory dump unavailable: ${result.unsupportedReason || 'capture incomplete'}`
  }
  const processRows = result.processes
    .filter((process) => process.delta.privateFootprintBytes !== null)
    .toSorted((left, right) => Math.abs(right.delta.privateFootprintBytes || 0) - Math.abs(left.delta.privateFootprintBytes || 0))
    .slice(0, 5)
  const allocatorRows = result.allocators
    .filter((allocator) => (allocator.deltaBytes || 0) > 0)
    .toSorted((left, right) => (right.deltaBytes || 0) - (left.deltaBytes || 0))
    .slice(0, 5)
  const lines = [
    'Chromium detailed memory dump:',
    `dumps: ${result.dumpCount}, processes: ${result.processCount}, allocators: ${result.allocatorCount}`,
    'Largest private-footprint changes:',
  ]
  for (const process of processRows) {
    lines.push(`${process.displayName} | ${formatBytes(process.delta.privateFootprintBytes)}`)
  }
  lines.push('Largest allocator growth:')
  for (const allocator of allocatorRows) {
    lines.push(`${allocator.processName} (PID ${allocator.pid}) | ${allocator.path} | ${formatBytes(allocator.deltaBytes)}`)
  }
  if (result.periodic) {
    addPeriodicLines(lines, result.periodic)
  }
  return lines.join('\n')
}
