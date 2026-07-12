import { access, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn } from 'node:child_process'
import { ensureLocalVscodeBuild } from './measureLocalVscodeComparison.ts'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const internalMeasurementPattern = /WEBVIEW_INTERNAL_LOAD_TIME_MS=([0-9]+(?:\.[0-9]+)?)/g
const uiMeasurementPattern = /WEBVIEW_UI_LOAD_TIME_MS=([0-9]+(?:\.[0-9]+)?)/g
const testName = 'webview-single-iframe-show'

interface Options {
  readonly legacyVscodePath: string
  readonly maxAttempts: number
  readonly outputDirectory: string
  readonly resume: boolean
  readonly runs: number
  readonly skipBuild: boolean
  readonly singleIframeVscodePath: string
  readonly timeoutMs: number
}

interface Summary {
  readonly max: number
  readonly mean: number
  readonly median: number
  readonly min: number
  readonly p95: number
  readonly standardDeviation: number
}

interface BenchmarkResult {
  readonly cachePolicy: string
  readonly completed: boolean
  readonly generatedAt: string
  readonly legacy: {
    readonly internalSamplesMs: readonly number[]
    readonly internalSummary: Summary
    readonly label: string
    readonly uiSamplesMs: readonly number[]
    readonly uiSummary: Summary
  }
  readonly measurements: {
    readonly internal: string
    readonly ui: string
  }
  readonly runs: number
  readonly runOrder: readonly Mode[]
  readonly schemaVersion: 2
  readonly singleIframe: {
    readonly internalSamplesMs: readonly number[]
    readonly internalSummary: Summary
    readonly label: string
    readonly uiSamplesMs: readonly number[]
    readonly uiSummary: Summary
  }
}

interface Sample {
  readonly internalMs: number
  readonly uiMs: number
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
    legacyVscodePath: resolveOptional(getString('--legacy-vscode-path', process.env.VSCODE_EXECUTABLE_PATH || '')),
    maxAttempts: getPositiveNumber('--max-attempts', 10),
    outputDirectory: resolve(getString('--output-directory', join(repositoryRoot, '.vscode-webview-load-time-results'))),
    resume: argv.includes('--resume'),
    runs: getPositiveNumber('--runs', 17),
    skipBuild: argv.includes('--skip-build'),
    singleIframeVscodePath: resolveOptional(getString('--single-iframe-vscode-path', process.env.VSCODE_SOURCE_PATH || '')),
    timeoutMs: getPositiveNumber('--timeout-ms', 45_000),
  }
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

const round = (value: number): number => Math.round(value * 1000) / 1000

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

