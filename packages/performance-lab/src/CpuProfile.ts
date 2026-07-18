import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SourceMapConsumer, type RawSourceMap } from 'source-map'

type Dynamic = any

interface ResolvedFrame {
  readonly column: number
  readonly functionName: string
  readonly line: number
  readonly source: string
}

export interface Hotspot {
  readonly column: number
  readonly functionName: string
  readonly line: number
  readonly selfTimeMs: number
  readonly source: string
  readonly totalTimeMs: number
}

export interface ProfileEdge {
  readonly caller: string
  readonly callee: string
  readonly totalTimeMs: number
}

export interface ProfileSummary {
  readonly accountedJavaScriptMs: number
  readonly amdahlMaximumImprovement: number
  readonly garbageCollectorMs: number
  readonly hotspots: readonly Hotspot[]
  readonly idleMs: number
  readonly nextDiagnostics: readonly string[]
  readonly programMs: number
  readonly topCallEdges: readonly ProfileEdge[]
  readonly totalTimeMs: number
}

interface MutableHotspot {
  column: number
  functionName: string
  line: number
  selfTimeMs: number
  source: string
  totalTimeMs: number
}

const toArray = (value: Dynamic): readonly Dynamic[] => (Array.isArray(value) ? value : [])
const toNumber = (value: Dynamic): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0)
const toString = (value: Dynamic): string => (typeof value === 'string' ? value : '')

const getSampleTimes = (profile: Dynamic): readonly number[] => {
  const samples = toArray(profile?.samples)
  const deltas = toArray(profile?.timeDeltas)
  if (deltas.length >= samples.length) {
    return deltas.slice(0, samples.length).map((value) => toNumber(value) / 1000)
  }
  const total = (toNumber(profile?.endTime) - toNumber(profile?.startTime)) / 1000
  const sample = samples.length === 0 ? 0 : total / samples.length
  return samples.map(() => sample)
}

const getBundleRelativePath = (url: string): string => {
  const marker = '/resources/app/out/'
  const index = url.indexOf(marker)
  return index === -1 ? '' : url.slice(index + marker.length)
}

class FrameResolver {
  private readonly consumerPromises = new Map<string, Promise<SourceMapConsumer | undefined>>()
  private readonly framePromises = new Map<string, Promise<ResolvedFrame>>()
  private readonly sourceRoot: string | undefined

  constructor(sourceRoot: string | undefined) {
    this.sourceRoot = sourceRoot
  }

  private async getConsumer(url: string): Promise<SourceMapConsumer | undefined> {
    if (!this.sourceRoot) {
      return undefined
    }
    const relativePath = getBundleRelativePath(url)
    if (!relativePath) {
      return undefined
    }
    const mapPath = join(this.sourceRoot, 'out-vscode-min', `${relativePath}.map`)
    let promise = this.consumerPromises.get(mapPath)
    if (!promise) {
      promise = readFile(mapPath, 'utf8')
        .then((content) => new SourceMapConsumer(JSON.parse(content) as RawSourceMap))
        .catch(() => undefined)
      this.consumerPromises.set(mapPath, promise)
    }
    return promise
  }

  resolve(frame: Dynamic): Promise<ResolvedFrame> {
    const callFrame = frame?.callFrame || {}
    const url = toString(callFrame.url)
    const line = toNumber(callFrame.lineNumber) + 1
    const column = toNumber(callFrame.columnNumber) + 1
    const functionName = toString(callFrame.functionName) || '(anonymous)'
    const key = `${url}:${line}:${column}:${functionName}`
    let promise = this.framePromises.get(key)
    if (!promise) {
      promise = this.doResolve({ column, functionName, line, source: url })
      this.framePromises.set(key, promise)
    }
    return promise
  }

  private async doResolve(frame: ResolvedFrame): Promise<ResolvedFrame> {
    const consumer = await this.getConsumer(frame.source)
    if (!consumer) {
      return frame
    }
    const original = consumer.originalPositionFor({
      column: Math.max(0, frame.column - 1),
      line: Math.max(1, frame.line),
    })
    if (!original.source || original.line === null || original.column === null) {
      return frame
    }
    return {
      column: original.column + 1,
      functionName: original.name || frame.functionName,
      line: original.line,
      source: original.source,
    }
  }
}

const getParentMap = (nodes: readonly Dynamic[]): Map<number, number> => {
  const parents = new Map<number, number>()
  for (const node of nodes) {
    const parentId = toNumber(node?.id)
    for (const child of toArray(node?.children)) {
      parents.set(toNumber(child), parentId)
    }
  }
  return parents
}

const getStack = (sampleId: number, nodes: Map<number, Dynamic>, parents: Map<number, number>): readonly Dynamic[] => {
  const stack: Dynamic[] = []
  const seen = new Set<number>()
  let current = sampleId
  while (current && !seen.has(current)) {
    seen.add(current)
    const node = nodes.get(current)
    if (node) {
      stack.push(node)
    }
    current = parents.get(current) || 0
  }
  return stack.reverse()
}

const hotspotKey = (frame: ResolvedFrame): string => {
  return `${frame.source}:${frame.line}:${frame.column}:${frame.functionName}`
}

