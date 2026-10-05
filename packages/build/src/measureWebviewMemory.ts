import { access, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn } from 'node:child_process'
import { ensureLocalVscodeBuild } from './measureLocalVscodeComparison.ts'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const baselineReadyMarker = 'WEBVIEW_MEMORY_BASELINE_READY=1'
const webviewReadyMarker = 'WEBVIEW_MEMORY_READY=1'
const testName = 'webview-single-iframe-show'
const kilobytesPerMebibyte = 1024

interface Options {
  readonly baselineSettleMs: number
  readonly legacyVscodePath: string
  readonly maxAttempts: number
  readonly outputDirectory: string
  readonly resume: boolean
  readonly runs: number
  readonly sampleCount: number
  readonly sampleIntervalMs: number
  readonly singleIframeExecutablePath: string
  readonly singleIframeVscodePath: string
  readonly skipBuild: boolean
  readonly timeoutMs: number
  readonly webviewSettleMs: number
}

interface Summary {
  readonly max: number
  readonly mean: number
  readonly median: number
  readonly min: number
  readonly p95: number
  readonly standardDeviation: number
}

export interface ProcessMemory {
  readonly privateKiB: number
  readonly pssKiB: number
  readonly rssKiB: number
}

export interface MemorySample {
  readonly privateMiB: number
  readonly processCount: number
  readonly pssMiB: number
  readonly rssMiB: number
}

interface WebviewMemorySample {
  readonly baseline: MemorySample
  readonly delta: MemorySample
  readonly withWebview: MemorySample
}

interface MetricResult {
  readonly baselineSamples: readonly number[]
  readonly baselineSummary: Summary
  readonly deltaSamples: readonly number[]
  readonly deltaSummary: Summary
  readonly withWebviewSamples: readonly number[]
  readonly withWebviewSummary: Summary
}

interface ModeResult {
  readonly label: string
  readonly privateMiB: MetricResult
  readonly processCount: MetricResult
  readonly pssMiB: MetricResult
  readonly rssMiB: MetricResult
}

interface BenchmarkResult {
  readonly cachePolicy: string
  readonly completed: boolean
  readonly generatedAt: string
  readonly legacy: ModeResult
  readonly measurement: {
    readonly primaryMetric: string
    readonly processSelection: string
    readonly temporalSampling: string
  }
  readonly runs: number
  readonly runOrder: readonly Mode[]
  readonly schemaVersion: 2
  readonly singleIframe: ModeResult
}

type Mode = 'legacy' | 'singleIframe'

const parseArgv = (argv: readonly string[]): Options => {
  const getString = (name: string, defaultValue = ''): string => {
    const index = argv.lastIndexOf(name)
    const value = argv[index + 1]
    return index === -1 || typeof value !== 'string' ? defaultValue : value
  }
  const getPositiveNumber = (name: string, defaultValue: number): number => {
    const value = Number.parseInt(getString(name, String(defaultValue)), 10)
    return Number.isFinite(value) && value > 0 ? value : defaultValue
  }
  const resolveOptional = (value: string): string => (value ? resolve(value) : '')
  return {
    baselineSettleMs: getPositiveNumber('--baseline-settle-ms', 5000),
    legacyVscodePath: resolveOptional(getString('--legacy-vscode-path', process.env.VSCODE_EXECUTABLE_PATH || '')),
    maxAttempts: getPositiveNumber('--max-attempts', 5),
    outputDirectory: resolve(getString('--output-directory', join(repositoryRoot, '.vscode-webview-memory-results'))),
    resume: argv.includes('--resume'),
    runs: getPositiveNumber('--runs', 10),
    sampleCount: getPositiveNumber('--sample-count', 5),
    sampleIntervalMs: getPositiveNumber('--sample-interval-ms', 200),
    singleIframeExecutablePath: resolveOptional(getString('--single-iframe-executable-path')),
    singleIframeVscodePath: resolveOptional(getString('--single-iframe-vscode-path', process.env.VSCODE_SOURCE_PATH || '')),
    skipBuild: argv.includes('--skip-build'),
    timeoutMs: getPositiveNumber('--timeout-ms', 60_000),
    webviewSettleMs: getPositiveNumber('--webview-settle-ms', 3000),
  }
}

