import { createWriteStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { finished } from 'node:stream/promises'
import { Cdp } from './cdp.ts'
import { writeJson } from './io.ts'
import { UnavailableError, type Metric } from './types.ts'

export const traceCategories =
  'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.stack,v8,v8.execute,disabled-by-default-v8.compile,blink.console'

export const electronExpression = (expression: string): string =>
  `(async () => { const electron = typeof require === 'function' ? require('electron') : typeof process.getBuiltinModule === 'function' ? process.getBuiltinModule('module').createRequire(process.cwd() + '/package.json')('electron') : process.mainModule.require('electron'); return ${expression}; })()`

const browserSpecs = [
  ['LayoutCount', 'layoutCount', 'count'],
  ['RecalcStyleCount', 'styleCount', 'count'],
  ['LayoutDuration', 'layoutDuration', 'ms'],
  ['RecalcStyleDuration', 'styleDuration', 'ms'],
  ['ScriptDuration', 'scriptDuration', 'ms'],
  ['TaskDuration', 'taskDuration', 'ms'],
] as const

export const rendererMetrics = (before: { name: string; value: number }[], after: { name: string; value: number }[]): Metric[] => {
  const start = new Map(before.map((entry) => [entry.name, entry.value]))
  const end = new Map(after.map((entry) => [entry.name, entry.value]))
  return browserSpecs.flatMap(([cdpName, name, unit]) =>
    start.has(cdpName) && end.has(cdpName)
      ? [
          {
            name,
            unit,
            value: (end.get(cdpName)! - start.get(cdpName)!) * (unit === 'ms' ? 1000 : 1),
            coverage: 'workbench renderer',
          },
        ]
      : [],
  )
}

interface TraceEvent {
  name: string
  ph: string
  pid: number
  tid: number
  ts: number
  dur?: number
  args?: any
}

const traceDuration = (events: TraceEvent[], end: number): number => {
  const threads = new Map<number, [number, number][]>()
  for (const event of events) {
    const spans = threads.get(event.tid) ?? []
    spans.push([event.ts, Math.min(end, event.ts + event.dur!)])
    threads.set(event.tid, spans)
  }
  let total = 0
  for (const spans of threads.values()) {
    spans.sort((a, b) => a[0] - b[0])
    let high = -Infinity
    for (const [start, stop] of spans) {
      total += Math.max(0, stop - Math.max(start, high))
      high = Math.max(high, stop)
    }
  }
  return total / 1000
}

export const analyzeTrace = (events: TraceEvent[], startup: boolean): Metric[] => {
  const end = events.find((event) => event.name === 'TimeStamp' && event.args?.data?.message === 'ultimate-end')
  const start = events.find((event) => event.name === 'TimeStamp' && event.args?.data?.message === 'ultimate-start')
  if (!end || (!startup && !start)) throw new UnavailableError('Trace is missing its measurement boundary markers')
  const lower = startup ? -Infinity : start!.ts
  const window = events.filter((event) => event.pid === end.pid && event.ts >= lower && event.ts < end.ts)
  if (startup && !window.some((event) => event.ts < end.ts && /navigationStart|ParseHTML|CommitLoad|EvaluateScript/.test(event.name))) {
    throw new UnavailableError('Startup trace does not contain renderer initialization')
  }
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

export const stopTrace = async (main: Cdp, path: string, startup: boolean): Promise<Metric[]> => {
  const usage = await main.evaluate<{ percentage: number }>(electronExpression('await electron.contentTracing.getTraceBufferUsage()'))
  await main.evaluate(electronExpression(`await electron.contentTracing.stopRecording(${JSON.stringify(path)})`))
  if (usage.percentage >= 1) throw new UnavailableError('Trace buffer filled; the trace is incomplete')
  return loadTrace(path, startup)
}

export const loadTrace = async (path: string, startup: boolean): Promise<Metric[]> => {
  const trace = JSON.parse(await readFile(path, 'utf8')) as {
    traceEvents: TraceEvent[]
    metadata?: { trace_processor_stats?: Record<string, number> }
  }
  for (const [name, value] of Object.entries(trace.metadata?.trace_processor_stats ?? {})) {
    if (/packet_loss|chunks_overwritten|chunks_discarded|data_loss/.test(name) && value > 0)
      throw new UnavailableError(`Incomplete trace: ${name}=${value}`)
  }
  return analyzeTrace(trace.traceEvents, startup)
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

export const heapSnapshot = async (cdp: Cdp, path: string): Promise<Metric[]> => {
  const output = createWriteStream(path)
  let streamError: Error | undefined
  output.on('error', (error) => {
    streamError = error
  })
  output.on('drain', () => cdp.resume())
  const unsubscribe = cdp.on('HeapProfiler.addHeapSnapshotChunk', ({ chunk }: { chunk: string }) => {
    if (!output.write(chunk)) cdp.pause()
  })
  try {
    await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false }, 120000)
    output.end()
    await finished(output)
    if (streamError) throw streamError
    return summarizeHeap(JSON.parse(await readFile(path, 'utf8')))
  } finally {
    unsubscribe()
    cdp.resume()
    output.destroy()
  }
}

export const profileMetrics = async (profile: any, path: string): Promise<Metric[]> => {
  await writeJson(path, profile)
  if (!Array.isArray(profile.samples) || !Array.isArray(profile.timeDeltas)) throw new UnavailableError('CPU profile contains no samples')
  const nodes = new Map<number, any>(profile.nodes.map((node: any) => [node.id, node]))
  const functions = new Map<string, number>()
  for (let i = 0; i < profile.samples.length; i++) {
    const frame = nodes.get(profile.samples[i])?.callFrame
    if (!frame || !Number.isFinite(profile.timeDeltas[i])) continue
    const name = `${frame.functionName || '(anonymous)'} @ ${frame.url || '(native)'}:${frame.lineNumber + 1}`
    functions.set(name, (functions.get(name) ?? 0) + profile.timeDeltas[i] / 1000)
  }
  await writeJson(
    path.replace('.cpuprofile', '-functions.json'),
    [...functions].sort((a, b) => b[1] - a[1]),
  )
  return [
    {
      name: 'profileSampledTime',
      unit: 'ms',
      value: profile.timeDeltas.reduce((sum: number, value: number) => sum + value, 0) / 1000,
      coverage: 'workbench renderer CPU profile; diagnostic timing with profiler overhead',
    },
  ]
}