const escapeXml = (value: string): string => {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

const createChart = (result: BenchmarkResult, metric: 'internal' | 'ui'): string => {
  const width = 1100
  const height = 680
  const plot = { bottom: 500, left: 90, right: 1050, top: 70 }
  const isUiMetric = metric === 'ui'
  const legacySamples = isUiMetric ? result.legacy.uiSamplesMs : result.legacy.internalSamplesMs
  const singleIframeSamples = isUiMetric ? result.singleIframe.uiSamplesMs : result.singleIframe.internalSamplesMs
  const legacySummary = isUiMetric ? result.legacy.uiSummary : result.legacy.internalSummary
  const singleIframeSummary = isUiMetric ? result.singleIframe.uiSummary : result.singleIframe.internalSummary
  const allValues = [...legacySamples, ...singleIframeSamples]
  const observedMax = Math.max(...allValues, 1)
  const yMax = Math.ceil((observedMax * 1.1) / 10) * 10
  const x = (index: number): number => plot.left + (index * (plot.right - plot.left)) / Math.max(result.runs - 1, 1)
  const y = (value: number): number => plot.bottom - (value / yMax) * (plot.bottom - plot.top)
  const path = (values: readonly number[]): string =>
    values.map((value, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(value)}`).join(' ')
  const points = (values: readonly number[], color: string): string =>
    values
      .map(
        (value, index) =>
          `<circle cx="${x(index)}" cy="${y(value)}" r="4" fill="${color}"><title>Run ${index + 1}: ${round(value)} ms</title></circle>`,
      )
      .join('')
  const gridLines = Array.from({ length: 6 }, (_, index) => {
    const value = (yMax * index) / 5
    const yPosition = y(value)
    return `<line x1="${plot.left}" y1="${yPosition}" x2="${plot.right}" y2="${yPosition}" stroke="#d8dee9"/><text x="${plot.left - 12}" y="${yPosition + 5}" text-anchor="end">${round(value)}</text>`
  }).join('')
  const xLabels = Array.from({ length: result.runs }, (_, index) => {
    if (result.runs > 20 && index % 2 !== 0) {
      return ''
    }
    return `<text x="${x(index)}" y="${plot.bottom + 28}" text-anchor="middle">${index + 1}</text>`
  }).join('')
  const medianImprovement = legacySummary.median ? ((legacySummary.median - singleIframeSummary.median) / legacySummary.median) * 100 : 0
  const comparison = medianImprovement >= 0 ? `${round(medianImprovement)}% faster` : `${round(Math.abs(medianImprovement))}% slower`
  const title = isUiMetric ? 'Cold webview click-to-ready time' : 'Cold webview internal load time'
  const description = isUiMetric ? 'Quick Pick selection until visible ready marker' : 'Extension-internal createWebviewPanel lifecycle'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">${title}</title>
  <desc id="description">${description}; ${result.runs} cold-profile samples for legacy and single-iframe Electron webviews.</desc>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <style>text { font: 14px system-ui, sans-serif; fill: #24292f; } .heading { font-size: 24px; font-weight: 600; } .summary { font-size: 16px; }</style>
  <text class="heading" x="${plot.left}" y="35">${title}</text>
  ${gridLines}
  <line x1="${plot.left}" y1="${plot.top}" x2="${plot.left}" y2="${plot.bottom}" stroke="#57606a"/>
  <line x1="${plot.left}" y1="${plot.bottom}" x2="${plot.right}" y2="${plot.bottom}" stroke="#57606a"/>
  ${xLabels}
  <text x="${(plot.left + plot.right) / 2}" y="${plot.bottom + 58}" text-anchor="middle">Cold run</text>
  <text x="24" y="${(plot.top + plot.bottom) / 2}" text-anchor="middle" transform="rotate(-90 24 ${(plot.top + plot.bottom) / 2})">Load time (ms)</text>
  <path d="${path(legacySamples)}" fill="none" stroke="#0969da" stroke-width="2"/>
  ${points(legacySamples, '#0969da')}
  <path d="${path(singleIframeSamples)}" fill="none" stroke="#cf5700" stroke-width="2"/>
  ${points(singleIframeSamples, '#cf5700')}
  <circle cx="${plot.left}" cy="575" r="5" fill="#0969da"/><text x="${plot.left + 14}" y="580">${escapeXml(result.legacy.label)} — median ${legacySummary.median} ms, mean ${legacySummary.mean} ms</text>
  <circle cx="${plot.left}" cy="605" r="5" fill="#cf5700"/><text x="${plot.left + 14}" y="610">${escapeXml(result.singleIframe.label)} — median ${singleIframeSummary.median} ms, mean ${singleIframeSummary.mean} ms</text>
  <text class="summary" x="${plot.left}" y="645">Median result: single iframe is ${comparison}. All ${allValues.length} samples are shown; no outliers were removed.</text>
</svg>\n`
}

const createResult = (
  options: Options,
  legacyInternalSamples: readonly number[],
  legacyUiSamples: readonly number[],
  singleIframeInternalSamples: readonly number[],
  singleIframeUiSamples: readonly number[],
  completed: boolean,
): BenchmarkResult => {
  return {
    cachePolicy:
      'Before and after every attempt: stop all benchmark-owned VS Code processes; delete user data, Service Worker/Cache Storage, Chromium caches, runtime data, shared-process data, and extensions',
    completed,
    generatedAt: new Date().toISOString(),
    legacy: {
      internalSamplesMs: legacyInternalSamples,
      internalSummary: summarize(legacyInternalSamples),
      label: 'VS Code 1.128.0 — legacy double iframe',
      uiSamplesMs: legacyUiSamples,
      uiSummary: summarize(legacyUiSamples),
    },
    measurements: {
      internal:
        'Extension-host performance.now() immediately before createWebviewPanel until CSS, image, script, VS Code API, and an extension-to-webview-to-extension message round trip are ready',
      ui: 'Page-object-worker timestamp immediately after the Quick Pick click is dispatched until the webview ready marker is visible',
    },
    runs: options.runs,
    runOrder: ['legacy', 'singleIframe'],
    schemaVersion: 2,
    singleIframe: {
      internalSamplesMs: singleIframeInternalSamples,
      internalSummary: summarize(singleIframeInternalSamples),
      label: 'Local minified VS Code — single iframe',
      uiSamplesMs: singleIframeUiSamples,
      uiSummary: summarize(singleIframeUiSamples),
    },
  }
}

const writeResults = async (options: Options, result: BenchmarkResult): Promise<void> => {
  await mkdir(options.outputDirectory, { recursive: true })
  await Promise.all([
    writeFile(join(options.outputDirectory, 'webview-load-time.json'), `${JSON.stringify(result, undefined, 2)}\n`),
    writeFile(join(options.outputDirectory, 'webview-load-time.svg'), createChart(result, 'ui')),
    writeFile(join(options.outputDirectory, 'webview-internal-load-time.svg'), createChart(result, 'internal')),
  ])
}

const readPreviousSamples = async (
  options: Options,
): Promise<{ legacyInternal: number[]; legacyUi: number[]; singleIframeInternal: number[]; singleIframeUi: number[] }> => {
  if (!options.resume) {
    return { legacyInternal: [], legacyUi: [], singleIframeInternal: [], singleIframeUi: [] }
  }
  const resultPath = join(options.outputDirectory, 'webview-load-time.json')
  const previous = JSON.parse(await readFile(resultPath, 'utf8')) as BenchmarkResult
  if (previous.schemaVersion !== 2 || previous.runs !== options.runs) {
    throw new Error(`Cannot resume incompatible benchmark results at ${resultPath}`)
  }
  const isValidSample = (value: number): boolean => Number.isFinite(value) && value > 0
  const legacyInternal = previous.legacy.internalSamplesMs.filter(isValidSample).slice(0, options.runs)
  const legacyUi = previous.legacy.uiSamplesMs.filter(isValidSample).slice(0, options.runs)
  const singleIframeInternal = previous.singleIframe.internalSamplesMs.filter(isValidSample).slice(0, options.runs)
  const singleIframeUi = previous.singleIframe.uiSamplesMs.filter(isValidSample).slice(0, options.runs)
  if (legacyInternal.length !== legacyUi.length || singleIframeInternal.length !== singleIframeUi.length) {
    throw new Error(`Cannot resume incomplete paired metrics at ${resultPath}`)
  }
  console.log(`Resuming with ${legacyInternal.length} legacy and ${singleIframeInternal.length} single-iframe samples`)
  return { legacyInternal, legacyUi, singleIframeInternal, singleIframeUi }
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

const benchmarkOwnedPaths = [
  join(repositoryRoot, '.vscode-user-data-dir'),
  join(repositoryRoot, '.vscode-runtime-dir'),
  join(repositoryRoot, '.vscode-shared-data-dir'),
]

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
  return processIds
}

const wait = async (milliseconds: number): Promise<void> => {
  await new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds))
}

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
  if (processIds.length > 0) {
    await wait(250)
  }
  const remainingProcessIds = await getBenchmarkVscodeProcessIds()
  if (remainingProcessIds.length > 0) {
    throw new Error(`Benchmark VS Code processes did not exit: ${remainingProcessIds.join(', ')}`)
  }
}