const round = (value: number): number => Math.round(value * 1000) / 1000
const formatDelta = (value: number): string => `${value >= 0 ? '+' : ''}${value}`

const summarize = (values: readonly number[]): Summary => {
  if (values.length === 0) {
    return { max: 0, mean: 0, median: 0, min: 0, p95: 0, standardDeviation: 0 }
  }
  const sorted = values.toSorted((a, b) => a - b)
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const middle = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0 ? ((sorted[middle - 1] || 0) + (sorted[middle] || 0)) / 2 : sorted[middle] || 0
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  return {
    max: round(sorted.at(-1) || 0),
    mean: round(mean),
    median: round(median),
    min: round(sorted[0] || 0),
    p95: round(sorted[Math.ceil(sorted.length * 0.95) - 1] || 0),
    standardDeviation: round(Math.sqrt(variance)),
  }
}

export const parseSmapsRollup = (contents: string): ProcessMemory => {
  const readValue = (name: string): number => {
    const match = contents.match(new RegExp(`^${name}:\\s+(\\d+)\\s+kB$`, 'm'))
    return Number.parseInt(match?.[1] || '0', 10)
  }
  return {
    privateKiB: readValue('Private_Clean') + readValue('Private_Dirty') + readValue('Private_Hugetlb'),
    pssKiB: readValue('Pss'),
    rssKiB: readValue('Rss'),
  }
}

const wait = async (milliseconds: number): Promise<void> => {
  await new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds))
}

const benchmarkOwnedPaths = [
  join(repositoryRoot, '.vscode-user-data-dir'),
  join(repositoryRoot, '.vscode-runtime-dir'),
  join(repositoryRoot, '.vscode-shared-data-dir'),
]
const measurementContinuePath = join(repositoryRoot, '.tmp', 'webview-memory-benchmark-continue')

const getBenchmarkVscodeProcessIds = async (): Promise<readonly number[]> => {
  const entries = await readdir('/proc', { withFileTypes: true })
  const processIds: number[] = []
  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isDirectory() || !/^\d+$/.test(entry.name)) {
        return
      }
      const processId = Number.parseInt(entry.name, 10)
      if (processId === process.pid) {
        return
      }
      try {
        const commandLine = (await readFile(`/proc/${entry.name}/cmdline`, 'utf8')).replaceAll('\0', ' ')
        if (benchmarkOwnedPaths.some((path) => commandLine.includes(path))) {
          processIds.push(processId)
        }
      } catch {
        // The process exited while /proc was being inspected.
      }
    }),
  )
  return processIds.toSorted((a, b) => a - b)
}

const readTotalMemory = async (): Promise<MemorySample> => {
  const processIds = await getBenchmarkVscodeProcessIds()
  if (processIds.length === 0) {
    throw new Error('No benchmark VS Code processes were running at the memory sampling point')
  }
  const memories = await Promise.all(
    processIds.map(async (processId): Promise<ProcessMemory | undefined> => {
      try {
        return parseSmapsRollup(await readFile(`/proc/${processId}/smaps_rollup`, 'utf8'))
      } catch {
        return undefined
      }
    }),
  )
  const available = memories.filter((memory): memory is ProcessMemory => Boolean(memory))
  if (available.length !== processIds.length) {
    throw new Error(`VS Code process set changed while memory was sampled (${available.length}/${processIds.length} readable)`)
  }
  const total = available.reduce(
    (result, memory) => ({
      privateKiB: result.privateKiB + memory.privateKiB,
      pssKiB: result.pssKiB + memory.pssKiB,
      rssKiB: result.rssKiB + memory.rssKiB,
    }),
    { privateKiB: 0, pssKiB: 0, rssKiB: 0 },
  )
  return {
    privateMiB: round(total.privateKiB / kilobytesPerMebibyte),
    processCount: processIds.length,
    pssMiB: round(total.pssKiB / kilobytesPerMebibyte),
    rssMiB: round(total.rssKiB / kilobytesPerMebibyte),
  }
}

