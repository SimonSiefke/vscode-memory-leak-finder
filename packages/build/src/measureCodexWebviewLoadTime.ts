import { access, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn, type ChildProcess } from 'node:child_process'
import { ensureLocalVscodeBuild } from './measureLocalVscodeComparison.ts'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const measurementPattern = /CODEX_WEBVIEW_LOAD_TIME_MS=([0-9]+(?:\.[0-9]+)?)/g
const extensionId = 'openai.chatgpt'

type Mode = 'legacy' | 'singleIframe'

interface Options {
  readonly legacyVscodePath: string
  readonly maxAttempts: number
  readonly outputDirectory: string
  readonly runs: number
  readonly singleIframeVscodePath: string
  readonly skipBuild: boolean
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

const parseArgv = (argv: readonly string[]): Options => {
  const getString = (name: string, defaultValue = ''): string => {
    const index = argv.lastIndexOf(name)
    return index === -1 ? defaultValue : (argv[index + 1] ?? defaultValue)
  }
  const getNumber = (name: string, defaultValue: number): number => {
    const value = Number.parseInt(getString(name, String(defaultValue)), 10)
    return Number.isFinite(value) && value > 0 ? value : defaultValue
  }
  return {
    legacyVscodePath: getString('--legacy-vscode-path'),
    maxAttempts: getNumber('--max-attempts', 10),
    outputDirectory: resolve(getString('--output-directory', join(repositoryRoot, '.vscode-codex-webview-load-time-results'))),
    runs: getNumber('--runs', 17),
    singleIframeVscodePath: getString('--single-iframe-vscode-path'),
    skipBuild: argv.includes('--skip-build'),
    timeoutMs: getNumber('--timeout-ms', 90_000),
  }
}

const assertPath = async (name: string, path: string): Promise<void> => {
  if (!path) {
    throw new Error(`${name} is required`)
  }
  await access(path)
}

const round = (value: number): number => Math.round(value * 1000) / 1000

const summarize = (samples: readonly number[]): Summary => {
  if (samples.length === 0) {
    return { max: 0, mean: 0, median: 0, min: 0, p95: 0, standardDeviation: 0 }
  }
  const sorted = [...samples].sort((a, b) => a - b)
  const mean = samples.reduce((total, value) => total + value, 0) / samples.length
  const middle = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
  const variance = samples.reduce((total, value) => total + (value - mean) ** 2, 0) / samples.length
  return {
    max: round(sorted.at(-1)!),
    mean: round(mean),
    median: round(median),
    min: round(sorted[0]),
    p95: round(sorted[Math.ceil(sorted.length * 0.95) - 1]),
    standardDeviation: round(Math.sqrt(variance)),
  }
}

const escapeXml = (value: string): string => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const createChart = (legacy: readonly number[], singleIframe: readonly number[]): string => {
  const width = 1040
  const height = 640
  const left = 80
  const right = 30
  const top = 65
  const bottom = 145
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const maxValue = Math.max(...legacy, ...singleIframe, 1)
  const yMax = Math.ceil((maxValue * 1.1) / 250) * 250
  const x = (index: number): number => left + (index * plotWidth) / Math.max(legacy.length - 1, 1)
  const y = (value: number): number => top + plotHeight - (value / yMax) * plotHeight
  const polyline = (samples: readonly number[]): string => samples.map((value, index) => `${x(index)},${y(value)}`).join(' ')
  const circles = (samples: readonly number[], color: string): string =>
    samples.map((value, index) => `<circle cx="${x(index)}" cy="${y(value)}" r="4" fill="${color}"/>`).join('')
  const legacySummary = summarize(legacy)
  const singleSummary = summarize(singleIframe)
  const improvement = ((legacySummary.median - singleSummary.median) / legacySummary.median) * 100
  const grid = Array.from({ length: 6 }, (_, index) => {
    const value = (yMax * index) / 5
    const position = y(value)
    return `<line x1="${left}" y1="${position}" x2="${width - right}" y2="${position}" stroke="#d8dee9"/><text x="${left - 12}" y="${position + 5}" text-anchor="end">${round(value)}</text>`
  }).join('')
  const labels = legacy
    .map((_, index) => `<text x="${x(index)}" y="${top + plotHeight + 28}" text-anchor="middle">${index + 1}</text>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="#fff"/><g font-family="sans-serif" fill="#2e3440"><text x="${left}" y="38" font-size="24" font-weight="600">Cold Codex webview click-to-load time</text>${grid}${labels}
<line x1="${left}" y1="${top}" x2="${left}" y2="${top + plotHeight}" stroke="#6b7280"/><line x1="${left}" y1="${top + plotHeight}" x2="${width - right}" y2="${top + plotHeight}" stroke="#6b7280"/>
<polyline points="${polyline(legacy)}" fill="none" stroke="#0969da" stroke-width="2"/>${circles(legacy, '#0969da')}
<polyline points="${polyline(singleIframe)}" fill="none" stroke="#cf5c00" stroke-width="2"/>${circles(singleIframe, '#cf5c00')}
<text x="${left}" y="${height - 82}" font-size="14" fill="#0969da">VS Code 1.128.0 — legacy double iframe — median ${legacySummary.median} ms</text>
<text x="${left}" y="${height - 55}" font-size="14" fill="#cf5c00">Local minified VS Code — single iframe — median ${singleSummary.median} ms</text>
<text x="${left}" y="${height - 25}" font-size="14">${escapeXml(`Median result: single iframe is ${round(Math.abs(improvement))}% ${improvement >= 0 ? 'faster' : 'slower'}.`)}</text>
</g></svg>\n`
}

const runCommand = async (command: string, args: readonly string[], env: NodeJS.ProcessEnv): Promise<void> => {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { cwd: repositoryRoot, env, stdio: 'inherit' })
    child.on('error', rejectPromise)
    child.on('exit', (code) => (code === 0 ? resolvePromise() : rejectPromise(new Error(`${command} exited with ${code}`))))
  })
}

