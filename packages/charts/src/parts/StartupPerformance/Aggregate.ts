export interface Profile {
  nodes: { id: number; callFrame: { functionName: string; url: string; lineNumber: number; columnNumber: number }; children?: number[] }[]
  samples: number[]
  timeDeltas: number[]
}
export interface StackCost {
  stack: string
  meanMs: number
  medianMs: number
}
// Sampling clocks can move backwards by a few microseconds in real V8 profiles.
// Reconstruct timestamps, then make them monotonic instead of inventing negative CPU time.
export const sampleDurations = (profile: Profile): number[] => {
  if (!profile.samples?.length || profile.samples.length !== profile.timeDeltas?.length)
    throw new Error('CPU profile is missing samples or matching time deltas')
  let timestamp = 0
  let previous = 0
  return profile.timeDeltas.map((delta) => {
    if (!Number.isFinite(delta)) throw new Error('CPU profile has an invalid sample duration')
    timestamp += delta
    const end = Math.max(previous, timestamp)
    const duration = end - previous
    previous = end
    return duration
  })
}
export const profileCosts = (profile: Profile): Map<string, number> => {
  if (!Array.isArray(profile.nodes) || !profile.samples?.length || profile.samples.length !== profile.timeDeltas?.length)
    throw new Error('CPU profile is missing nodes, samples or matching time deltas')
  const durations = sampleDurations(profile)
  const nodes = new Map(profile.nodes.map((node) => [node.id, node]))
  const parents = new Map<number, number>()
  for (const node of profile.nodes) for (const child of node.children || []) parents.set(child, node.id)
  const costs = new Map<string, number>()
  for (let i = 0; i < profile.samples.length; i++) {
    const delta = durations[i]
    let id: number | undefined = profile.samples[i]
    const stack: string[] = []
    const seen = new Set<number>()
    while (id !== undefined) {
      if (seen.has(id)) throw new Error('CPU profile contains a cyclic stack')
      seen.add(id)
      const node = nodes.get(id)
      if (!node) throw new Error('CPU profile references an unknown node')
      const frame = node.callFrame
      // Ignore run-local script and node IDs. Full URL/line/column and parent chain disambiguate frames.
      stack.unshift(JSON.stringify([frame.functionName, frame.url, frame.lineNumber, frame.columnNumber]))
      id = parents.get(id)
    }
    const key = JSON.stringify(stack)
    costs.set(key, (costs.get(key) || 0) + delta / 1000)
  }
  return costs
}
export const median = (values: readonly number[]): number => {
  const sorted = values.toSorted((a, b) => a - b)
  if (!sorted.length) throw new Error('Cannot take median of missing captures')
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}
export const aggregate = (profiles: readonly Profile[]): StackCost[] => {
  if (!profiles.length) return []
  const costs = profiles.map(profileCosts)
  const keys = new Set(costs.flatMap((cost) => [...cost.keys()]))
  return [...keys]
    .map((stack) => {
      // Absent stack in a successful profile means zero sampled time; missing profiles never enter this population.
      const values = costs.map((cost) => cost.get(stack) || 0).sort((a, b) => a - b)
      return { stack, meanMs: values.reduce((sum, value) => sum + value, 0) / profiles.length, medianMs: median(values) }
    })
    .sort((a, b) => b.meanMs - a.meanMs || (a.stack < b.stack ? -1 : a.stack > b.stack ? 1 : 0))
}
export const stackLabel = (key: string): string =>
  (JSON.parse(key) as string[])
    .map((frame) => {
      const [name, url, line, column] = JSON.parse(frame)
      return `${name || '(anonymous)'}${url ? ` (${url}:${line + 1}:${column + 1})` : ''}`
    })
    .join(' → ')