const takeStableSample = async (options: Options, settleMs: number): Promise<MemorySample> => {
  await wait(settleMs)
  const samples: MemorySample[] = []
  for (let index = 0; index < options.sampleCount; index++) {
    samples.push(await readTotalMemory())
    if (index + 1 < options.sampleCount) {
      await wait(options.sampleIntervalMs)
    }
  }
  const middleSample = (values: readonly number[]): number => summarize(values).median
  return {
    privateMiB: middleSample(samples.map((sample) => sample.privateMiB)),
    processCount: middleSample(samples.map((sample) => sample.processCount)),
    pssMiB: middleSample(samples.map((sample) => sample.pssMiB)),
    rssMiB: middleSample(samples.map((sample) => sample.rssMiB)),
  }
}

export const subtractMemorySamples = (baseline: MemorySample, withWebview: MemorySample): MemorySample => ({
  privateMiB: round(withWebview.privateMiB - baseline.privateMiB),
  processCount: withWebview.processCount - baseline.processCount,
  pssMiB: round(withWebview.pssMiB - baseline.pssMiB),
  rssMiB: round(withWebview.rssMiB - baseline.rssMiB),
})

const stopBenchmarkVscodeProcesses = async (): Promise<void> => {
  let processIds = await getBenchmarkVscodeProcessIds()
  for (const processId of processIds) {
    try {
      process.kill(processId, 'SIGTERM')
    } catch {
      // The process already exited.
    }
  }
  for (let attempt = 0; attempt < 50 && processIds.length > 0; attempt++) {
    await wait(100)
    processIds = await getBenchmarkVscodeProcessIds()
  }
  for (const processId of processIds) {
    try {
      process.kill(processId, 'SIGKILL')
    } catch {
      // The process already exited.
    }
  }
  await wait(100)
  const remaining = await getBenchmarkVscodeProcessIds()
  if (remaining.length > 0) {
    throw new Error(`Benchmark VS Code processes did not exit: ${remaining.join(', ')}`)
  }
}

const clearBenchmarkState = async (): Promise<void> => {
  await Promise.all([
    ...benchmarkOwnedPaths.map((path) => rm(path, { force: true, recursive: true })),
    rm(`${measurementContinuePath}-baseline`, { force: true }),
    rm(`${measurementContinuePath}-webview`, { force: true }),
    rm(join(repositoryRoot, '.vscode-extensions'), { force: true, recursive: true }),
    rm(join(repositoryRoot, '.vscode-test', 'extensions', 'sample.single-iframe-webview-legacy'), { force: true, recursive: true }),
  ])
}

const prepareColdLaunch = async (): Promise<void> => {
  await stopBenchmarkVscodeProcesses()
  await clearBenchmarkState()
}

const killProcessGroup = (pid: number | undefined, signal: NodeJS.Signals = 'SIGTERM'): void => {
  if (!pid) {
    return
  }
  try {
    process.kill(-pid, signal)
  } catch {
    // The child already exited.
  }
}

