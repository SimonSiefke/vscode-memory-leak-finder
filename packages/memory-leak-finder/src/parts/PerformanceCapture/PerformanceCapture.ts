import { readFile, writeFile } from 'node:fs/promises'
import type { Session } from '../Session/Session.ts'
import { evaluate } from '../ConnectDevtoolsEndpoint/ConnectDevtoolsEndpoint.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as CpuProfile from '../CpuProfile/CpuProfile.ts'
import { normalizeBrowserPerformanceMetrics } from '../BrowserPerformanceMetrics/BrowserPerformanceMetrics.ts'
import { unionDuration } from '../PerformanceTraceEvents/PerformanceTraceEvents.ts'
import { UnavailableError, type Metric } from '../PerformanceMetric/PerformanceMetric.ts'

const writeJson = (path: string, value: unknown): Promise<void> => writeFile(path, JSON.stringify(value, null, 2) + '\n')

export const traceCategories =
  'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.stack,v8,v8.execute,disabled-by-default-v8.compile,blink.console'

export const electronExpression = (expression: string): string =>
  `(async () => { const electron = typeof require === 'function' ? require('electron') : typeof process.getBuiltinModule === 'function' ? process.getBuiltinModule('module').createRequire(process.cwd() + '/package.json')('electron') : process.mainModule.require('electron'); return ${expression}; })()`

export const rendererMetrics = (before: { name: string; value: number }[], after: { name: string; value: number }[]): Metric[] => {
  const names: Record<string, string> = {
    recalcStyleCount: 'styleCount',
    layoutDurationMs: 'layoutDuration',
    recalcStyleDurationMs: 'styleDuration',
    scriptDurationMs: 'scriptDuration',
    taskDurationMs: 'taskDuration',
    gcDurationMs: 'gcDuration',
  }
  return normalizeBrowserPerformanceMetrics({ metrics: before }, { metrics: after }).flatMap((row) =>
    row.available && row.delta !== null
      ? [{ name: names[row.name] ?? row.name, unit: row.unit, value: row.delta, coverage: 'workbench renderer' }]
      : [],
  )
}

export interface TraceEvent {
  name: string
  ph: string
  pid: number
  tid: number
  ts: number
  dur?: number
  args?: any
}

const traceDuration = (events: TraceEvent[], end: number): number => {
  const threads = new Map<number, TraceEvent[]>()
  for (const event of events) {
    const spans = threads.get(event.tid) ?? []
    spans.push({ ...event, dur: Math.min(event.dur!, end - event.ts) })
    threads.set(event.tid, spans)
  }
  let total = 0
  for (const spans of threads.values()) {
    total += unionDuration(spans.map((event) => ({ ...event, dur: event.dur! })))
  }
  return total
}

export const traceWindow = (events: TraceEvent[], startup: boolean): TraceEvent[] => {
  const end = events.find((event) => event.name === 'TimeStamp' && event.args?.data?.message === 'large-end')
  const start = events.find((event) => event.name === 'TimeStamp' && event.args?.data?.message === 'large-start')
  if (!end || (!startup && !start)) throw new UnavailableError('Trace is missing its measurement boundary markers')
  const lower = startup ? -Infinity : start!.ts
  const window = events.filter((event) => event.pid === end.pid && event.ts >= lower && event.ts < end.ts)
  if (startup && !window.some((event) => event.ts < end.ts && /navigationStart|ParseHTML|CommitLoad|EvaluateScript/.test(event.name))) {
    throw new UnavailableError('Startup trace does not contain renderer initialization')
  }
  return window
}

