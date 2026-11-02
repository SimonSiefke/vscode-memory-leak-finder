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
  { id: 'smoke-tests', scenario: 'smoke-tests', collector: 'smoke', startup: false, cache: 'action', diagnostic: false },
  { id: 'bundles', scenario: 'bundles', collector: 'bundles', startup: false, cache: 'static', diagnostic: false },
]

export const measureGroups = [
  'smoke',
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

export const selectBenchmarks = (filter = '', measures = '', registry: Benchmark[] = benchmarks): Benchmark[] => {
  const ids = filter
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  const unknown = ids.filter((id) => !registry.some((benchmark) => benchmark.id === id))
  if (unknown.length) throw new Error(`Unknown benchmark IDs: ${unknown.join(', ')}`)
  const groups = measures
    .split(',')
    .map((group) => group.trim())
    .filter(Boolean)
  const unknownGroups = groups.filter((group) => !measureGroups.some((known) => known === group))
  if (unknownGroups.length) throw new Error(`Unknown measures: ${unknownGroups.join(', ')}. Choose from: ${measureGroups.join(', ')}`)
  const selected = registry.filter(
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
  if (benchmark.samples !== undefined) {
    if (!Number.isSafeInteger(benchmark.samples) || benchmark.samples < 1 || benchmark.samples > 1000)
      throw new Error('Invalid frozen sample count')
    return benchmark.samples
  }
  return benchmark.collector === 'bundles' ? 1 : benchmark.diagnostic ? Math.min(5, requested) : requested
}

export const validateRegistry = (registry: Benchmark[]): void => {
  if (!registry.length || new Set(registry.map((benchmark) => benchmark.id)).size !== registry.length)
    throw new Error('Expected benchmarks must be nonempty and unique')
  for (const benchmark of registry) {
    if (
      !/^[a-z0-9-]+$/.test(benchmark.id) ||
      !measureGroups.includes(benchmark.collector as any) ||
      !['cold', 'warm', 'action', 'static'].includes(benchmark.cache) ||
      (benchmark.arch !== undefined && !['x64', 'arm64'].includes(benchmark.arch))
    )
      throw new Error('Invalid benchmark identity')
    if (
      benchmark.sourceFile &&
      (!/^packages\/e2e\/src\/[a-z0-9-]+\.(ts|js)$/.test(benchmark.sourceFile) || !/^[a-f0-9]{64}$/.test(benchmark.sourceSha256 ?? ''))
    )
      throw new Error('Invalid frozen scenario source')
    sampleCount(benchmark, 37)
  }
}
