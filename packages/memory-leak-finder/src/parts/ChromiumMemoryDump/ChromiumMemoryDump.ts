import type { Dynamic } from '../Types/Types.ts'

export interface ChromiumMemoryAttribute {
  readonly rawValue: unknown
  readonly type: string
  readonly units: string
  readonly value: number | string | boolean | null
}

export interface ChromiumMemoryAllocatorSnapshot {
  readonly attributes: Readonly<Record<string, ChromiumMemoryAttribute>>
  readonly effectiveSizeBytes: number | null
  readonly guid: string
  readonly path: string
  readonly pid: number
  readonly processName: string
  readonly sizeBytes: number | null
}

export interface ChromiumMemoryProcessTotals {
  readonly peakResidentSetBytes: number | null
  readonly privateFootprintBytes: number | null
  readonly residentSetBytes: number | null
}

export interface ChromiumMemoryProcessSnapshot extends ChromiumMemoryProcessTotals {
  readonly name: string
  readonly pid: number
}

export interface ChromiumMemoryOwnershipEdge {
  readonly importance: number
  readonly pid: number
  readonly source: string
  readonly target: string
  readonly type: string
}

export interface ChromiumMemoryDumpSnapshot {
  readonly allocators: readonly ChromiumMemoryAllocatorSnapshot[]
  readonly id: string
  readonly ownershipEdges: readonly ChromiumMemoryOwnershipEdge[]
  readonly processes: readonly ChromiumMemoryProcessSnapshot[]
  readonly timestamp: number
}

export interface ChromiumMemoryProcessComparison {
  readonly after: ChromiumMemoryProcessTotals | null
  readonly before: ChromiumMemoryProcessTotals | null
  readonly delta: ChromiumMemoryProcessTotals
  readonly displayName: string
  readonly isInspected: boolean
  readonly name: string
  readonly pid: number
}

export interface ChromiumMemoryAllocatorComparison {
  readonly after: ChromiumMemoryAllocatorSnapshot | null
  readonly before: ChromiumMemoryAllocatorSnapshot | null
  readonly deltaBytes: number | null
  readonly metric: 'effective_size' | 'size' | ''
  readonly path: string
  readonly pid: number
  readonly processName: string
  readonly selectedAfterBytes: number | null
  readonly selectedBeforeBytes: number | null
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
    readonly after: readonly ChromiumMemoryOwnershipEdge[]
    readonly before: readonly ChromiumMemoryOwnershipEdge[]
  }
  readonly processCount: number
  readonly processes: readonly ChromiumMemoryProcessComparison[]
  readonly supported: boolean
  readonly summary: {
    readonly largestAllocatorChanges: readonly {
      readonly deltaBytes: number
      readonly path: string
      readonly pid: number
      readonly processName: string
    }[]
    readonly largestProcessChanges: readonly {
      readonly deltaPrivateFootprintBytes: number
      readonly displayName: string
      readonly pid: number
    }[]
  }
  readonly unsupportedReason: string
}

interface MutableAllocatorSnapshot {
  attributes: Record<string, ChromiumMemoryAttribute>
  effectiveSizeBytes: number | null
  guid: string
  path: string
  pid: number
  processName: string
  sizeBytes: number | null
}

interface MutableProcessSnapshot {
  allocators: Map<string, MutableAllocatorSnapshot>
  name: string
  ownershipEdges: ChromiumMemoryOwnershipEdge[]
  peakResidentSetBytes: number | null
  pid: number
  privateFootprintBytes: number | null
  residentSetBytes: number | null
}

interface MutableDumpSnapshot {
  id: string
  processes: Map<number, MutableProcessSnapshot>
  timestamp: number
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value !== 'string' || !/^(?:0x)?[\da-f]+$/i.test(value)) {
    return null
  }
  const normalized = value.startsWith('0x') ? value.slice(2) : value
  const parsed = Number.parseInt(normalized, 16)
  return Number.isSafeInteger(parsed) ? parsed : null
}