export const analyzeTrace = (events: TraceEvent[], startup: boolean): Metric[] => {
  const window = traceWindow(events, startup)
  const end = events.find((event) => event.name === 'TimeStamp' && event.args?.data?.message === 'large-end')!
  // Keep only complete duration events. Incomplete B/E spans are not converted into zero-duration events.
  const complete = window.filter((event) => event.ph === 'X' && typeof event.dur === 'number')
  const specs: [string, string, RegExp][] = [
    ['layouts', 'count', /^Layout$/],
    ['layoutDuration', 'ms', /^Layout$/],
    ['styles', 'count', /^UpdateLayoutTree$|^RecalculateStyles$/],
    ['styleDuration', 'ms', /^UpdateLayoutTree$|^RecalculateStyles$/],
    ['paints', 'count', /^Paint$/],
    ['paintDuration', 'ms', /^Paint$/],
    ['compileEvents', 'count', /^(V8\.Compile|v8\.compile|CompileScript|CompileCode)/],
    ['compileDuration', 'ms', /^(V8\.Compile|v8\.compile|CompileScript|CompileCode)/],
    ['gcEvents', 'count', /^(MajorGC|MinorGC)$/],
    ['gcDuration', 'ms', /^(MajorGC|MinorGC)$/],
  ]
  const metrics = specs.flatMap(([name, unit, pattern]) => {
    const matches = complete.filter((event) => pattern.test(event.name))
    // A category can be unsupported in a Chromium version: absence means unknown, not zero.
    return matches.length
      ? [
          {
            name,
            unit,
            value: unit === 'count' ? matches.length : traceDuration(matches, end.ts),
            coverage: 'workbench renderer trace; duration spans merged per thread',
          },
        ]
      : []
  })
  const tasks = complete.filter((event) => /^(RunTask|ThreadControllerImpl::RunTask)$/.test(event.name) && event.tid === end.tid)
  if (tasks.length)
    metrics.push({
      name: 'longTasks',
      unit: 'count',
      value: tasks.filter((event) => Math.min(event.dur!, end.ts - event.ts) >= 50000).length,
      coverage: 'workbench renderer main thread; tasks >=50ms',
    })
  const forced = complete.filter(
    (event) => event.name === 'Layout' && Array.isArray(event.args?.beginData?.stackTrace) && event.args.beginData.stackTrace.length,
  )
  if (complete.some((event) => event.name === 'Layout'))
    metrics.push({
      name: 'forcedLayouts',
      unit: 'count',
      value: forced.length,
      coverage: 'workbench renderer layouts with JavaScript stack attribution',
    })
  return metrics
}

export const stopRecording = async (main: Session, path: string): Promise<TraceEvent[]> => {
  const usage = await evaluate<{ percentage: number }>(main, electronExpression('await electron.contentTracing.getTraceBufferUsage()'))
  await evaluate(main, electronExpression(`await electron.contentTracing.stopRecording(${JSON.stringify(path)})`))
  if (usage.percentage >= 1) throw new UnavailableError('Trace buffer filled; the trace is incomplete')
  return readTrace(path)
}

export const stopTrace = async (main: Session, path: string, startup: boolean): Promise<Metric[]> =>
  analyzeTrace(await stopRecording(main, path), startup)

export const loadTrace = async (path: string, startup: boolean): Promise<Metric[]> => analyzeTrace(await readTrace(path), startup)

const readTrace = async (path: string): Promise<TraceEvent[]> => {
  const trace = JSON.parse(await readFile(path, 'utf8')) as {
    traceEvents: TraceEvent[]
    metadata?: { trace_processor_stats?: Record<string, number> }
  }
  for (const [name, value] of Object.entries(trace.metadata?.trace_processor_stats ?? {})) {
    if (/packet_loss|chunks_overwritten|chunks_discarded|data_loss/.test(name) && value > 0)
      throw new UnavailableError(`Incomplete trace: ${name}=${value}`)
  }
  return trace.traceEvents
}

export const summarizeHeap = (snapshot: any): Metric[] => {
  const fields: string[] = snapshot.snapshot.meta.node_fields
  const typeIndex = fields.indexOf('type')
  const sizeIndex = fields.indexOf('self_size')
  const types: string[] = snapshot.snapshot.meta.node_types[typeIndex]
  if (typeIndex < 0 || sizeIndex < 0 || !Array.isArray(snapshot.nodes) || snapshot.nodes.length % fields.length)
    throw new Error('Malformed heap snapshot')
  let heap = 0
  let code = 0
  for (let i = 0; i < snapshot.nodes.length; i += fields.length) {
    const size = snapshot.nodes[i + sizeIndex]
    if (!Number.isFinite(size)) throw new Error('Invalid heap node size')
    heap += size
    if (types[snapshot.nodes[i + typeIndex]] === 'code') code += size
  }
  return [
    { name: 'heapBytes', unit: 'bytes', value: heap, coverage: 'workbench renderer heap snapshot; live self-size bytes after snapshot GC' },
    {
      name: 'compiledCodeBytes',
      unit: 'bytes',
      value: code,
      coverage: 'workbench renderer V8 code-node self-size, including bytecode and code metadata',
    },
  ]
}

export const heapSnapshot = async (session: Session, path: string): Promise<Metric[]> => {
  await HeapSnapshot.takeHeapSnapshot(session, path, { reportProgress: false })
  return summarizeHeap(JSON.parse(await readFile(path, 'utf8')))
}

export const profileMetrics = async (profile: any, path: string): Promise<Metric[]> => {
  await writeJson(path, profile)
  if (!Array.isArray(profile.samples) || !Array.isArray(profile.timeDeltas)) throw new UnavailableError('CPU profile contains no samples')
  const summary = CpuProfile.getCpuProfileSummary(profile)
  await writeJson(path.replace('.cpuprofile', '-functions.json'), summary.topSelfTime)
  return [
    {
      name: 'profileSampledTime',
      unit: 'ms',
      value: summary.metrics.totalTimeMs,
      coverage: 'workbench renderer CPU profile; diagnostic timing with profiler overhead',
    },
  ]
}