const runSample = async (options: Options, mode: Mode, singleIframeExecutablePath: string): Promise<WebviewMemorySample> => {
  await prepareColdLaunch()
  const launcherPath = join(repositoryRoot, 'scripts', 'run-vscode-single-iframe-e2e.sh')
  const args = [
    '-a',
    '-s',
    '-screen 0 1600x1000x24 -nolisten tcp',
    process.execPath,
    'packages/cli/bin/test.js',
    '--run-skipped-tests-anyway',
    '--only',
    testName,
    '--vscode-path',
    launcherPath,
    '--enable-extensions',
    '--clear-extensions',
    '--headless',
  ]
  const env = { ...process.env }
  delete env.VSCODE_EXECUTABLE_PATH
  delete env.VSCODE_MEMORY_LEAK_FINDER_WEBVIEW_NO_SERVICE_WORKER
  delete env.VSCODE_SOURCE_PATH
  env.VSCODE_MEMORY_LEAK_FINDER_MEASURE_WEBVIEW_MEMORY = '1'
  env.VSCODE_MEMORY_LEAK_FINDER_MEMORY_CONTINUE_PATH = measurementContinuePath
  if (mode === 'legacy') {
    env.VSCODE_EXECUTABLE_PATH = options.legacyVscodePath
  } else {
    env.VSCODE_MEMORY_LEAK_FINDER_WEBVIEW_NO_SERVICE_WORKER = '1'
    env.VSCODE_EXECUTABLE_PATH = singleIframeExecutablePath
  }

  return new Promise<WebviewMemorySample>((resolvePromise, rejectPromise) => {
    const child = spawn('xvfb-run', args, { cwd: repositoryRoot, detached: true, env, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    let baselineMeasurement: Promise<MemorySample> | undefined
    let webviewMeasurement: Promise<MemorySample> | undefined
    const measureAndContinue = async (point: 'baseline' | 'webview', settleMs: number): Promise<MemorySample> => {
      const sample = await takeStableSample(options, settleMs)
      await mkdir(dirname(measurementContinuePath), { recursive: true })
      await writeFile(`${measurementContinuePath}-${point}`, '')
      return sample
    }
    const onOutput = (chunk: string): void => {
      output += chunk
      if (!baselineMeasurement && output.includes(baselineReadyMarker)) {
        baselineMeasurement = measureAndContinue('baseline', options.baselineSettleMs)
      }
      if (!webviewMeasurement && output.includes(webviewReadyMarker)) {
        webviewMeasurement = measureAndContinue('webview', options.webviewSettleMs)
      }
    }
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', onOutput)
    child.stderr.on('data', onOutput)
    let timedOut = false
    let forceKillTimeout: NodeJS.Timeout | undefined
    const timeout = setTimeout(() => {
      timedOut = true
      killProcessGroup(child.pid)
      forceKillTimeout = setTimeout(() => killProcessGroup(child.pid, 'SIGKILL'), 5000)
    }, options.timeoutMs)
    child.on('error', (error) => {
      clearTimeout(timeout)
      rejectPromise(error)
    })
    child.on('exit', async (code) => {
      clearTimeout(timeout)
      clearTimeout(forceKillTimeout)
      try {
        const baseline = baselineMeasurement ? await baselineMeasurement : undefined
        const withWebview = webviewMeasurement ? await webviewMeasurement : undefined
        await stopBenchmarkVscodeProcesses()
        await clearBenchmarkState()
        if (timedOut) {
          throw new Error(`${mode} sample timed out after ${options.timeoutMs} ms`)
        }
        if (code !== 0) {
          throw new Error(`${mode} sample failed with exit code ${code}`)
        }
        if (!baseline) {
          throw new Error(`No ${baselineReadyMarker} marker found for ${mode}`)
        }
        if (!withWebview) {
          throw new Error(`No ${webviewReadyMarker} marker found for ${mode}`)
        }
        resolvePromise({ baseline, delta: subtractMemorySamples(baseline, withWebview), withWebview })
      } catch (error) {
        rejectPromise(new Error(`${error instanceof Error ? error.message : String(error)}\n${output.slice(-4000)}`))
      }
    })
  })
}

const runSampleWithRetries = async (options: Options, mode: Mode, executablePath: string): Promise<WebviewMemorySample> => {
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await runSample(options, mode, executablePath)
    } catch (error) {
      if (attempt === options.maxAttempts) {
        throw error
      }
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`[${mode}] attempt ${attempt}/${options.maxAttempts} failed; retrying with a fresh profile\n${message.slice(-4000)}`)
    }
  }
  throw new Error(`Unable to run ${mode} sample`)
}

