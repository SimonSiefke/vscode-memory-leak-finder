import { performance } from 'node:perf_hooks'

type TimingStats = {
  totalMs: number
  count: number
}

const labelToStats: Map<string, TimingStats> = new Map()

export const timeStart = (label: string): number => {
  return performance.now()
}

export const timeEnd = (label: string, start: number): void => {
  const end = performance.now()
  const duration = end - start
  const current = labelToStats.get(label)
  if (current) {
    current.totalMs += duration
    current.count += 1
  } else {
    labelToStats.set(label, { totalMs: duration, count: 1 })
  }
}

export const report = (header: string = 'Timing report'): void => {
  // Sort by total time desc
  const rows = Array.from(labelToStats.entries()).sort((a, b) => b[1].totalMs - a[1].totalMs)
  // eslint-disable-next-line no-console
  console.log(`\n=== ${header} ===`)
  for (const [label, stats] of rows) {
    // eslint-disable-next-line no-console
    console.log(`${label}: ${stats.totalMs.toFixed(3)} ms (${stats.count}x) `)
  }
}