const normalizeAttributeValue = (value: unknown): number | string | boolean | null => {
  const number = toNumber(value)
  if (number !== null) {
    return number
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
    return value
  }
  return null
}

const normalizeAttributes = (rawAttributes: Dynamic): Record<string, ChromiumMemoryAttribute> => {
  const attributes: Record<string, ChromiumMemoryAttribute> = {}
  if (!rawAttributes || typeof rawAttributes !== 'object') {
    return attributes
  }
  for (const [name, rawAttribute] of Object.entries(rawAttributes) as readonly [string, Dynamic][]) {
    attributes[name] = {
      rawValue: rawAttribute?.value,
      type: typeof rawAttribute?.type === 'string' ? rawAttribute.type : '',
      units: typeof rawAttribute?.units === 'string' ? rawAttribute.units : '',
      value: normalizeAttributeValue(rawAttribute?.value),
    }
  }
  return attributes
}

const getByteAttribute = (attributes: Readonly<Record<string, ChromiumMemoryAttribute>>, name: string): number | null => {
  const attribute = attributes[name]
  if (!attribute || attribute.units !== 'bytes' || typeof attribute.value !== 'number') {
    return null
  }
  return attribute.value
}

const getProcessNameMap = (traceEvents: readonly Dynamic[]): Map<number, string> => {
  const names = new Map<number, string>()
  for (const event of traceEvents) {
    if (event?.ph !== 'M' || event?.name !== 'process_name' || !Number.isFinite(event?.pid)) {
      continue
    }
    const name = event?.args?.name
    if (typeof name === 'string' && name) {
      names.set(event.pid, name)
    }
  }
  return names
}

const getDumpId = (event: Dynamic, index: number): string => {
  if (typeof event?.id === 'string' || typeof event?.id === 'number') {
    return String(event.id)
  }
  if (typeof event?.id2?.global === 'string' || typeof event?.id2?.global === 'number') {
    return String(event.id2.global)
  }
  return `unknown-${index}`
}

const getOrCreateDump = (dumps: Map<string, MutableDumpSnapshot>, event: Dynamic, index: number): MutableDumpSnapshot => {
  const id = getDumpId(event, index)
  const existing = dumps.get(id)
  if (existing) {
    existing.timestamp = Math.min(existing.timestamp, Number.isFinite(event?.ts) ? event.ts : existing.timestamp)
    return existing
  }
  const dump: MutableDumpSnapshot = {
    id,
    processes: new Map(),
    timestamp: Number.isFinite(event?.ts) ? event.ts : index,
  }
  dumps.set(id, dump)
  return dump
}

const getOrCreateProcess = (dump: MutableDumpSnapshot, pid: number, processNames: ReadonlyMap<number, string>): MutableProcessSnapshot => {
  const existing = dump.processes.get(pid)
  if (existing) {
    return existing
  }
  const process: MutableProcessSnapshot = {
    allocators: new Map(),
    name: processNames.get(pid) || `Process ${pid}`,
    ownershipEdges: [],
    peakResidentSetBytes: null,
    pid,
    privateFootprintBytes: null,
    residentSetBytes: null,
  }
  dump.processes.set(pid, process)
  return process
}

const addProcessTotals = (process: MutableProcessSnapshot, totals: Dynamic): void => {
  if (!totals || typeof totals !== 'object') {
    return
  }
  process.peakResidentSetBytes = toNumber(totals.peak_resident_set_size) ?? process.peakResidentSetBytes
  process.privateFootprintBytes = toNumber(totals.private_footprint_bytes) ?? process.privateFootprintBytes
  process.residentSetBytes = toNumber(totals.resident_set_bytes) ?? process.residentSetBytes
}

