import { readFile, readdir } from 'node:fs/promises'
import type { Metric } from './types.ts'

interface Process {
  pid: number
  parent: number
  identity: string
}

export const processTree = async (root: number): Promise<Process[]> => {
  const table: Process[] = []
  await Promise.all(
    (await readdir('/proc'))
      .filter((name) => /^\d+$/.test(name))
      .map(async (name) => {
        try {
          const raw = await readFile(`/proc/${name}/stat`, 'utf8')
          const fields = raw
            .slice(raw.lastIndexOf(')') + 2)
            .trim()
            .split(/\s+/)
          table.push({ pid: Number(name), parent: Number(fields[1]), identity: `${name}:${fields[19]}` })
        } catch {
          /* Processes can exit while reading /proc. */
        }
      }),
  )
  const included = new Set([root])
  let changed = true
  while (changed) {
    changed = false
    for (const entry of table)
      if (!included.has(entry.pid) && included.has(entry.parent)) {
        included.add(entry.pid)
        changed = true
      }
  }
  return table.filter((entry) => included.has(entry.pid))
}

export class ResourceSampler {
  private timer: NodeJS.Timeout | undefined
  private pending: Promise<void> = Promise.resolve()
  private stopped = false
  private stopPromise: Promise<Metric[]> | undefined
  samples: { timestamp: number; pssBytes: number; processCount: number }[] = []
  diagnostics: string[] = []
  private root: number
  private excludeRoot: boolean
  constructor(root: number, excludeRoot = false) {
    this.root = root
    this.excludeRoot = excludeRoot
  }
  async sample(): Promise<void> {
    const entries = (await processTree(this.root)).filter((entry) => !this.excludeRoot || entry.pid !== this.root)
    if (!entries.length) return
    const values = await Promise.all(
      entries.map(async (entry) => {
        try {
          const raw = await readFile(`/proc/${entry.pid}/smaps_rollup`, 'utf8')
          const match = /^Pss:\s+(\d+)\s+kB$/m.exec(raw)
          const stat = await readFile(`/proc/${entry.pid}/stat`, 'utf8')
          const fields = stat
            .slice(stat.lastIndexOf(')') + 2)
            .trim()
            .split(/\s+/)
          if (`${entry.pid}:${fields[19]}` !== entry.identity || !match) return undefined
          return Number(match[1]) * 1024
        } catch (error) {
          if (!['ENOENT', 'ESRCH'].includes((error as NodeJS.ErrnoException).code ?? '')) this.diagnostics.push(String(error))
          return undefined
        }
      }),
    )
    if (values.some((value) => value === undefined)) {
      this.diagnostics.push('Dropped an incomplete process-tree PSS sample')
      return
    }
    this.samples.push({
      timestamp: Date.now(),
      pssBytes: values.reduce<number>((sum, value) => sum + value!, 0),
      processCount: entries.length,
    })
  }
  async start(): Promise<void> {
    await this.sample()
    this.schedule()
  }
  private schedule(): void {
    if (this.stopped) return
    this.timer = setTimeout(() => {
      this.pending = this.sample()
        .catch((error) => {
          this.diagnostics.push(String(error))
        })
        .finally(() => this.schedule())
    }, 250)
  }
  async stop(): Promise<Metric[]> {
    return (this.stopPromise ??= this.finish())
  }
  private async finish(): Promise<Metric[]> {
    this.stopped = true
    clearTimeout(this.timer)
    await this.pending
    const beforeFinal = this.samples.length
    await this.sample()
    if (!this.samples.length) return []
    const last = this.samples.length > beforeFinal ? this.samples[this.samples.length - 1]! : undefined
    if (!last) this.diagnostics.push('Final process-tree PSS sample unavailable; final metrics omitted')
    return [
      {
        name: 'peakPss',
        unit: 'bytes',
        value: Math.max(...this.samples.map((sample) => sample.pssBytes)),
        coverage: 'Electron process tree; PSS sampled every 250ms; brief peaks may be missed',
      },
      ...(last ? [{ name: 'finalPss', unit: 'bytes', value: last.pssBytes, coverage: 'Electron process tree' }] : []),
      {
        name: 'peakProcessCount',
        unit: 'count',
        value: Math.max(...this.samples.map((sample) => sample.processCount)),
        coverage: 'Electron process tree; sampled every 250ms',
      },
      ...(last ? [{ name: 'finalProcessCount', unit: 'count', value: last.processCount, coverage: 'Electron process tree' }] : []),
    ]
  }
}