const clearBenchmarkState = async (): Promise<void> => {
  await Promise.all([
    ...benchmarkOwnedPaths.map((path) => rm(path, { force: true, recursive: true })),
    rm(join(repositoryRoot, '.vscode-extensions'), { force: true, recursive: true }),
    rm(join(repositoryRoot, '.vscode-test', 'extensions', 'sample.single-iframe-webview-legacy'), { force: true, recursive: true }),
  ])
}

const prepareColdLaunch = async (): Promise<void> => {
  await stopBenchmarkVscodeProcesses()
  await clearBenchmarkState()
  const processIds = await getBenchmarkVscodeProcessIds()
  if (processIds.length > 0) {
    throw new Error(`Another benchmark VS Code instance is already running: ${processIds.join(', ')}`)
  }
}

const runSample = async (options: Options, mode: Mode, singleIframeExecutablePath: string): Promise<Sample> => {
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
  if (mode === 'legacy') {
    env.VSCODE_EXECUTABLE_PATH = options.legacyVscodePath
  } else {
    env.VSCODE_MEMORY_LEAK_FINDER_WEBVIEW_NO_SERVICE_WORKER = '1'
    env.VSCODE_EXECUTABLE_PATH = singleIframeExecutablePath
  }

  return new Promise<Sample>((resolvePromise, rejectPromise) => {
    const child = spawn('xvfb-run', args, {
      cwd: repositoryRoot,
      detached: true,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      output += chunk
    })
    child.stderr.on('data', (chunk: string) => {
      output += chunk
    })
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
        await stopBenchmarkVscodeProcesses()
        await clearBenchmarkState()
      } catch (error) {
        rejectPromise(error)
        return
      }
      if (timedOut) {
        rejectPromise(new Error(`${mode} sample timed out after ${options.timeoutMs} ms\n${output.slice(-4000)}`))
        return
      }
      if (code !== 0) {
        rejectPromise(new Error(`${mode} sample failed with exit code ${code}\n${output.slice(-4000)}`))
        return
      }
      const internalMatches = [...output.matchAll(internalMeasurementPattern)]
      const uiMatches = [...output.matchAll(uiMeasurementPattern)]
      const internalMs = Number.parseFloat(internalMatches.at(-1)?.[1] || '')
      const uiMs = Number.parseFloat(uiMatches.at(-1)?.[1] || '')
      if (!Number.isFinite(internalMs) || internalMs <= 0 || !Number.isFinite(uiMs) || uiMs <= 0) {
        rejectPromise(new Error(`No valid paired webview load-time markers found for ${mode}\n${output.slice(-4000)}`))
        return
      }
      resolvePromise({ internalMs, uiMs })
    })
  })
}