const findCodexExtension = async (extensionsDirectory: string): Promise<string> => {
  const entries = await readdir(extensionsDirectory, { withFileTypes: true })
  const candidates = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${extensionId}-`))
    .map((entry) => join(extensionsDirectory, entry.name))
  for (const candidate of candidates.sort().reverse()) {
    try {
      await access(join(candidate, 'package.json'))
      await access(join(candidate, 'bin', 'linux-x86_64', 'codex'))
      return candidate
    } catch {
      // Try the next installed version.
    }
  }
  return ''
}

const prepareCodexExtension = async (legacyVscodePath: string): Promise<string> => {
  const cacheDirectory = join(repositoryRoot, '.vscode-test', 'codex-webview-benchmark')
  const extensionsDirectory = join(cacheDirectory, 'extensions')
  await mkdir(extensionsDirectory, { recursive: true })
  const cached = await findCodexExtension(extensionsDirectory)
  if (cached) {
    return cached
  }
  const cliPath = join(dirname(legacyVscodePath), 'bin', 'code')
  await access(cliPath)
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  delete env.VSCODE_GIT_IPC_HANDLE
  delete env.VSCODE_IPC_HOOK_CLI
  await runCommand(
    cliPath,
    [
      '--user-data-dir',
      join(cacheDirectory, 'user-data'),
      '--extensions-dir',
      extensionsDirectory,
      '--install-extension',
      extensionId,
      '--force',
    ],
    env,
  )
  const installed = await findCodexExtension(extensionsDirectory)
  if (!installed) {
    throw new Error(`Installed ${extensionId} does not contain the linux-x64 Codex binary`)
  }
  return installed
}

const benchmarkStatePaths = [
  join(repositoryRoot, '.vscode-user-data-dir'),
  join(repositoryRoot, '.vscode-runtime-dir'),
  join(repositoryRoot, '.vscode-shared-data-dir'),
]
const benchmarkProcessMarkers = [...benchmarkStatePaths, 'codex-webview-show']

const getBenchmarkProcessIds = async (): Promise<readonly number[]> => {
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
        if (benchmarkProcessMarkers.some((marker) => commandLine.includes(marker))) {
          processIds.push(processId)
        }
      } catch {
        // The process exited while it was inspected.
      }
    }),
  )
  return processIds
}

const wait = async (milliseconds: number): Promise<void> => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds))

const stopBenchmarkProcesses = async (): Promise<void> => {
  let processIds = await getBenchmarkProcessIds()
  for (const processId of processIds) {
    try {
      process.kill(processId, 'SIGTERM')
    } catch {}
  }
  for (let attempt = 0; attempt < 50 && processIds.length > 0; attempt++) {
    await wait(100)
    processIds = await getBenchmarkProcessIds()
  }
  for (const processId of processIds) {
    try {
      process.kill(processId, 'SIGKILL')
    } catch {}
  }
}

const clearBenchmarkState = async (): Promise<void> => {
  await Promise.all([
    ...benchmarkStatePaths.map((path) => rm(path, { force: true, recursive: true })),
    rm(join(repositoryRoot, '.vscode-extensions'), { force: true, recursive: true }),
  ])
}

const prepareColdLaunch = async (): Promise<void> => {
  await stopBenchmarkProcesses()
  await clearBenchmarkState()
  if ((await getBenchmarkProcessIds()).length > 0) {
    throw new Error('A benchmark VS Code process is still running')
  }
}

const stopProcess = (child: ChildProcess, signal: NodeJS.Signals = 'SIGTERM'): void => {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) {
    return
  }
  try {
    process.kill(child.pid, signal)
  } catch {}
}

const runSample = async (options: Options, mode: Mode, singleIframeExecutablePath: string, codexExtensionPath: string): Promise<number> => {
  await prepareColdLaunch()
  const launcherPath = join(repositoryRoot, 'scripts', 'run-vscode-codex-webview-e2e.sh')
  const args = [
    '-a',
    '-s',
    '-screen 0 1600x1000x24 -nolisten tcp',
    process.execPath,
    'packages/cli/bin/test.js',
    '--run-skipped-tests-anyway',
    '--only',
    'codex-webview-show',
    '--vscode-path',
    launcherPath,
    '--enable-extensions',
    '--clear-extensions',
    '--headless',
  ]
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    VSCODE_CODEX_EXTENSION_PATH: codexExtensionPath,
    VSCODE_EXECUTABLE_PATH: mode === 'legacy' ? options.legacyVscodePath : singleIframeExecutablePath,
    VSCODE_PATH: launcherPath,
  }
  delete env.VSCODE_MEMORY_LEAK_FINDER_WEBVIEW_NO_SERVICE_WORKER
  delete env.VSCODE_SOURCE_PATH
  if (mode === 'singleIframe') {
    env.VSCODE_MEMORY_LEAK_FINDER_WEBVIEW_NO_SERVICE_WORKER = '1'
  }
  return new Promise<number>((resolvePromise, rejectPromise) => {
    const child = spawn('xvfb-run', args, { cwd: repositoryRoot, env, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => (output += chunk))
    child.stderr.on('data', (chunk: string) => (output += chunk))
    const timeout = setTimeout(() => {
      stopProcess(child)
      setTimeout(() => stopProcess(child, 'SIGKILL'), 5000)
    }, options.timeoutMs)
    child.on('error', (error) => {
      clearTimeout(timeout)
      rejectPromise(error)
    })
    child.on('exit', async (code) => {
      clearTimeout(timeout)
      await stopBenchmarkProcesses()
      await clearBenchmarkState()
      const matches = [...output.matchAll(measurementPattern)]
      const duration = Number.parseFloat(matches.at(-1)?.[1] || '')
      if (code !== 0 || !Number.isFinite(duration) || duration <= 0) {
        rejectPromise(new Error(`${mode} sample failed with exit code ${code}\n${output.slice(-5000)}`))
        return
      }
      resolvePromise(duration)
    })
  })
}

const runSampleWithRetries = async (
  options: Options,
  mode: Mode,
  singleIframeExecutablePath: string,
  codexExtensionPath: string,
): Promise<number> => {
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await runSample(options, mode, singleIframeExecutablePath, codexExtensionPath)
    } catch (error) {
      if (attempt === options.maxAttempts) {
        throw error
      }
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`[${mode}] attempt ${attempt}/${options.maxAttempts} failed; retrying with a fresh profile\n${message}`)
    }
  }
  throw new Error(`Unable to run ${mode} sample`)
}

export const main = async (): Promise<void> => {
  const options = parseArgv(process.argv.slice(2))
  await assertPath('--legacy-vscode-path', options.legacyVscodePath)
  await assertPath('--single-iframe-vscode-path', options.singleIframeVscodePath)
  const codexExtensionPath = await prepareCodexExtension(options.legacyVscodePath)
  const codexManifest = JSON.parse(await readFile(join(codexExtensionPath, 'package.json'), 'utf8'))
  console.log(`Using ${extensionId} ${codexManifest.version} from ${codexExtensionPath}`)
  const singleIframeExecutablePath = await ensureLocalVscodeBuild(options.singleIframeVscodePath, options.skipBuild)
  const samples: Record<Mode, number[]> = { legacy: [], singleIframe: [] }
  for (const mode of ['legacy', 'singleIframe'] as const) {
    for (let index = 0; index < options.runs; index++) {
      const sample = await runSampleWithRetries(options, mode, singleIframeExecutablePath, codexExtensionPath)
      samples[mode].push(sample)
      console.log(`[${mode}] ${index + 1}/${options.runs}: ${round(sample)} ms`)
    }
  }
  const result = {
    cachePolicy:
      'Before and after every attempt: stop benchmark-owned VS Code processes and delete user data, Service Worker/Cache Storage, Chromium caches, runtime data, shared-process data, and the per-run extensions directory',
    codexExtension: { id: extensionId, version: codexManifest.version },
    generatedAt: new Date().toISOString(),
    legacy: { label: 'VS Code 1.128.0 — legacy double iframe', samplesMs: samples.legacy, summary: summarize(samples.legacy) },
    measurement:
      'Page-object-worker timestamp immediately before the Codex Quick Pick command click until the Codex inner document reports #root and a completed Navigation Timing load event',
    runOrder: ['legacy', 'singleIframe'],
    runs: options.runs,
    singleIframe: {
      label: 'Local minified VS Code — single iframe',
      samplesMs: samples.singleIframe,
      summary: summarize(samples.singleIframe),
    },
  }
  await mkdir(options.outputDirectory, { recursive: true })
  await Promise.all([
    writeFile(join(options.outputDirectory, 'codex-webview-load-time.json'), `${JSON.stringify(result, undefined, 2)}\n`),
    writeFile(join(options.outputDirectory, 'codex-webview-load-time.svg'), createChart(samples.legacy, samples.singleIframe)),
  ])
  const improvement = ((result.legacy.summary.median - result.singleIframe.summary.median) / result.legacy.summary.median) * 100
  console.log(`Median improvement: ${round(improvement)}%`)
  console.log(`Results: ${join(options.outputDirectory, 'codex-webview-load-time.json')}`)
  console.log(`Chart: ${join(options.outputDirectory, 'codex-webview-load-time.svg')}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main()
}
