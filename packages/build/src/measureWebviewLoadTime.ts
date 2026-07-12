import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn } from 'node:child_process'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const measurementPattern = /WEBVIEW_LOAD_TIME_MS=([0-9]+(?:\.[0-9]+)?)/g
const testName = 'webview-single-iframe-show'

interface Options {
  readonly legacyVscodePath: string
  readonly maxAttempts: number
  readonly outputDirectory: string
  readonly resume: boolean
  readonly runs: number
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
    readonly label: string
    readonly samplesMs: readonly number[]
    readonly summary: Summary
  }
  readonly measurement: string
  readonly runs: number
  readonly singleIframe: {
    readonly label: string
    readonly samplesMs: readonly number[]
    readonly summary: Summary
  }
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
    maxAttempts: getPositiveNumber('--max-attempts', 3),
    outputDirectory: resolve(getString('--output-directory', join(repositoryRoot, '.vscode-webview-load-time-results'))),
    resume: argv.includes('--resume'),
    runs: getPositiveNumber('--runs', 17),
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

const createChart = (result: BenchmarkResult): string => {
  const width = 1100
  const height = 680
  const plot = { bottom: 500, left: 90, right: 1050, top: 70 }
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
  const medianImprovement = result.legacy.summary.median
    ? ((result.legacy.summary.median - result.singleIframe.summary.median) / result.legacy.summary.median) * 100
    : 0
  const comparison = medianImprovement >= 0 ? `${round(medianImprovement)}% faster` : `${round(Math.abs(medianImprovement))}% slower`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">Cold webview load-time comparison</title>
  <desc id="description">${result.runs} cold-profile samples for legacy and single-iframe Electron webviews.</desc>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <style>text { font: 14px system-ui, sans-serif; fill: #24292f; } .heading { font-size: 24px; font-weight: 600; } .summary { font-size: 16px; }</style>
  <text class="heading" x="${plot.left}" y="35">Cold webview load time</text>
  ${gridLines}
  <line x1="${plot.left}" y1="${plot.top}" x2="${plot.left}" y2="${plot.bottom}" stroke="#57606a"/>
  <line x1="${plot.left}" y1="${plot.bottom}" x2="${plot.right}" y2="${plot.bottom}" stroke="#57606a"/>
  ${xLabels}
  <text x="${(plot.left + plot.right) / 2}" y="${plot.bottom + 58}" text-anchor="middle">Cold run</text>
  <text x="24" y="${(plot.top + plot.bottom) / 2}" text-anchor="middle" transform="rotate(-90 24 ${(plot.top + plot.bottom) / 2})">Load time (ms)</text>
  <path d="${path(result.legacy.samplesMs)}" fill="none" stroke="#0969da" stroke-width="2"/>
  ${points(result.legacy.samplesMs, '#0969da')}
  <path d="${path(result.singleIframe.samplesMs)}" fill="none" stroke="#cf5700" stroke-width="2"/>
  ${points(result.singleIframe.samplesMs, '#cf5700')}
  <circle cx="${plot.left}" cy="575" r="5" fill="#0969da"/><text x="${plot.left + 14}" y="580">${escapeXml(result.legacy.label)} — median ${result.legacy.summary.median} ms, mean ${result.legacy.summary.mean} ms</text>
  <circle cx="${plot.left}" cy="605" r="5" fill="#cf5700"/><text x="${plot.left + 14}" y="610">${escapeXml(result.singleIframe.label)} — median ${result.singleIframe.summary.median} ms, mean ${result.singleIframe.summary.mean} ms</text>
  <text class="summary" x="${plot.left}" y="645">Median result: single iframe is ${comparison}. All ${allValues.length} samples are shown; no outliers were removed.</text>
</svg>\n`
}

const createResult = (
  options: Options,
  legacySamples: readonly number[],
  singleIframeSamples: readonly number[],
  completed: boolean,
): BenchmarkResult => {
  return {
    cachePolicy: 'Delete the complete .vscode-user-data-dir before every launch attempt, including retries',
    completed,
    generatedAt: new Date().toISOString(),
    legacy: {
      label: 'VS Code 1.128.0 — legacy double iframe',
      samplesMs: legacySamples,
      summary: summarize(legacySamples),
    },
    measurement:
      'Extension-host performance.now() immediately before createWebviewPanel until CSS, image, script, VS Code API, and an extension-to-webview-to-extension message round trip are ready',
    runs: options.runs,
    singleIframe: {
      label: 'Local VS Code — single iframe',
      samplesMs: singleIframeSamples,
      summary: summarize(singleIframeSamples),
    },
  }
}

const writeResults = async (options: Options, result: BenchmarkResult): Promise<void> => {
  await mkdir(options.outputDirectory, { recursive: true })
  await Promise.all([
    writeFile(join(options.outputDirectory, 'webview-load-time.json'), `${JSON.stringify(result, undefined, 2)}\n`),
    writeFile(join(options.outputDirectory, 'webview-load-time.svg'), createChart(result)),
  ])
}

const readPreviousSamples = async (options: Options): Promise<{ legacy: number[]; singleIframe: number[] }> => {
  if (!options.resume) {
    return { legacy: [], singleIframe: [] }
  }
  const resultPath = join(options.outputDirectory, 'webview-load-time.json')
  const previous = JSON.parse(await readFile(resultPath, 'utf8')) as BenchmarkResult
  if (previous.runs !== options.runs) {
    throw new Error(`Cannot resume incompatible benchmark results at ${resultPath}`)
  }
  const isValidSample = (value: number): boolean => Number.isFinite(value) && value > 0
  const legacy = previous.legacy.samplesMs.filter(isValidSample).slice(0, options.runs)
  const singleIframe = previous.singleIframe.samplesMs.filter(isValidSample).slice(0, options.runs)
  console.log(`Resuming with ${legacy.length} legacy and ${singleIframe.length} single-iframe samples`)
  return { legacy, singleIframe }
}

const killProcessGroup = (pid: number | undefined): void => {
  if (!pid) {
    return
  }
  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    // The child already exited.
  }
}

const runSample = async (options: Options, mode: Mode): Promise<number> => {
  const userDataDirectory = join(repositoryRoot, '.vscode-user-data-dir')
  await rm(userDataDirectory, { force: true, recursive: true })

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
    env.VSCODE_SOURCE_PATH = options.singleIframeVscodePath
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
    const timeout = setTimeout(() => {
      killProcessGroup(child.pid)
      rejectPromise(new Error(`${mode} sample timed out after ${options.timeoutMs} ms\n${output.slice(-4000)}`))
    }, options.timeoutMs)
    child.on('error', (error) => {
      clearTimeout(timeout)
      rejectPromise(error)
    })
    child.on('exit', (code) => {
      clearTimeout(timeout)
      if (code !== 0) {
        rejectPromise(new Error(`${mode} sample failed with exit code ${code}\n${output.slice(-4000)}`))
        return
      }
      const matches = [...output.matchAll(measurementPattern)]
      const value = Number.parseFloat(matches.at(-1)?.[1] || '')
      if (!Number.isFinite(value) || value <= 0) {
        rejectPromise(new Error(`No valid webview load-time marker found for ${mode}\n${output.slice(-4000)}`))
        return
      }
      resolvePromise(value)
    })
  })
}

const runSampleWithRetries = async (options: Options, mode: Mode): Promise<number> => {
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await runSample(options, mode)
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
  --max-attempts <count>     Attempts per successful sample (default: 3)
  --resume                   Continue a compatible partial result file`)
    return
  }
  const options = parseArgv(process.argv.slice(2))
  await assertPath('--legacy-vscode-path', options.legacyVscodePath)
  await assertPath('--single-iframe-vscode-path', options.singleIframeVscodePath)
  const previous = await readPreviousSamples(options)
  const legacySamples = previous.legacy
  const singleIframeSamples = previous.singleIframe

  for (let index = 0; index < options.runs; index++) {
    const modes: readonly Mode[] = index % 2 === 0 ? ['legacy', 'singleIframe'] : ['singleIframe', 'legacy']
    for (const mode of modes) {
      const samples = mode === 'legacy' ? legacySamples : singleIframeSamples
      if (samples.length > index) {
        continue
      }
      const sample = await runSampleWithRetries(options, mode)
      samples.push(sample)
      console.log(`[${mode}] ${samples.length}/${options.runs}: ${round(sample)} ms`)
      await writeResults(options, createResult(options, legacySamples, singleIframeSamples, false))
    }
  }

  const result = createResult(options, legacySamples, singleIframeSamples, true)
  await writeResults(options, result)
  const improvement = ((result.legacy.summary.median - result.singleIframe.summary.median) / result.legacy.summary.median) * 100
  console.log(`Legacy median: ${result.legacy.summary.median} ms`)
  console.log(`Single-iframe median: ${result.singleIframe.summary.median} ms`)
  console.log(`Single-iframe median improvement: ${round(improvement)}%`)
  console.log(`Results: ${join(options.outputDirectory, 'webview-load-time.json')}`)
  console.log(`Chart: ${join(options.outputDirectory, 'webview-load-time.svg')}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main()
}