const runSampleWithRetries = async (options: Options, mode: Mode, singleIframeExecutablePath: string): Promise<Sample> => {
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await runSample(options, mode, singleIframeExecutablePath)
    } catch (error) {
      if (attempt === options.maxAttempts) {
        throw error
      }
      console.warn(`[${mode}] attempt ${attempt}/${options.maxAttempts} failed; retrying with a fresh profile`)
    }
  }
  throw new Error(`Unable to run ${mode} sample`)
}

export const main = async (): Promise<void> => {
  if (process.argv.includes('--help')) {
    console.log(`Usage: npm --prefix packages/build run measure-webview-load-time -- \\
  --legacy-vscode-path /path/to/code \\
  --single-iframe-vscode-path /path/to/vscode/source [options]

Options:
  --runs <count>             Successful samples per loader (default: 17)
  --output-directory <path>  JSON and SVG destination
  --timeout-ms <ms>          Per-attempt timeout (default: 45000)
  --max-attempts <count>     Attempts per successful sample (default: 10)
  --skip-build               Reuse the cached local minified build
  --resume                   Continue a compatible partial result file`)
    return
  }
  const options = parseArgv(process.argv.slice(2))
  await assertPath('--legacy-vscode-path', options.legacyVscodePath)
  await assertPath('--single-iframe-vscode-path', options.singleIframeVscodePath)
  console.log(`Preparing minified local VS Code build from ${options.singleIframeVscodePath}`)
  const singleIframeExecutablePath = await ensureLocalVscodeBuild(options.singleIframeVscodePath, options.skipBuild)
  console.log(`Using minified local VS Code executable ${singleIframeExecutablePath}`)
  const previous = await readPreviousSamples(options)
  const legacyInternalSamples = previous.legacyInternal
  const legacyUiSamples = previous.legacyUi
  const singleIframeInternalSamples = previous.singleIframeInternal
  const singleIframeUiSamples = previous.singleIframeUi

  const modes: readonly Mode[] = ['legacy', 'singleIframe']
  for (const mode of modes) {
    for (let index = 0; index < options.runs; index++) {
      const internalSamples = mode === 'legacy' ? legacyInternalSamples : singleIframeInternalSamples
      const uiSamples = mode === 'legacy' ? legacyUiSamples : singleIframeUiSamples
      if (internalSamples.length > index) {
        continue
      }
      const sample = await runSampleWithRetries(options, mode, singleIframeExecutablePath)
      internalSamples.push(sample.internalMs)
      uiSamples.push(sample.uiMs)
      console.log(
        `[${mode}] ${internalSamples.length}/${options.runs}: internal ${round(sample.internalMs)} ms, click-to-ready ${round(sample.uiMs)} ms`,
      )
      await writeResults(
        options,
        createResult(options, legacyInternalSamples, legacyUiSamples, singleIframeInternalSamples, singleIframeUiSamples, false),
      )
    }
  }

  const result = createResult(options, legacyInternalSamples, legacyUiSamples, singleIframeInternalSamples, singleIframeUiSamples, true)
  await writeResults(options, result)
  const internalImprovement =
    ((result.legacy.internalSummary.median - result.singleIframe.internalSummary.median) / result.legacy.internalSummary.median) * 100
  const uiImprovement = ((result.legacy.uiSummary.median - result.singleIframe.uiSummary.median) / result.legacy.uiSummary.median) * 100
  console.log(`Internal median improvement: ${round(internalImprovement)}%`)
  console.log(`Click-to-ready median improvement: ${round(uiImprovement)}%`)
  console.log(`Results: ${join(options.outputDirectory, 'webview-load-time.json')}`)
  console.log(`Click-to-ready chart: ${join(options.outputDirectory, 'webview-load-time.svg')}`)
  console.log(`Internal chart: ${join(options.outputDirectory, 'webview-internal-load-time.svg')}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main()
}
