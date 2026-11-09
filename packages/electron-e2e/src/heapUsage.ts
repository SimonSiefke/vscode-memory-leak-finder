import { getHeapUsage } from '../../memory-leak-finder/src/parts/GetHeapUsage/GetHeapUsage.ts'
import type { Session } from '../../memory-leak-finder/src/parts/Session/Session.ts'

export interface HeapUsageSample {
  readonly cycle: number
  readonly usedSize: number
  readonly totalSize: number
}

export const measureHeapUsage = async (rpc: Session, runs: number, run: () => Promise<void>) => {
  const samples: HeapUsageSample[] = []
  const sample = async (cycle: number) => {
    await rpc.invoke('HeapProfiler.collectGarbage')
    const usage = await getHeapUsage(rpc)
    samples.push({ cycle, usedSize: usage.usedSize, totalSize: usage.totalSize })
  }
  await sample(0)
  for (let cycle = 1; cycle <= runs; cycle++) {
    await run()
    await sample(cycle)
  }
  const before = samples[0]
  const after = samples[samples.length - 1]
  return { heapUsage: { before, after, delta: after.usedSize - before.usedSize, samples } }
}
