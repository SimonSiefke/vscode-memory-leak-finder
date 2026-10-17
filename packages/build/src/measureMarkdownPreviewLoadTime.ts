import { spawn } from 'node:child_process'
import { access, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { ensureLocalVscodeBuild } from './measureLocalVscodeComparison.ts'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const measurementPattern = /MARKDOWN_PREVIEW_LOAD_TIME_MS=([0-9]+(?:\.[0-9]+)?)/g
const proposal = 'webviewNoServiceWorker'
const testName = 'markdown-preview-load-time'

type Mode = 'legacy' | 'singleIframe'

export interface Options {
  readonly maxAttempts: number
  readonly outputDirectory: string
  readonly resume: boolean
  readonly runs: number
  readonly skipBuild: boolean
  readonly timeoutMs: number
  readonly vscodePath: string
}

interface ExtensionManifest {
  enabledApiProposals?: string[]
  readonly [key: string]: unknown
}

export interface Summary {
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
    readonly label: string
    readonly samplesMs: readonly number[]
    readonly summary: Summary
  }
  readonly measurement: string
  readonly runOrder: readonly Mode[]
  readonly runs: number
  readonly schemaVersion: 1
  readonly singleIframe: {
    readonly label: string
    readonly samplesMs: readonly number[]
    readonly summary: Summary
  }
}

