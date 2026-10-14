import type { Metric } from '../PerformanceMetric/PerformanceMetric.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import { waitFor } from '../ConnectDevtoolsEndpoint/ConnectDevtoolsEndpoint.ts'

const workerUrl = new URL(
  '../../../../linux-process-tree-worker/src/parts/LinuxProcessTreeResources/LinuxProcessTreeResources.ts',
  import.meta.url,
).href
const { createProcessTreeSampler, getProcessTable, updateTrackedProcesses } = await import(workerUrl)

export const processTree = async (root: number): Promise<{ pid: number; identity: string }[]> => {
  const table = await getProcessTable()
  return [...updateTrackedProcesses(root, new Map(), table).values()].map((entry: any) => ({
    pid: entry.pid,
    identity: `${entry.pid}:${entry.startTimeTicks}`,
  }))
}

// Adapt the existing PID-validated sampler to the paired benchmark result schema.
// CPU counters are collected separately, so PSS remains available without perf.
export class ResourceSampler {
  private sampler: any
  private stopPromise: Promise<Metric[]> | undefined
  private started = false
  samples: { timestamp: number; pssBytes: number; processCount: number }[] = []
  diagnostics: string[] = []
  private root: number
  private excludeRoot: boolean
  constructor(root: number, excludeRoot = false) {
    this.root = root
    this.excludeRoot = excludeRoot
    this.sampler = createProcessTreeSampler(root, {}, { excludeRoot, initialSampleAttempts: 20 })
  }
  async start(): Promise<void> {
    // A launch-wrapping perf process can appear before it forks Electron. Sampling
    // its descendants starts when they exist, without reporting an empty tree as 0.
    if (this.excludeRoot)
      await waitFor(
        'Electron child process',
        async () => ((await processTree(this.root)).some((entry) => entry.pid !== this.root) ? true : false),
        5000,
      )
    await this.sampler.start()
    this.started = true
  }
  stop(): Promise<Metric[]> {
    if (!this.started) return Promise.resolve([])
    return (this.stopPromise ??= this.finish())
  }
  private async finish(): Promise<Metric[]> {
    const result = await this.sampler.stop()
    this.samples = result.samples.map((entry: any) => ({
      timestamp: entry.timestamp,
      pssBytes: entry.pssKiB * 1024,
      processCount: entry.processCount,
    }))
    if (result.droppedSampleCount) this.diagnostics.push(`Dropped ${result.droppedSampleCount} incomplete process-tree PSS samples`)
    if (!result.finalSample) this.diagnostics.push('Final process-tree PSS sample unavailable; final metrics omitted')
    return [
      {
        name: 'peakPss',
        unit: 'bytes',
        value: Math.max(...this.samples.map((entry) => entry.pssBytes)),
        coverage: 'Electron process tree; PSS sampled every 250ms; brief peaks may be missed',
      },
      {
        name: 'peakProcessCount',
        unit: 'count',
        value: Math.max(...this.samples.map((entry) => entry.processCount)),
        coverage: 'Electron process tree; sampled every 250ms',
      },
      ...(result.finalSample
        ? [
            { name: 'finalPss', unit: 'bytes', value: result.finalSample.pssKiB * 1024, coverage: 'Electron process tree' },
            { name: 'finalProcessCount', unit: 'count', value: result.finalSample.processCount, coverage: 'Electron process tree' },
          ]
        : []),
    ]
  }
}

export const id = MeasureId.ProcessTreePss
export const targets = []
export const create = ({ pid }: { pid: number }) => [new ResourceSampler(pid)]
export const start = (state: ResourceSampler) => state.start()
export const stop = (state: ResourceSampler) => state.stop()
export const releaseResources = async (state: ResourceSampler) => {
  await state.stop()
}
export const compare = (_before: unknown, after: Metric[]) => ({ isLeak: false, metrics: after })
export const isLeak = () => false
export const summary = ({ metrics }: { metrics: Metric[] }) => JSON.stringify(metrics)