const addAllocators = (process: MutableProcessSnapshot, rawAllocators: Dynamic): void => {
  if (!rawAllocators || typeof rawAllocators !== 'object') {
    return
  }
  for (const [path, rawAllocator] of Object.entries(rawAllocators) as readonly [string, Dynamic][]) {
    const attributes = normalizeAttributes(rawAllocator?.attrs)
    const allocator: MutableAllocatorSnapshot = {
      attributes,
      effectiveSizeBytes: getByteAttribute(attributes, 'effective_size'),
      guid: typeof rawAllocator?.guid === 'string' ? rawAllocator.guid : '',
      path,
      pid: process.pid,
      processName: process.name,
      sizeBytes: getByteAttribute(attributes, 'size'),
    }
    const existing = process.allocators.get(path)
    if (existing) {
      existing.attributes = { ...existing.attributes, ...allocator.attributes }
      existing.effectiveSizeBytes = allocator.effectiveSizeBytes ?? existing.effectiveSizeBytes
      existing.guid = allocator.guid || existing.guid
      existing.sizeBytes = allocator.sizeBytes ?? existing.sizeBytes
    } else {
      process.allocators.set(path, allocator)
    }
  }
}

const addOwnershipEdges = (process: MutableProcessSnapshot, rawEdges: Dynamic): void => {
  if (!Array.isArray(rawEdges)) {
    return
  }
  for (const edge of rawEdges) {
    if (typeof edge?.source !== 'string' || typeof edge?.target !== 'string') {
      continue
    }
    process.ownershipEdges.push({
      importance: Number.isFinite(edge?.importance) ? edge.importance : 0,
      pid: process.pid,
      source: edge.source,
      target: edge.target,
      type: typeof edge?.type === 'string' ? edge.type : '',
    })
  }
}

export const getDetailedDumpSnapshots = (traceEvents: readonly Dynamic[]): readonly ChromiumMemoryDumpSnapshot[] => {
  const processNames = getProcessNameMap(traceEvents)
  const dumps = new Map<string, MutableDumpSnapshot>()
  for (let index = 0; index < traceEvents.length; index++) {
    const event = traceEvents[index]
    const rawDump = event?.args?.dumps
    if (!rawDump || rawDump.level_of_detail !== 'detailed' || !Number.isFinite(event?.pid)) {
      continue
    }
    const dump = getOrCreateDump(dumps, event, index)
    const process = getOrCreateProcess(dump, event.pid, processNames)
    addProcessTotals(process, rawDump.process_totals)
    addAllocators(process, rawDump.allocators)
    addOwnershipEdges(process, rawDump.allocators_graph)
  }
  return [...dumps.values()]
    .toSorted((left, right) => left.timestamp - right.timestamp || left.id.localeCompare(right.id))
    .map((dump) => {
      const processes = [...dump.processes.values()].toSorted((left, right) => left.pid - right.pid)
      return {
        allocators: processes.flatMap((process) =>
          [...process.allocators.values()].toSorted((left, right) => left.path.localeCompare(right.path)),
        ),
        id: dump.id,
        ownershipEdges: processes.flatMap((process) => process.ownershipEdges),
        processes: processes.map((process) => ({
          name: process.name,
          peakResidentSetBytes: process.peakResidentSetBytes,
          pid: process.pid,
          privateFootprintBytes: process.privateFootprintBytes,
          residentSetBytes: process.residentSetBytes,
        })),
        timestamp: dump.timestamp,
      }
    })
}

const subtractNullable = (after: number | null | undefined, before: number | null | undefined): number | null => {
  if (after === null || after === undefined || before === null || before === undefined) {
    return null
  }
  return after - before
}