const createMetricResult = (samples: readonly WebviewMemorySample[], getValue: (sample: MemorySample) => number): MetricResult => {
  const baselineSamples = samples.map((sample) => getValue(sample.baseline))
  const deltaSamples = samples.map((sample) => getValue(sample.delta))
  const withWebviewSamples = samples.map((sample) => getValue(sample.withWebview))
  return {
    baselineSamples,
    baselineSummary: summarize(baselineSamples),
    deltaSamples,
    deltaSummary: summarize(deltaSamples),
    withWebviewSamples,
    withWebviewSummary: summarize(withWebviewSamples),
  }
}

const createModeResult = (label: string, samples: readonly WebviewMemorySample[]): ModeResult => ({
  label,
  privateMiB: createMetricResult(samples, (sample) => sample.privateMiB),
  processCount: createMetricResult(samples, (sample) => sample.processCount),
  pssMiB: createMetricResult(samples, (sample) => sample.pssMiB),
  rssMiB: createMetricResult(samples, (sample) => sample.rssMiB),
})

const createResult = (
  options: Options,
  legacySamples: readonly WebviewMemorySample[],
  singleIframeSamples: readonly WebviewMemorySample[],
  completed: boolean,
): BenchmarkResult => ({
  cachePolicy: 'Before and after every sample: stop benchmark-owned VS Code processes and delete profiles, extensions, and caches',
  completed,
  generatedAt: new Date().toISOString(),
  legacy: createModeResult('VS Code 1.128.0 — double iframe with service worker', legacySamples),
  measurement: {
    primaryMetric:
      'Per-run increase in the sum of Linux /proc/<pid>/smaps_rollup Pss for all benchmark-owned VS Code processes after opening the webview, in MiB',
    processSelection: 'Processes whose command line contains the benchmark user-data, runtime, or shared-data directory',
    temporalSampling: getTemporalSamplingDescription(options),
  },
  runs: options.runs,
  runOrder: ['legacy', 'singleIframe'],
  schemaVersion: 2,
  singleIframe: createModeResult('Local minified VS Code — single iframe without service worker', singleIframeSamples),
})

const escapeXml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

