import { execFile, spawn, type ChildProcess } from 'node:child_process'
import { constants } from 'node:fs'
import { open, readFile, rm, type FileHandle } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { promisify } from 'node:util'
import { UnavailableError, type Metric } from '../PerformanceMetric/PerformanceMetric.ts'

const exec = promisify(execFile)

export const hardwareEvents = ['instructions:u', 'cycles:u']
export const softwareEvents = ['task-clock', 'context-switches', 'page-faults', 'minor-faults', 'major-faults']

export const parsePerf = (raw: string, events: string[]): Metric[] => {
  const values = new Map<string, number>()
  for (const line of raw.split('\n')) {
    const fields = line.trim().split(',')
    const event = fields[2]?.trim()
    if (!event || !events.includes(event)) continue
    const value = Number(fields[0]?.trim())
    if (!fields[0]?.trim() || !Number.isFinite(value)) continue
    // perf reports the percentage of time an event ran when counters are multiplexed.
    const running = Number(fields[4])
    if (fields[4]?.trim() && Number.isFinite(running) && running < 95)
      throw new UnavailableError(`perf event ${event} ran for only ${running}% of the window`)
    values.set(event, (values.get(event) ?? 0) + value)
  }
  return events.flatMap((event) =>
    values.has(event)
      ? [
          {
            name: event.replace(':u', ''),
            value: values.get(event)!,
            unit: event === 'task-clock' ? 'ms' : 'count',
            coverage: event.endsWith(':u')
              ? 'Electron process tree; inherited user-space perf events'
              : 'Electron process tree; inherited user and kernel perf events',
          },
        ]
      : [],
  )
}

export const probePerf = async (events: string[]): Promise<void> => {
  let raw: string
  try {
    // Put output in a temporary file because perf writes its statistics to stderr.
    const { stdout } = await exec(
      'sh',
      [
        '-c',
        'exec perf stat --no-big-num -x , -e "$1" -- "$2" -e "let x=0; for(let i=0;i<1000000;i++) x+=i" 2>&1',
        'perf-probe',
        events.join(','),
        process.execPath,
      ],
      { timeout: 15000 },
    )
    raw = stdout
  } catch (error) {
    throw new UnavailableError(`perf counters unavailable: ${String(error)}`)
  }
  const metrics = parsePerf(raw, events)
  if (
    metrics.length !== events.length ||
    metrics.some((metric) => ['instructions', 'cycles', 'task-clock'].includes(metric.name) && metric.value <= 0)
  )
    throw new UnavailableError(`Required perf events unavailable or not counting: ${events.join(', ')}\n${raw}`)
}

export class PerfSession {
  child: ChildProcess | undefined
  private control: FileHandle | undefined
  private acknowledgement: FileHandle | undefined
  private closed: Promise<void> = Promise.resolve()
  private frozen = false
  readonly directory: string
  readonly events: string[]
  private constructor(directory: string, events: string[]) {
    this.directory = directory
    this.events = events
  }
  static async create(directory: string, events: string[]): Promise<PerfSession> {
    await probePerf(events)
    const session = new PerfSession(directory, events)
    try {
      await exec('mkfifo', [join(directory, 'control'), join(directory, 'ack')])
      session.control = await open(join(directory, 'control'), constants.O_RDWR | constants.O_NONBLOCK)
      session.acknowledgement = await open(join(directory, 'ack'), constants.O_RDWR | constants.O_NONBLOCK)
    } catch (error) {
      await session.dispose()
      throw error
    }
    return session
  }
  args(startDisabled = false): string[] {
    return [
      'stat',
      '--no-big-num',
      '-x',
      ',',
      '-e',
      this.events.join(','),
      '-o',
      join(this.directory, 'perf.csv'),
      `--control=fifo:${join(this.directory, 'control')},${join(this.directory, 'ack')}`,
      ...(startDisabled ? ['--delay=-1'] : []),
    ]
  }
  bind(child: ChildProcess): void {
    this.child = child
    this.closed = new Promise((resolve) => {
      child.once('close', () => resolve())
      child.once('error', () => resolve())
    })
  }
  async attach(pids: number[]): Promise<void> {
    const child = spawn('perf', [...this.args(true), '-p', pids.join(',')], { stdio: 'ignore' })
    this.bind(child)
    await this.toggle('enable')
  }
  async toggle(value: 'enable' | 'disable'): Promise<void> {
    if (!this.control || !this.acknowledgement) throw new Error('perf control is not open')
    await this.control.write(`${value}\n`)
    const buffer = Buffer.alloc(128)
    const deadline = Date.now() + 5000
    while (Date.now() < deadline) {
      try {
        const { bytesRead } = await this.acknowledgement.read(buffer, 0, buffer.length, null)
        if (bytesRead && buffer.subarray(0, bytesRead).toString().includes('ack')) return
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EAGAIN') throw error
      }
      await delay(5)
    }
    throw new UnavailableError(`perf did not acknowledge ${value}`)
  }
  async freeze(): Promise<void> {
    if (!this.frozen) {
      await this.toggle('disable')
      this.frozen = true
    }
  }
  async stop(): Promise<Metric[]> {
    await this.freeze()
    this.child?.kill('SIGINT')
    await Promise.race([
      this.closed,
      delay(5000).then(() => {
        throw new Error('perf did not exit')
      }),
    ])
    const raw = await readFile(join(this.directory, 'perf.csv'), 'utf8')
    const metrics = parsePerf(raw, this.events)
    if (metrics.length !== this.events.length) throw new UnavailableError(`perf did not count all required events:\n${raw}`)
    const instructions = metrics.find((metric) => metric.name === 'instructions')?.value
    const cycles = metrics.find((metric) => metric.name === 'cycles')?.value
    if (instructions !== undefined && cycles)
      metrics.push({
        name: 'instructionsPerCycle',
        unit: 'ratio',
        value: instructions / cycles,
        coverage: 'Electron process tree',
        higherIsBetter: true,
      })
    return metrics
  }
  async dispose(): Promise<void> {
    this.child?.kill('SIGKILL')
    await this.control?.close()
    await this.acknowledgement?.close()
    // Artifact uploaders must never try to read a FIFO, which would block waiting for a writer.
    await rm(join(this.directory, 'control'), { force: true })
    await rm(join(this.directory, 'ack'), { force: true })
  }
}