const compareProcesses = (
  before: ChromiumMemoryDumpSnapshot,
  after: ChromiumMemoryDumpSnapshot,
  inspectedPid: number | undefined,
): readonly ChromiumMemoryProcessComparison[] => {
  const beforeMap = new Map(before.processes.map((process) => [process.pid, process]))
  const afterMap = new Map(after.processes.map((process) => [process.pid, process]))
  const pids = new Set([...beforeMap.keys(), ...afterMap.keys()])
  return [...pids]
    .map((pid) => {
      const beforeProcess = beforeMap.get(pid) || null
      const afterProcess = afterMap.get(pid) || null
      const name = afterProcess?.name || beforeProcess?.name || `Process ${pid}`
      const isInspected = pid === inspectedPid
      return {
        after: afterProcess
          ? {
              peakResidentSetBytes: afterProcess.peakResidentSetBytes,
              privateFootprintBytes: afterProcess.privateFootprintBytes,
              residentSetBytes: afterProcess.residentSetBytes,
            }
          : null,
        before: beforeProcess
          ? {
              peakResidentSetBytes: beforeProcess.peakResidentSetBytes,
              privateFootprintBytes: beforeProcess.privateFootprintBytes,
              residentSetBytes: beforeProcess.residentSetBytes,
            }
          : null,
        delta: {
          peakResidentSetBytes: subtractNullable(afterProcess?.peakResidentSetBytes, beforeProcess?.peakResidentSetBytes),
          privateFootprintBytes: subtractNullable(afterProcess?.privateFootprintBytes, beforeProcess?.privateFootprintBytes),
          residentSetBytes: subtractNullable(afterProcess?.residentSetBytes, beforeProcess?.residentSetBytes),
        },
        displayName: `${name} (PID ${pid})${isInspected ? ' — inspected' : ''}`,
        isInspected,
        name,
        pid,
      }
    })
    .toSorted(
      (left, right) =>
        (right.after?.privateFootprintBytes || 0) - (left.after?.privateFootprintBytes || 0) ||
        left.displayName.localeCompare(right.displayName),
    )
}

const getAllocatorMetric = (
  before: ChromiumMemoryAllocatorSnapshot | null,
  after: ChromiumMemoryAllocatorSnapshot | null,
): 'effective_size' | 'size' | '' => {
  if ((!before || before.effectiveSizeBytes !== null) && (!after || after.effectiveSizeBytes !== null)) {
    return 'effective_size'
  }
  if ((!before || before.sizeBytes !== null) && (!after || after.sizeBytes !== null)) {
    return 'size'
  }
  return ''
}

const getSelectedBytes = (allocator: ChromiumMemoryAllocatorSnapshot | null, metric: 'effective_size' | 'size' | ''): number | null => {
  if (!allocator) {
    return metric ? 0 : null
  }
  if (metric === 'effective_size') {
    return allocator.effectiveSizeBytes
  }
  if (metric === 'size') {
    return allocator.sizeBytes
  }
  return null
}

const getAllocatorKey = (allocator: ChromiumMemoryAllocatorSnapshot): string => `${allocator.pid}\0${allocator.path}`

const compareAllocators = (
  before: ChromiumMemoryDumpSnapshot,
  after: ChromiumMemoryDumpSnapshot,
): readonly ChromiumMemoryAllocatorComparison[] => {
  const beforeMap = new Map(before.allocators.map((allocator) => [getAllocatorKey(allocator), allocator]))
  const afterMap = new Map(after.allocators.map((allocator) => [getAllocatorKey(allocator), allocator]))
  const keys = new Set([...beforeMap.keys(), ...afterMap.keys()])
  return [...keys]
    .map((key) => {
      const beforeAllocator = beforeMap.get(key) || null
      const afterAllocator = afterMap.get(key) || null
      const allocator = afterAllocator || beforeAllocator!
      const metric = getAllocatorMetric(beforeAllocator, afterAllocator)
      const selectedBeforeBytes = getSelectedBytes(beforeAllocator, metric)
      const selectedAfterBytes = getSelectedBytes(afterAllocator, metric)
      return {
        after: afterAllocator,
        before: beforeAllocator,
        deltaBytes: subtractNullable(selectedAfterBytes, selectedBeforeBytes),
        metric,
        path: allocator.path,
        pid: allocator.pid,
        processName: allocator.processName,
        selectedAfterBytes,
        selectedBeforeBytes,
      }
    })
    .toSorted(
      (left, right) =>
        Math.abs(right.deltaBytes || 0) - Math.abs(left.deltaBytes || 0) ||
        left.processName.localeCompare(right.processName) ||
        left.path.localeCompare(right.path),
    )
}