const createChart = (result: BenchmarkResult): string => {
  const width = 1100
  const height = 680
  const plot = { bottom: 500, left: 90, right: 1050, top: 70 }
  const legacy = result.legacy.pssMiB.deltaSamples
  const singleIframe = result.singleIframe.pssMiB.deltaSamples
  const allValues = [...legacy, ...singleIframe]
  const observedMin = Math.min(...allValues, 0)
  const observedMax = Math.max(...allValues, 0)
  const padding = Math.max((observedMax - observedMin) * 0.1, 5)
  const yMin = Math.floor((observedMin - padding) / 5) * 5
  const yMax = Math.ceil((observedMax + padding) / 5) * 5
  const x = (index: number): number => plot.left + (index * (plot.right - plot.left)) / Math.max(result.runs - 1, 1)
  const y = (value: number): number => plot.bottom - ((value - yMin) / Math.max(yMax - yMin, 1)) * (plot.bottom - plot.top)
  const path = (values: readonly number[]): string => values.map((value, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(value)}`).join(' ')
  const points = (values: readonly number[], color: string): string =>
    values
      .map(
        (value, index) =>
          `<circle cx="${x(index)}" cy="${y(value)}" r="4" fill="${color}"><title>Run ${index + 1}: ${value} MiB</title></circle>`,
      )
      .join('')
  const grid = Array.from({ length: 6 }, (_, index) => {
    const value = yMin + ((yMax - yMin) * index) / 5
    return `<line x1="${plot.left}" y1="${y(value)}" x2="${plot.right}" y2="${y(value)}" stroke="#d8dee9"/><text x="${plot.left - 12}" y="${y(value) + 5}" text-anchor="end">${round(value)}</text>`
  }).join('')
  const delta = round(result.legacy.pssMiB.deltaSummary.median - result.singleIframe.pssMiB.deltaSummary.median)
  const comparison = delta >= 0 ? `${delta} MiB less` : `${Math.abs(delta)} MiB more`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">Incremental VS Code memory for one webview</title>
  <desc id="description">Change in Linux proportional set size from before opening the webview to after it is ready.</desc>
  <rect width="100%" height="100%" fill="#fff"/><style>text { font: 14px system-ui,sans-serif; fill: #24292f } .heading { font-size: 24px; font-weight: 600 } .summary { font-size: 16px }</style>
  <text class="heading" x="${plot.left}" y="35">Incremental VS Code memory for one webview</text>${grid}
  <line x1="${plot.left}" y1="${plot.top}" x2="${plot.left}" y2="${plot.bottom}" stroke="#57606a"/><line x1="${plot.left}" y1="${plot.bottom}" x2="${plot.right}" y2="${plot.bottom}" stroke="#57606a"/>
  <path d="${path(legacy)}" fill="none" stroke="#0969da" stroke-width="2"/>${points(legacy, '#0969da')}
  <path d="${path(singleIframe)}" fill="none" stroke="#cf5700" stroke-width="2"/>${points(singleIframe, '#cf5700')}
  <text x="${(plot.left + plot.right) / 2}" y="${plot.bottom + 40}" text-anchor="middle">Paired cold run</text><text x="24" y="${(plot.top + plot.bottom) / 2}" text-anchor="middle" transform="rotate(-90 24 ${(plot.top + plot.bottom) / 2})">PSS increase (MiB)</text>
  <circle cx="${plot.left}" cy="565" r="5" fill="#0969da"/><text x="${plot.left + 14}" y="570">${escapeXml(result.legacy.label)} — median ${result.legacy.pssMiB.baselineSummary.median} → ${result.legacy.pssMiB.withWebviewSummary.median} MiB; ${formatDelta(result.legacy.pssMiB.deltaSummary.median)} MiB</text>
  <circle cx="${plot.left}" cy="600" r="5" fill="#cf5700"/><text x="${plot.left + 14}" y="605">${escapeXml(result.singleIframe.label)} — median ${result.singleIframe.pssMiB.baselineSummary.median} → ${result.singleIframe.pssMiB.withWebviewSummary.median} MiB; ${formatDelta(result.singleIframe.pssMiB.deltaSummary.median)} MiB</text>
  <text class="summary" x="${plot.left}" y="645">Median webview cost: single iframe uses ${comparison} PSS. No outliers removed.</text>
</svg>\n`
}

const samplesFromResult = (result: ModeResult): WebviewMemorySample[] =>
  result.pssMiB.deltaSamples.map((_, index) => {
    const readSample = (point: 'baselineSamples' | 'deltaSamples' | 'withWebviewSamples'): MemorySample => ({
      privateMiB: result.privateMiB[point][index] || 0,
      processCount: result.processCount[point][index] || 0,
      pssMiB: result.pssMiB[point][index] || 0,
      rssMiB: result.rssMiB[point][index] || 0,
    })
    return {
      baseline: readSample('baselineSamples'),
      delta: readSample('deltaSamples'),
      withWebview: readSample('withWebviewSamples'),
    }
  })

const getTemporalSamplingDescription = (options: Options): string =>
  `Median of ${options.sampleCount} snapshots at ${options.sampleIntervalMs} ms intervals; baseline settles for ${options.baselineSettleMs} ms and ready webview settles for ${options.webviewSettleMs} ms; the test proceeds immediately after each measurement handshake`

const readPreviousSamples = async (options: Options): Promise<{ legacy: WebviewMemorySample[]; singleIframe: WebviewMemorySample[] }> => {
  if (!options.resume) {
    return { legacy: [], singleIframe: [] }
  }
  const resultPath = join(options.outputDirectory, 'webview-memory.json')
  const previous = JSON.parse(await readFile(resultPath, 'utf8')) as BenchmarkResult
  if (
    previous.schemaVersion !== 2 ||
    previous.runs !== options.runs ||
    previous.measurement.temporalSampling !== getTemporalSamplingDescription(options)
  ) {
    throw new Error(`Cannot resume incompatible benchmark results at ${resultPath}`)
  }
  return {
    legacy: samplesFromResult(previous.legacy).slice(0, options.runs),
    singleIframe: samplesFromResult(previous.singleIframe).slice(0, options.runs),
  }
}

const writeResults = async (options: Options, result: BenchmarkResult): Promise<void> => {
  await mkdir(options.outputDirectory, { recursive: true })
  await Promise.all([
    writeFile(join(options.outputDirectory, 'webview-memory.json'), `${JSON.stringify(result, undefined, 2)}\n`),
    writeFile(join(options.outputDirectory, 'webview-memory.svg'), createChart(result)),
  ])
}

const assertPath = async (name: string, path: string): Promise<void> => {
  if (!path) {
    throw new Error(`${name} is required`)
  }
  try {
    await access(path)
  } catch {
    throw new Error(`${name} does not exist: ${path}`)
  }
}

export const main = async (): Promise<void> => {
  if (process.argv.includes('--help')) {
    console.log(`Usage: npm run measure-webview-memory -- \\
  --legacy-vscode-path /path/to/code \\
  (--single-iframe-vscode-path /path/to/vscode/source | --single-iframe-executable-path /path/to/code) [options]

Options:
  --runs <count>                Paired cold samples (default: 10)
  --baseline-settle-ms <ms>     Wait before pre-webview sampling (default: 5000)
  --webview-settle-ms <ms>      Wait after webview readiness (default: 3000)
  --sample-count <count>        /proc snapshots per sample (default: 5)
  --sample-interval-ms <ms>     Delay between snapshots (default: 200)
  --output-directory <path>     JSON and SVG destination
  --timeout-ms <ms>             Per-attempt timeout (default: 60000)
  --max-attempts <count>        Attempts per successful sample (default: 5)
  --single-iframe-executable-path <path>
                                 Use an already-built local executable
  --skip-build                  Reuse the cached local minified build
  --resume                      Continue a compatible partial result file`)
    return
  }
  const options = parseArgv(process.argv.slice(2))
  await assertPath('--legacy-vscode-path', options.legacyVscodePath)
  let executablePath = options.singleIframeExecutablePath
  if (executablePath) {
    await assertPath('--single-iframe-executable-path', executablePath)
    console.log(`Using local minified VS Code executable ${executablePath}`)
  } else {
    await assertPath('--single-iframe-vscode-path', options.singleIframeVscodePath)
    console.log(`Preparing minified local VS Code build from ${options.singleIframeVscodePath}`)
    executablePath = await ensureLocalVscodeBuild(options.singleIframeVscodePath, options.skipBuild)
  }
  const samples = await readPreviousSamples(options)
  for (let index = 0; index < options.runs; index++) {
    for (const mode of ['legacy', 'singleIframe'] as const) {
      const target = mode === 'legacy' ? samples.legacy : samples.singleIframe
      if (target.length > index) {
        continue
      }
      const sample = await runSampleWithRetries(options, mode, executablePath)
      target.push(sample)
      console.log(
        `[${mode}] ${index + 1}/${options.runs}: PSS ${sample.baseline.pssMiB} → ${sample.withWebview.pssMiB} MiB (${formatDelta(sample.delta.pssMiB)} MiB), processes ${sample.baseline.processCount} → ${sample.withWebview.processCount}`,
      )
      await writeResults(options, createResult(options, samples.legacy, samples.singleIframe, false))
    }
  }
  const result = createResult(options, samples.legacy, samples.singleIframe, true)
  await writeResults(options, result)
  const legacyCost = result.legacy.pssMiB.deltaSummary.median
  const singleIframeCost = result.singleIframe.pssMiB.deltaSummary.median
  const delta = round(legacyCost - singleIframeCost)
  console.log(`Median webview PSS: legacy ${formatDelta(legacyCost)} MiB, single iframe ${formatDelta(singleIframeCost)} MiB`)
  console.log(`Median webview PSS difference: ${delta} MiB (${delta >= 0 ? 'less' : 'more'} with single iframe)`)
  console.log(`Results: ${join(options.outputDirectory, 'webview-memory.json')}`)
  console.log(`Chart: ${join(options.outputDirectory, 'webview-memory.svg')}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main()
}