export const summarizeProfiles = async (profiles: readonly Dynamic[], sourceRoot?: string): Promise<ProfileSummary> => {
  const resolver = new FrameResolver(sourceRoot)
  const hotspots = new Map<string, MutableHotspot>()
  const callEdges = new Map<string, ProfileEdge>()
  let totalTimeMs = 0
  let programMs = 0
  let idleMs = 0
  let garbageCollectorMs = 0

  for (const profile of profiles) {
    const rawNodes = toArray(profile?.nodes)
    const nodes = new Map(rawNodes.map((node) => [toNumber(node?.id), node]))
    const parents = getParentMap(rawNodes)
    const samples = toArray(profile?.samples)
    const times = getSampleTimes(profile)
    for (let index = 0; index < samples.length; index++) {
      const duration = times[index] || 0
      totalTimeMs += duration
      const stack = getStack(toNumber(samples[index]), nodes, parents)
      const leafName = toString(stack.at(-1)?.callFrame?.functionName)
      if (leafName === '(program)') {
        programMs += duration
      } else if (leafName === '(idle)') {
        idleMs += duration
      } else if (leafName === '(garbage collector)') {
        garbageCollectorMs += duration
      }
      const resolvedStack = await Promise.all(stack.map((node) => resolver.resolve(node)))
      for (const frame of resolvedStack) {
        if (!frame.source) {
          continue
        }
        const key = hotspotKey(frame)
        const hotspot = hotspots.get(key) || {
          ...frame,
          selfTimeMs: 0,
          totalTimeMs: 0,
        }
        hotspot.totalTimeMs += duration
        hotspots.set(key, hotspot)
      }
      for (let stackIndex = 1; stackIndex < resolvedStack.length; stackIndex++) {
        const caller = resolvedStack[stackIndex - 1]
        const callee = resolvedStack[stackIndex]
        if (!caller.source || !callee.source) {
          continue
        }
        const callerKey = hotspotKey(caller)
        const calleeKey = hotspotKey(callee)
        const edgeKey = `${callerKey}->${calleeKey}`
        const previous = callEdges.get(edgeKey)
        callEdges.set(edgeKey, {
          caller: callerKey,
          callee: calleeKey,
          totalTimeMs: (previous?.totalTimeMs || 0) + duration,
        })
      }
      const leaf = resolvedStack.at(-1)
      if (leaf?.source) {
        const hotspot = hotspots.get(hotspotKey(leaf))
        if (hotspot) {
          hotspot.selfTimeMs += duration
        }
      }
    }
  }

  const ordered = [...hotspots.values()].sort((a, b) => b.selfTimeMs - a.selfTimeMs || b.totalTimeMs - a.totalTimeMs).slice(0, 50)
  const accountedJavaScriptMs = Math.max(0, totalTimeMs - programMs - idleMs - garbageCollectorMs)
  const hottestSelfTime = ordered[0]?.selfTimeMs || 0
  const nextDiagnostics: string[] = []
  if (totalTimeMs > 0 && garbageCollectorMs / totalTimeMs >= 0.1) {
    nextDiagnostics.push('gc-statistics', 'tracked-allocation-performance')
  }
  if (totalTimeMs > 0 && programMs / totalTimeMs >= 0.3) {
    nextDiagnostics.push('native-perf-record', 'callgrind')
  }
  if (totalTimeMs > 0 && accountedJavaScriptMs / totalTimeMs < 0.3) {
    nextDiagnostics.push('ipc-and-off-cpu-trace')
  }
  return {
    accountedJavaScriptMs,
    amdahlMaximumImprovement: totalTimeMs === 0 ? 0 : hottestSelfTime / totalTimeMs,
    garbageCollectorMs,
    hotspots: ordered,
    idleMs,
    nextDiagnostics: [...new Set(nextDiagnostics)],
    programMs,
    topCallEdges: [...callEdges.values()].sort((a, b) => b.totalTimeMs - a.totalTimeMs).slice(0, 50),
    totalTimeMs,
  }
}

export const diffProfileSummaries = (baseline: ProfileSummary, candidate: ProfileSummary) => {
  const baselineMap = new Map(
    baseline.hotspots.map((hotspot) => [`${hotspot.source}:${hotspot.line}:${hotspot.column}:${hotspot.functionName}`, hotspot]),
  )
  const candidateMap = new Map(
    candidate.hotspots.map((hotspot) => [`${hotspot.source}:${hotspot.line}:${hotspot.column}:${hotspot.functionName}`, hotspot]),
  )
  return [...new Set([...baselineMap.keys(), ...candidateMap.keys()])]
    .map((key) => {
      const before = baselineMap.get(key)
      const after = candidateMap.get(key)
      return {
        column: after?.column || before?.column || 0,
        functionName: after?.functionName || before?.functionName || '',
        line: after?.line || before?.line || 0,
        selfTimeDeltaMs: (after?.selfTimeMs || 0) - (before?.selfTimeMs || 0),
        source: after?.source || before?.source || '',
        totalTimeDeltaMs: (after?.totalTimeMs || 0) - (before?.totalTimeMs || 0),
      }
    })
    .sort((a, b) => Math.abs(b.selfTimeDeltaMs) - Math.abs(a.selfTimeDeltaMs))
    .slice(0, 50)
}