export const parseArgv = (argv: readonly string[]): Options => {
  const getString = (name: string, defaultValue = ''): string => {
    const index = argv.lastIndexOf(name)
    const value = argv[index + 1]
    return index === -1 || typeof value !== 'string' ? defaultValue : value
  }
  const getPositiveNumber = (name: string, defaultValue: number): number => {
    const value = Number.parseInt(getString(name, String(defaultValue)), 10)
    return Number.isFinite(value) && value > 0 ? value : defaultValue
  }
  const vscodePath = getString('--vscode-path', process.env.VSCODE_SOURCE_PATH || '')
  return {
    maxAttempts: getPositiveNumber('--max-attempts', 5),
    outputDirectory: resolve(getString('--output-directory', join(repositoryRoot, '.vscode-markdown-preview-load-time-results'))),
    resume: argv.includes('--resume'),
    runs: getPositiveNumber('--runs', 17),
    skipBuild: argv.includes('--skip-build'),
    timeoutMs: getPositiveNumber('--timeout-ms', 45_000),
    vscodePath: vscodePath ? resolve(vscodePath) : '',
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

export const summarize = (values: readonly number[]): Summary => {
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

export const updateMarkdownManifest = (manifest: ExtensionManifest, enabled: boolean): ExtensionManifest => {
  const proposals = new Set(manifest.enabledApiProposals || [])
  if (enabled) {
    proposals.add(proposal)
  } else {
    proposals.delete(proposal)
  }
  return {
    ...manifest,
    enabledApiProposals: [...proposals],
  }
}

export const getMarkdownManifestPath = (executablePath: string): string => {
  return join(dirname(executablePath), 'resources', 'app', 'extensions', 'markdown-language-features', 'package.json')
}

const escapeXml = (value: string): string => {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

const createChart = (result: BenchmarkResult): string => {
  const width = 1100
  const height = 650
  const plot = { bottom: 475, left: 90, right: 1050, top: 70 }
  const allValues = [...result.legacy.samplesMs, ...result.singleIframe.samplesMs]
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
  const grid = Array.from({ length: 6 }, (_, index) => {
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
  const improvement = result.legacy.summary.median
    ? ((result.legacy.summary.median - result.singleIframe.summary.median) / result.legacy.summary.median) * 100
    : 0
  const comparison = improvement >= 0 ? `${round(improvement)}% faster` : `${round(Math.abs(improvement))}% slower`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">Cold Markdown preview click-to-ready time</title>
  <desc id="description">${result.runs} paired cold-profile samples using the same VS Code executable with only the Markdown extension proposal toggled.</desc>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <style>text { font: 14px system-ui, sans-serif; fill: #24292f; } .heading { font-size: 24px; font-weight: 600; } .summary { font-size: 16px; }</style>
  <text class="heading" x="${plot.left}" y="35">Cold Markdown preview click-to-ready time</text>
  ${grid}
  <line x1="${plot.left}" y1="${plot.top}" x2="${plot.left}" y2="${plot.bottom}" stroke="#57606a"/>
  <line x1="${plot.left}" y1="${plot.bottom}" x2="${plot.right}" y2="${plot.bottom}" stroke="#57606a"/>
  ${xLabels}
  <text x="${(plot.left + plot.right) / 2}" y="${plot.bottom + 58}" text-anchor="middle">Paired cold run</text>
  <text x="24" y="${(plot.top + plot.bottom) / 2}" text-anchor="middle" transform="rotate(-90 24 ${(plot.top + plot.bottom) / 2})">Load time (ms)</text>
  <path d="${path(result.legacy.samplesMs)}" fill="none" stroke="#0969da" stroke-width="2"/>
  ${points(result.legacy.samplesMs, '#0969da')}
  <path d="${path(result.singleIframe.samplesMs)}" fill="none" stroke="#cf5700" stroke-width="2"/>
  ${points(result.singleIframe.samplesMs, '#cf5700')}
  <circle cx="${plot.left}" cy="550" r="5" fill="#0969da"/><text x="${plot.left + 14}" y="555">${escapeXml(result.legacy.label)} — median ${result.legacy.summary.median} ms, mean ${result.legacy.summary.mean} ms</text>
  <circle cx="${plot.left}" cy="580" r="5" fill="#cf5700"/><text x="${plot.left + 14}" y="585">${escapeXml(result.singleIframe.label)} — median ${result.singleIframe.summary.median} ms, mean ${result.singleIframe.summary.mean} ms</text>
  <text class="summary" x="${plot.left}" y="620">Median result: single iframe is ${comparison}. No outliers removed.</text>
</svg>
`
}

const createResult = (
  options: Options,
  legacySamples: readonly number[],
  singleIframeSamples: readonly number[],
  runOrder: readonly Mode[],
  completed: boolean,
): BenchmarkResult => {
  return {
    cachePolicy:
      'Before every attempt: stop benchmark-owned VS Code processes and delete user data, Service Worker/Cache Storage, Chromium caches, runtime data, shared-process data, and user extensions',
    completed,
    generatedAt: new Date().toISOString(),
    legacy: {
      label: 'Markdown preview — legacy double iframe',
      samplesMs: legacySamples,
      summary: summarize(legacySamples),
    },
    measurement:
      'Page-object-worker wall clock immediately before selecting Markdown: Open Preview to the Side until .markdown-body is visible',
    runOrder,
    runs: options.runs,
    schemaVersion: 1,
    singleIframe: {
      label: 'Markdown preview — direct single iframe',
      samplesMs: singleIframeSamples,
      summary: summarize(singleIframeSamples),
    },
  }
}

const writeResults = async (options: Options, result: BenchmarkResult): Promise<void> => {
  await mkdir(options.outputDirectory, { recursive: true })
  await Promise.all([
    writeFile(join(options.outputDirectory, 'markdown-preview-load-time.json'), `${JSON.stringify(result, undefined, 2)}\n`),
    writeFile(join(options.outputDirectory, 'markdown-preview-load-time.svg'), createChart(result)),
  ])
}

const readPreviousSamples = async (options: Options): Promise<{ legacy: number[]; runOrder: Mode[]; singleIframe: number[] }> => {
  if (!options.resume) {
    return { legacy: [], runOrder: [], singleIframe: [] }
  }
  const resultPath = join(options.outputDirectory, 'markdown-preview-load-time.json')
  const previous = JSON.parse(await readFile(resultPath, 'utf8')) as BenchmarkResult
  if (previous.schemaVersion !== 1 || previous.runs !== options.runs) {
    throw new Error(`Cannot resume incompatible benchmark results at ${resultPath}`)
  }
  const isValidSample = (value: number): boolean => Number.isFinite(value) && value > 0
  const legacy = previous.legacy.samplesMs.filter(isValidSample).slice(0, options.runs)
  const singleIframe = previous.singleIframe.samplesMs.filter(isValidSample).slice(0, options.runs)
  const runOrder = previous.runOrder.slice(0, legacy.length + singleIframe.length)
  console.log(`Resuming with ${legacy.length} legacy and ${singleIframe.length} single-iframe samples`)
  return { legacy, runOrder, singleIframe }
}

const wait = async (milliseconds: number): Promise<void> => {
  await new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds))
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
  ])
}

const prepareColdLaunch = async (): Promise<void> => {
  await stopBenchmarkVscodeProcesses()
  await clearBenchmarkState()
}

const killProcessGroup = (processId: number | undefined, signal: NodeJS.Signals = 'SIGTERM'): void => {
  if (!processId) {
    return
  }
  try {
    process.kill(-processId, signal)
  } catch {
    // The process already exited.
  }
}

const setManifestMode = async (manifestPath: string, originalManifest: ExtensionManifest, mode: Mode): Promise<void> => {
  const manifest = updateMarkdownManifest(originalManifest, mode === 'singleIframe')
  await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`)
}

const runSample = async (options: Options, mode: Mode, executablePath: string): Promise<number> => {
  await prepareColdLaunch()
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
    executablePath,
    '--enable-extensions',
    '--clear-extensions',
    '--headless',
  ]
  const env = { ...process.env }
  delete env.VSCODE_SOURCE_PATH
  delete env.VSCODE_MEMORY_LEAK_FINDER_MARKDOWN_SINGLE_IFRAME
  if (mode === 'singleIframe') {
    env.VSCODE_MEMORY_LEAK_FINDER_MARKDOWN_SINGLE_IFRAME = '1'
  }

  return new Promise<number>((resolvePromise, rejectPromise) => {
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
      const matches = [...output.matchAll(measurementPattern)]
      const durationMs = Number.parseFloat(matches.at(-1)?.[1] || '')
      if (!Number.isFinite(durationMs) || durationMs <= 0) {
        rejectPromise(new Error(`No valid Markdown preview load-time marker found for ${mode}\n${output.slice(-4000)}`))
        return
      }
      resolvePromise(durationMs)
    })
  })
}

const runSampleWithRetries = async (
  options: Options,
  mode: Mode,
  executablePath: string,
  manifestPath: string,
  originalManifest: ExtensionManifest,
): Promise<number> => {
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    await setManifestMode(manifestPath, originalManifest, mode)
    try {
      return await runSample(options, mode, executablePath)
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
    console.log(`Usage: npm run measure-markdown-preview-load-time -- \\
  --vscode-path /path/to/vscode/source [options]

Options:
  --runs <count>             Paired successful samples per loader (default: 17)
  --output-directory <path>  JSON and SVG destination
  --timeout-ms <ms>          Per-attempt timeout (default: 45000)
  --max-attempts <count>     Attempts per successful sample (default: 5)
  --skip-build               Reuse the cached local minified build
  --resume                   Continue a compatible partial result file`)
    return
  }

  const options = parseArgv(process.argv.slice(2))
  await assertPath('--vscode-path', options.vscodePath)
  console.log(`Preparing minified local VS Code build from ${options.vscodePath}`)
  const executablePath = await ensureLocalVscodeBuild(options.vscodePath, options.skipBuild)
  const manifestPath = getMarkdownManifestPath(executablePath)
  const originalManifestContents = await readFile(manifestPath, 'utf8')
  const originalManifest = JSON.parse(originalManifestContents) as ExtensionManifest
  const previous = await readPreviousSamples(options)

  try {
    for (let index = 0; index < options.runs; index++) {
      const modes: readonly Mode[] = index % 2 === 0 ? ['legacy', 'singleIframe'] : ['singleIframe', 'legacy']
      for (const mode of modes) {
        const samples = mode === 'legacy' ? previous.legacy : previous.singleIframe
        if (samples.length > index) {
          continue
        }
        const sample = await runSampleWithRetries(options, mode, executablePath, manifestPath, originalManifest)
        samples.push(sample)
        previous.runOrder.push(mode)
        console.log(`[${mode}] ${samples.length}/${options.runs}: ${round(sample)} ms`)
        await writeResults(options, createResult(options, previous.legacy, previous.singleIframe, previous.runOrder, false))
      }
    }
  } finally {
    await writeFile(manifestPath, originalManifestContents)
    await stopBenchmarkVscodeProcesses()
    await clearBenchmarkState()
  }

  const result = createResult(options, previous.legacy, previous.singleIframe, previous.runOrder, true)
  await writeResults(options, result)
  const improvement = ((result.legacy.summary.median - result.singleIframe.summary.median) / result.legacy.summary.median) * 100
  console.log(`Median improvement: ${round(improvement)}%`)
  console.log(`Results: ${join(options.outputDirectory, 'markdown-preview-load-time.json')}`)
  console.log(`Chart: ${join(options.outputDirectory, 'markdown-preview-load-time.svg')}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main()
}
