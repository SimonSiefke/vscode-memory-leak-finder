import type { Benchmark, Collector, Revision } from '../Types/Types.ts'

export const interactionScenarios = [
  'open-small',
  'open-large',
  'type',
  'scroll',
  'find',
  'search',
  'quick-open',
  'explorer',
  'diff',
  'terminal-create',
  'terminal-command',
  'settings',
] as const

const startupCollectors: Collector[] = ['timing', 'instructions', 'resources', 'timeline', 'memory']
const interactionCollectors: Collector[] = [...startupCollectors, 'renderer', 'profile']

export const benchmarks: Benchmark[] = [
  ...['empty', 'workspace'].flatMap((scenario) =>
    (['cold', 'warm'] as const).flatMap((cache) =>
      startupCollectors.map((collector) => ({
        id: `startup-${scenario}-${cache}-${collector}`,
        scenario,
        collector,
        startup: true,
        cache,
        diagnostic: collector === 'memory',
      })),
    ),
  ),
  ...interactionScenarios.flatMap((scenario) =>
    interactionCollectors.map((collector) => ({
      id: `${scenario}-${collector}`,
      scenario,
      collector,
      startup: false,
      cache: 'action' as const,
      diagnostic: collector === 'memory' || collector === 'profile',
    })),
  ),
  { id: 'bundles', scenario: 'bundles', collector: 'bundles', startup: false, cache: 'static', diagnostic: false },
]

export const selectBenchmarks = (filter = ''): Benchmark[] => {
  const ids = filter
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  if (!ids.length) return benchmarks
  const unknown = ids.filter((id) => !benchmarks.some((benchmark) => benchmark.id === id))
  if (unknown.length) throw new Error(`Unknown benchmark IDs: ${unknown.join(', ')}`)
  return benchmarks.filter((benchmark) => ids.includes(benchmark.id))
}

export const sampleOrder = (pair: number): Revision[] => (pair % 2 === 0 ? ['before', 'after'] : ['after', 'before'])

export const sampleCount = (benchmark: Benchmark, requested: number): number => {
  if (!Number.isSafeInteger(requested) || requested < 1 || requested > 1000)
    throw new Error('samples must be an integer between 1 and 1000')
  return benchmark.collector === 'bundles' ? 1 : benchmark.diagnostic ? Math.min(5, requested) : requested
}
