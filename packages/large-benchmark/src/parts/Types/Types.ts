export type Revision = 'before' | 'after'
export type Collector = 'timing' | 'instructions' | 'resources' | 'renderer' | 'timeline' | 'profile' | 'memory' | 'bundles'
export type Status = 'success' | 'partial' | 'failed' | 'unavailable' | 'missing'

export interface Benchmark {
  id: string
  scenario: string
  collector: Collector
  startup: boolean
  cache: 'cold' | 'warm' | 'action' | 'static'
  diagnostic: boolean
}

export interface Metric {
  name: string
  unit: string
  value: number
  coverage: string
  higherIsBetter?: boolean
}

export interface Sample {
  pair: number
  revision: Revision
  order: number
  status: Status
  metrics: Metric[]
  diagnostics: string[]
  raw: string[]
  elapsedMs: number
}

export interface Result {
  schemaVersion: 1
  benchmark: Benchmark
  commits: Record<Revision, string>
  requestedSamples: number
  status: Status
  runner: Record<string, string>
  samples: Sample[]
  diagnostics: string[]
}

export interface BuildMetadata {
  schemaVersion: 1
  commit: string
  platform: 'linux'
  arch: 'x64'
  executable: string
  archiveSha256: string
  nodeVersion: string
  generatedAt: string
}

const metricUrl = new URL('../../../../memory-leak-finder/src/parts/PerformanceMetric/PerformanceMetric.ts', import.meta.url).href
export const { UnavailableError } = await import(metricUrl)
