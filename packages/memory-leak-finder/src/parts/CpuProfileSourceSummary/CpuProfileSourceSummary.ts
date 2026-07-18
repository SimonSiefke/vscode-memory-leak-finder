import type { ScriptMap } from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'
import * as ResolveTrackedLocationSourceMaps from '../ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts'
import type { Dynamic } from '../Types/Types.ts'

export interface CpuProfileSourceMetrics {
  readonly javascriptSelfTimeMs: number
  readonly profileTotalTimeMs: number
  readonly sampleCount: number
}

export interface CpuProfileSourceSummary {
  readonly metrics: CpuProfileSourceMetrics
  readonly sourceSelfTime: Readonly<Record<string, number>>
}

const MicrosecondToMillisecond = 1000
const MillisecondPrecision = 1000

const toArray = (value: Dynamic): readonly Dynamic[] => {
  return Array.isArray(value) ? value : []
}

const toNumber = (value: Dynamic): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

const toString = (value: Dynamic): string => {
  return typeof value === 'string' ? value : ''
}

const roundMetricValue = (value: number): number => {
  return Math.round((value + Number.EPSILON) * MillisecondPrecision) / MillisecondPrecision
}

const getSampleTimes = (profile: Dynamic, samples: readonly Dynamic[]): readonly number[] => {
  const timeDeltas = toArray(profile?.timeDeltas)
  if (timeDeltas.length >= samples.length) {
    return timeDeltas.slice(0, samples.length).map((value) => roundMetricValue(toNumber(value) / MicrosecondToMillisecond))
  }
  const totalTimeUs = toNumber(profile?.endTime) - toNumber(profile?.startTime)
  const sampleTimeMs = samples.length === 0 ? 0 : roundMetricValue(totalTimeUs / MicrosecondToMillisecond / samples.length)
  return samples.map(() => sampleTimeMs)
}

const getGeneratedLocation = (node: Dynamic): string => {
  const callFrame = node?.callFrame || {}
  const url = toString(callFrame.url)
  if (!url) {
    return ''
  }
  const line = Math.max(0, toNumber(callFrame.lineNumber)) + 1
  const column = Math.max(0, toNumber(callFrame.columnNumber)) + 1
  return `${url}:${line}:${column}`
}

export const getCpuProfileSourceSummary = async (profile: Dynamic, scriptMap: ScriptMap | undefined): Promise<CpuProfileSourceSummary> => {
  const nodes = toArray(profile?.nodes)
  const samples = toArray(profile?.samples)
  const sampleTimes = getSampleTimes(profile, samples)
  const nodeMap = new Map<number, Dynamic>()
  const nodeLocations = new Map<number, string>()

  for (const node of nodes) {
    const id = toNumber(node?.id)
    if (!id) {
      continue
    }
    nodeMap.set(id, node)
    const location = getGeneratedLocation(node)
    if (location) {
      nodeLocations.set(id, location)
    }
  }

  const locations = [...new Set(nodeLocations.values())]
  const resolvedLocations = await ResolveTrackedLocationSourceMaps.resolveTrackedLocationSourceMaps(locations, scriptMap)
  const sourceSelfTime: Record<string, number> = Object.create(null)
  let javascriptSelfTimeMs = 0
  let profileTotalTimeMs = 0

  for (let index = 0; index < samples.length; index++) {
    const sampleTimeMs = sampleTimes[index] || 0
    profileTotalTimeMs = roundMetricValue(profileTotalTimeMs + sampleTimeMs)
    const nodeId = toNumber(samples[index])
    const node = nodeMap.get(nodeId)
    const location = nodeLocations.get(nodeId)
    if (!node || !location) {
      continue
    }
    const url = toString(node.callFrame?.url)
    if (!url) {
      continue
    }
    javascriptSelfTimeMs = roundMetricValue(javascriptSelfTimeMs + sampleTimeMs)
    const source = resolvedLocations[location]?.originalSource || url
    sourceSelfTime[source] = roundMetricValue((sourceSelfTime[source] || 0) + sampleTimeMs)
  }

  return {
    metrics: {
      javascriptSelfTimeMs,
      profileTotalTimeMs,
      sampleCount: samples.length,
    },
    sourceSelfTime,
  }
}
