import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { readJson } from '../ReadJson/ReadJson.ts'

type Dynamic = any

interface CpuProfileNodeInfo {
  readonly colorKey: string
  readonly id: number
  readonly location: string
  readonly name: string
}

interface OpenCpuProfileFrame {
  readonly colorKey: string
  readonly depth: number
  readonly id: number
  readonly location: string
  readonly name: string
  readonly startMs: number
}

export interface CpuProfileFrame {
  readonly colorKey: string
  readonly depth: number
  readonly durationMs: number
  readonly hitCount: number
  readonly location: string
  readonly name: string
  readonly selfTimeMs: number
  readonly startMs: number
  readonly totalTimeMs: number
}

const MicrosecondToMillisecond = 1000
const MillisecondPrecision = 1000
const AnonymousFunctionName = '(anonymous)'

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

const getFunctionName = (node: Dynamic): string => {
  const functionName = toString(node?.callFrame?.functionName)
  return functionName || AnonymousFunctionName
}

const getLocation = (node: Dynamic): string => {
  const callFrame = node?.callFrame || {}
  const url = toString(callFrame.url)
  if (!url) {
    return ''
  }
  return `${url}:${toNumber(callFrame.lineNumber)}:${toNumber(callFrame.columnNumber)}`
}

const getProfile = (rawData: Dynamic): Dynamic => {
  if (rawData?.cpuProfile?.raw?.after?.nodes) {
    return rawData.cpuProfile.raw.after
  }
  if (rawData?.raw?.after?.nodes) {
    return rawData.raw.after
  }
  if (rawData?.profile?.nodes) {
    return rawData.profile
  }
  if (rawData?.cpuProfile?.profile?.nodes) {
    return rawData.cpuProfile.profile
  }
  if (rawData?.cpuProfile?.nodes) {
    return rawData.cpuProfile
  }
  return rawData
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

const createNodeInfo = (node: Dynamic): CpuProfileNodeInfo => {
  const id = toNumber(node?.id)
  const name = getFunctionName(node)
  const location = getLocation(node)
  return {
    colorKey: location || name,
    id,
    location,
    name,
  }
}

const getStack = (
  sampleId: number,
  nodeMap: Map<number, CpuProfileNodeInfo>,
  parentMap: Map<number, number>,
): readonly CpuProfileNodeInfo[] => {
  const stack: CpuProfileNodeInfo[] = []
  const seen = new Set<number>()
  let currentId = sampleId
  while (currentId && !seen.has(currentId)) {
    seen.add(currentId)
    const node = nodeMap.get(currentId)
    if (node) {
      stack.push(node)
    }
    currentId = parentMap.get(currentId) || 0
  }
  stack.reverse()
  if (stack[0]?.name === '(root)') {
    stack.shift()
  }
  return stack
}

const getCommonStackDepth = (openFrames: readonly OpenCpuProfileFrame[], stack: readonly CpuProfileNodeInfo[]): number => {
  let depth = 0
  while (depth < openFrames.length && depth < stack.length && openFrames[depth]?.id === stack[depth]?.id) {
    depth++
  }
  return depth
}

const closeFrame = (
  frames: CpuProfileFrame[],
  frame: OpenCpuProfileFrame,
  endMs: number,
  selfTimeById: Map<number, number>,
  totalTimeById: Map<number, number>,
  hitCountById: Map<number, number>,
): void => {
  const durationMs = roundMetricValue(endMs - frame.startMs)
  if (durationMs <= 0) {
    return
  }
  frames.push({
    colorKey: frame.colorKey,
    depth: frame.depth,
    durationMs,
    hitCount: hitCountById.get(frame.id) || 0,
    location: frame.location,
    name: frame.name,
    selfTimeMs: roundMetricValue(selfTimeById.get(frame.id) || 0),
    startMs: roundMetricValue(frame.startMs),
    totalTimeMs: roundMetricValue(totalTimeById.get(frame.id) || 0),
  })
}

export const getCpuProfileFrames = (profile: Dynamic): readonly CpuProfileFrame[] => {
  const nodes = toArray(profile?.nodes)
  const samples = toArray(profile?.samples)
  const sampleTimes = getSampleTimes(profile, samples)
  const nodeMap = new Map<number, CpuProfileNodeInfo>()
  const parentMap = new Map<number, number>()

  for (const node of nodes) {
    const info = createNodeInfo(node)
    if (!info.id) {
      continue
    }
    nodeMap.set(info.id, info)
    for (const child of toArray(node?.children)) {
      const childId = toNumber(child)
      if (childId) {
        parentMap.set(childId, info.id)
      }
    }
  }

  const stacks: readonly (readonly CpuProfileNodeInfo[])[] = samples.map((sample) => getStack(toNumber(sample), nodeMap, parentMap))
  const selfTimeById = new Map<number, number>()
  const totalTimeById = new Map<number, number>()
  const hitCountById = new Map<number, number>()
  let elapsedMs = 0

  for (let i = 0; i < stacks.length; i++) {
    const stack = stacks[i] || []
    const sampleTimeMs = sampleTimes[i] || 0
    elapsedMs = roundMetricValue(elapsedMs + sampleTimeMs)
    const leaf = stack.at(-1)
    if (leaf) {
      selfTimeById.set(leaf.id, roundMetricValue((selfTimeById.get(leaf.id) || 0) + sampleTimeMs))
      hitCountById.set(leaf.id, (hitCountById.get(leaf.id) || 0) + 1)
    }
    for (const node of stack) {
      totalTimeById.set(node.id, roundMetricValue((totalTimeById.get(node.id) || 0) + sampleTimeMs))
    }
  }

  const frames: CpuProfileFrame[] = []
  const openFrames: OpenCpuProfileFrame[] = []
  elapsedMs = 0

  for (let i = 0; i < stacks.length; i++) {
    const stack = stacks[i] || []
    const sampleTimeMs = sampleTimes[i] || 0
    const commonDepth = getCommonStackDepth(openFrames, stack)

    for (let depth = openFrames.length - 1; depth >= commonDepth; depth--) {
      const frame = openFrames[depth]
      if (frame) {
        closeFrame(frames, frame, elapsedMs, selfTimeById, totalTimeById, hitCountById)
      }
      openFrames.pop()
    }

    for (let depth = commonDepth; depth < stack.length; depth++) {
      const node = stack[depth]
      if (!node) {
        continue
      }
      openFrames.push({
        colorKey: node.colorKey,
        depth,
        id: node.id,
        location: node.location,
        name: node.name,
        startMs: elapsedMs,
      })
    }

    elapsedMs = roundMetricValue(elapsedMs + sampleTimeMs)
  }

  for (let depth = openFrames.length - 1; depth >= 0; depth--) {
    const frame = openFrames[depth]
    if (frame) {
      closeFrame(frames, frame, elapsedMs, selfTimeById, totalTimeById, hitCountById)
    }
  }

  return frames
}

export const getCpuProfileData = async (
  basePath: string,
): Promise<readonly { readonly data: readonly CpuProfileFrame[]; readonly filename: string }[]> => {
  const resultsPath = join(basePath, 'cpu-profile')
  if (!existsSync(resultsPath)) {
    return []
  }

  const dirents = (await readdir(resultsPath)).filter((dirent) => dirent.endsWith('.json')).toSorted()
  const allData = []
  for (const dirent of dirents) {
    const filePath = join(resultsPath, dirent)
    const rawData = await readJson(filePath)
    const profile = getProfile(rawData)
    const data = getCpuProfileFrames(profile)
    if (data.length === 0) {
      continue
    }
    allData.push({
      data,
      filename: dirent.replace('.json', ''),
    })
  }
  return allData
}
