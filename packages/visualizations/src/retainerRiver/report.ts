export const RetainerRiverSchemaVersion = 1

export type RetainerRiverStage = 'root' | 'service' | 'retainer' | 'leak'

export interface RetainerRiverSourceLocation {
  readonly column: number
  readonly line: number
  readonly name?: string
  readonly scriptId?: number
  readonly source: string
}

export interface RetainerRiverStackFrame {
  readonly functionName: string
  readonly generated?: RetainerRiverSourceLocation
  readonly original?: RetainerRiverSourceLocation
}

export interface RetainerRiverPathSegment {
  readonly edgeType: string
  readonly property: string
  readonly sourceName: string
  readonly sourceType: string
  readonly targetName: string
}

export interface RetainerRiverEvidence {
  readonly allocationStack: readonly RetainerRiverStackFrame[]
  readonly leakedObject: string
  readonly leakedObjectStack: readonly RetainerRiverStackFrame[]
  readonly path: readonly RetainerRiverPathSegment[]
  readonly retainingLocation?: RetainerRiverSourceLocation
  readonly retainingProperty: string
}

export interface RetainerRiverNode {
  readonly id: string
  readonly inferred?: boolean
  readonly kind: string
  readonly label: string
  readonly objectCount: number
  readonly retainedBytes: number
  readonly stage: RetainerRiverStage
}

export interface RetainerRiverLink {
  readonly evidence: readonly RetainerRiverEvidence[]
  readonly flowId: string
  readonly id: string
  readonly objectCount: number
  readonly retainedBytes: number
  readonly source: string
  readonly target: string
}

export interface RetainerRiverReport {
  readonly generatedAt: string
  readonly isLeak: boolean
  readonly links: readonly RetainerRiverLink[]
  readonly metadata: {
    readonly processType: string
    readonly runs: number
    readonly testName: string
  }
  readonly nodes: readonly RetainerRiverNode[]
  readonly schemaVersion: typeof RetainerRiverSchemaVersion
  readonly summary: {
    readonly leakedObjects: number
    readonly retainedBytes: number
    readonly retainingPaths: number
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const validateRetainerRiverReport = (value: unknown): RetainerRiverReport => {
  if (!isRecord(value)) {
    throw new TypeError('Report must be an object')
  }
  if (value.schemaVersion !== RetainerRiverSchemaVersion) {
    throw new TypeError(`Unsupported report schema version: ${String(value.schemaVersion)}`)
  }
  if (!Array.isArray(value.nodes) || !Array.isArray(value.links)) {
    throw new TypeError('Report must contain nodes and links arrays')
  }
  if (!isRecord(value.metadata) || !isRecord(value.summary)) {
    throw new TypeError('Report metadata or summary is missing')
  }

  const nodeIds = new Set<string>()
  for (const node of value.nodes) {
    if (!isRecord(node) || typeof node.id !== 'string' || typeof node.label !== 'string') {
      throw new TypeError('Every report node must have a string id and label')
    }
    if (!['root', 'service', 'retainer', 'leak'].includes(String(node.stage))) {
      throw new TypeError(`Invalid node stage: ${String(node.stage)}`)
    }
    if (typeof node.retainedBytes !== 'number' || node.retainedBytes < 0) {
      throw new TypeError(`Invalid retained byte count for node ${node.id}`)
    }
    nodeIds.add(node.id)
  }

  for (const link of value.links) {
    if (!isRecord(link) || typeof link.id !== 'string' || typeof link.source !== 'string' || typeof link.target !== 'string') {
      throw new TypeError('Every report link must have string id, source, and target fields')
    }
    if (!nodeIds.has(link.source) || !nodeIds.has(link.target)) {
      throw new TypeError(`Link ${link.id} references an unknown node`)
    }
    if (typeof link.retainedBytes !== 'number' || link.retainedBytes <= 0 || !Array.isArray(link.evidence)) {
      throw new TypeError(`Invalid retained byte count or evidence for link ${link.id}`)
    }
  }

  return value as unknown as RetainerRiverReport
}

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2
  return `${value.toFixed(digits)} ${units[unitIndex]}`
}

export const getFilteredReport = (report: RetainerRiverReport, query: string, minimumBytes: number): RetainerRiverReport => {
  const normalizedQuery = query.trim().toLowerCase()
  const nodeById = new Map(report.nodes.map((node) => [node.id, node]))
  const matchingFlowIds = new Set<string>()

  for (const link of report.links) {
    if (link.retainedBytes < minimumBytes) {
      continue
    }
    const source = nodeById.get(link.source)
    const target = nodeById.get(link.target)
    const searchable = [
      source?.label,
      target?.label,
      ...link.evidence.flatMap((item) => [
        item.retainingProperty,
        item.leakedObject,
        ...item.path.flatMap((segment) => [segment.property, segment.sourceName, segment.targetName]),
      ]),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!normalizedQuery || searchable.includes(normalizedQuery)) {
      matchingFlowIds.add(link.flowId)
    }
  }

  const links = report.links.filter((link) => link.retainedBytes >= minimumBytes && matchingFlowIds.has(link.flowId))
  const visibleNodeIds = new Set(links.flatMap((link) => [link.source, link.target]))
  const nodes = report.nodes.filter((node) => visibleNodeIds.has(node.id))

  return {
    ...report,
    links,
    nodes,
  }
}