const emptyResult = (overrides: Partial<ChromiumMemoryDumpResult> = {}): ChromiumMemoryDumpResult => ({
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
  supported: true,
  summary: {
    largestAllocatorChanges: [],
    largestProcessChanges: [],
  },
  unsupportedReason: '',
  ...overrides,
})

export const createUnsupportedResult = (unsupportedReason: string): ChromiumMemoryDumpResult => {
  return emptyResult({ supported: false, unsupportedReason })
}

export const createChromiumMemoryDumpResult = (
  traceEvents: readonly Dynamic[],
  dataLossOccurred: boolean,
  inspectedPid?: number,
): ChromiumMemoryDumpResult => {
  const dumps = getDetailedDumpSnapshots(traceEvents)
  if (dumps.length < 2) {
    return emptyResult({
      dataLossOccurred,
      dumpCount: dumps.length,
      unsupportedReason: `Expected two detailed Chromium memory dumps, received ${dumps.length}`,
    })
  }
  const before = dumps[0]
  const after = dumps.at(-1)!
  const processes = compareProcesses(before, after, inspectedPid)
  const allocators = compareAllocators(before, after)
  const complete = dumps.length === 2 && !dataLossOccurred
  const largestProcessChanges = processes
    .filter((process) => process.delta.privateFootprintBytes !== null)
    .toSorted((left, right) => Math.abs(right.delta.privateFootprintBytes || 0) - Math.abs(left.delta.privateFootprintBytes || 0))
    .slice(0, 5)
    .map((process) => ({
      deltaPrivateFootprintBytes: process.delta.privateFootprintBytes!,
      displayName: process.displayName,
      pid: process.pid,
    }))
  const largestAllocatorChanges = allocators
    .filter((allocator) => allocator.deltaBytes !== null)
    .toSorted((left, right) => Math.abs(right.deltaBytes || 0) - Math.abs(left.deltaBytes || 0))
    .slice(0, 5)
    .map((allocator) => ({
      deltaBytes: allocator.deltaBytes!,
      path: allocator.path,
      pid: allocator.pid,
      processName: allocator.processName,
    }))
  return {
    allocatorCount: after.allocators.length,
    allocators,
    complete,
    dataLossOccurred,
    dumpCount: dumps.length,
    isLeak: false,
    levelOfDetail: 'detailed',
    ownershipEdges: {
      after: after.ownershipEdges,
      before: before.ownershipEdges,
    },
    processCount: after.processes.length,
    processes,
    supported: true,
    summary: {
      largestAllocatorChanges,
      largestProcessChanges,
    },
    unsupportedReason: complete
      ? ''
      : dataLossOccurred
        ? 'Chromium reported trace data loss'
        : `Expected exactly two detailed Chromium memory dumps, received ${dumps.length}`,
  }
}

const formatBytes = (value: number | null): string => {
  if (value === null) {
    return 'unavailable'
  }
  const sign = value > 0 ? '+' : ''
  const absolute = Math.abs(value)
  if (absolute < 1024) {
    return `${sign}${value} B`
  }
  if (absolute < 1024 * 1024) {
    return `${sign}${(value / 1024).toFixed(1)} KiB`
  }
  return `${sign}${(value / 1024 / 1024).toFixed(2)} MiB`
}

export const formatChromiumMemoryDumpSummary = (result: ChromiumMemoryDumpResult): string => {
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
  return lines.join('\n')
}
