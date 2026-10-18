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

const startupCollectors: Collector[] = ['timing', 'instructions', 'resources', 'timeline', 'memory', 'css-selectors']
const interactionCollectors: Collector[] = [
  ...startupCollectors.filter((collector) => collector !== 'css-selectors'),
  'renderer',
  'profile',
]

export const benchmarks: Benchmark[] = [
  ...['empty', 'workspace'].flatMap((scenario) =>
    (['cold', 'warm'] as const).flatMap((cache) =>
      startupCollectors.map((collector) => ({
        id: `startup-${scenario}-${cache}-${collector}`,
        scenario,
        collector,
        startup: true,
        cache,
        diagnostic: collector === 'memory' || collector === 'css-selectors',
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

export const measureGroups = [
  'startup-times',
  'startup',
  'timing',
  'instructions',
  'resources',
  'renderer',
  'timeline',
  'profile',
  'memory',
  'bundles',
  'css-selectors',
] as const

export const selectBenchmarks = (filter = '', measures = ''): Benchmark[] => {
  const ids = filter
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  const unknown = ids.filter((id) => !benchmarks.some((benchmark) => benchmark.id === id))
  if (unknown.length) throw new Error(`Unknown benchmark IDs: ${unknown.join(', ')}`)
  const groups = measures
    .split(',')
    .map((group) => group.trim())
    .filter(Boolean)
  const unknownGroups = groups.filter((group) => !measureGroups.some((known) => known === group))
  if (unknownGroups.length) throw new Error(`Unknown measures: ${unknownGroups.join(', ')}. Choose from: ${measureGroups.join(', ')}`)
  const selected = benchmarks.filter(
    (benchmark) =>
      (!ids.length || ids.includes(benchmark.id)) &&
      (!groups.length ||
        groups.some((group) =>
          group === 'startup-times'
            ? benchmark.startup && benchmark.collector === 'timing'
            : group === 'startup'
              ? benchmark.startup
              : benchmark.collector === group,
        )),
  )
  if (!selected.length) throw new Error('No benchmarks match the selected measures and benchmark filter')
  return selected
}

export const sampleOrder = (pair: number): Revision[] => (pair % 2 === 0 ? ['before', 'after'] : ['after', 'before'])

export const sampleCount = (benchmark: Benchmark, requested: number): number => {
  if (!Number.isSafeInteger(requested) || requested < 1 || requested > 1000)
    throw new Error('samples must be an integer between 1 and 1000')
  return benchmark.collector === 'bundles' ? 1 : benchmark.diagnostic ? Math.min(5, requested) : requested
}
