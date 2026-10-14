import { spawn, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import { access, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { hostname, release, cpus } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import {
  connectTarget,
  evaluate,
  waitReady,
  createScenario,
  prepareFixture,
  type Session,
  type Scenario,
  electronExpression,
  heapSnapshot,
  profileMetrics,
  rendererMetrics,
  stopTrace,
  traceCategories,
  hardwareEvents,
  PerfSession,
  softwareEvents,
  processTree,
  ResourceSampler,
  MeasureCpuProfile,
  MeasureBrowserPerformanceCounters,
} from '../Shared/Shared.ts'
import { compressEvidence } from '../Compression/Compression.ts'
import { command, errorMessage, writeJson } from '../Io/Io.ts'
import { sampleCount, sampleOrder } from '../Manifest/Manifest.ts'
import { UnavailableError, type Benchmark, type Metric, type Result, type Revision, type Sample } from '../Types/Types.ts'

export interface RunOptions {
  benchmark: Benchmark
  paths: Record<Revision, string>
  commits: Record<Revision, string>
  samples: number
  output: string
  budgetMs?: number
  injectFailure?: string
}

const freePort = async (): Promise<number> => {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Cannot allocate DevTools port')
  await new Promise<void>((resolve) => server.close(() => resolve()))
  return address.port
}

const profileCacheFiles = async (profile: string): Promise<string[]> => {
  const files: string[] = []
  const walk = async (path: string, prefix = ''): Promise<void> => {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const name = prefix + entry.name
      if (entry.isDirectory()) await walk(join(path, entry.name), `${name}/`)
      else if (entry.isFile() && /Cache|CachedData|storage|state\.vscdb/i.test(name)) files.push(name)
    }
  }
  await walk(profile)
  return files.sort()
}

export const clearColdCaches = async (): Promise<void> => {
  try {
    await command('sudo', ['-n', 'sh', '-c', 'sync && echo 3 > /proc/sys/vm/drop_caches'], { timeout: 15000 })
  } catch (error) {
    throw new UnavailableError(`Cannot clear Linux filesystem caches; cold startup is unavailable: ${errorMessage(error)}`)
  }
}

export const prepareProfile = async (profile: string): Promise<void> => {
  await rm(profile, { recursive: true, force: true })
  await mkdir(join(profile, 'User'), { recursive: true })
  await writeJson(join(profile, 'User', 'settings.json'), {
    'telemetry.telemetryLevel': 'off',
    'update.mode': 'none',
    'extensions.autoUpdate': false,
    'workbench.startupEditor': 'none',
    'workbench.enableExperiments': false,
    'window.restoreWindows': 'none',
    'editor.minimap.enabled': false,
    'editor.smoothScrolling': false,
    'terminal.integrated.accessibleViewFocusOnCommandExecution': false,
    'editor.accessibilitySupport': 'on',
    'terminal.integrated.defaultProfile.linux': 'bash',
    'terminal.integrated.profiles.linux': {
      bash: { path: '/bin/bash', args: ['--noprofile', '--norc'], env: { PS1: '$ ', PROMPT_COMMAND: '', BASH_ENV: null } },
    },
    'terminal.integrated.shellIntegration.enabled': false,
    'security.workspace.trust.enabled': false,
    'files.hotExit': 'off',
    'git.openRepositoryInParentFolders': 'never',
  })
}

interface Application {
  child: ChildProcess
  renderer: Session
  main: () => Promise<Session>
  started: number
  ready: number
  dispose: () => Promise<void>
}

const launch = async (
  executable: string,
  profile: string,
  workspace: string,
  benchmark: Benchmark,
  directory: string,
  perf?: PerfSession,
  hooks: { onSpawn?: (child: ChildProcess) => Promise<void>; onReady?: (renderer: Session) => Promise<void> } = {},
): Promise<Application> => {
  const [rendererPort, mainPort] = await Promise.all([freePort(), freePort()])
  const args = [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-updates',
    '--disable-telemetry',
    '--skip-welcome',
    '--skip-release-notes',
    '--disable-workspace-trust',
    '--force-disable-user-env',
    '--password-store=basic',
    '--disable-background-networking',
    '--disable-component-update',
    '--ozone-platform=x11',
    '--new-window',
    '--locale=en',
    `--user-data-dir=${profile}`,
    `--shared-data-dir=${join(profile, 'shared')}`,
    `--extensions-dir=${join(directory, 'extensions')}`,
    `--remote-debugging-port=${rendererPort}`,
    `--inspect=${mainPort}`,
    ...(benchmark.startup && benchmark.collector === 'timeline'
      ? ['--trace', `--trace-category-filter=${traceCategories}`, '--trace-options=record-until-full']
      : []),
    ...(benchmark.startup && benchmark.scenario === 'empty' ? [] : [workspace]),
    ...(benchmark.startup && benchmark.scenario === 'workspace' ? [join(workspace, 'small.txt')] : []),
  ]
  // No filesystem access to the application occurs between dropping caches and spawning it.
  if (benchmark.cache === 'cold') await clearColdCaches()
  const started = performance.now()
  const child = spawn(perf ? 'perf' : executable, perf ? [...perf.args(), '--', executable, ...args] : args, {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ELECTRON_RUN_AS_NODE: undefined, NODE_OPTIONS: undefined, NODE_DISABLE_COMPILE_CACHE: undefined },
    cwd: directory,
  })
  if (perf) perf.bind(child)
  let log = ''
  let spawnError: Error | undefined
  child.on('error', (error) => {
    spawnError = error
  })
  const append = (data: Buffer): void => {
    log = (log + data.toString()).slice(-4 * 1024 * 1024)
  }
  child.stdout?.on('data', append)
  child.stderr?.on('data', append)
  let renderer: Session | undefined
  let mainConnection: Session | undefined
  const main = async (): Promise<Session> => (mainConnection ??= await connectTarget(mainPort, true))
  let disposePromise: Promise<void> | undefined
  const finish = async (): Promise<void> => {
    const pids = child.pid ? await processTree(child.pid).catch(() => []) : []
    if (child.exitCode === null && child.signalCode === null) {
      try {
        await evaluate(await main(), electronExpression('electron.app.quit()'))
      } catch {}
    }
    // Node's inspector otherwise keeps shutdown waiting for the debugger to disconnect.
    await mainConnection?.dispose()
    if (child.exitCode === null && child.signalCode === null)
      await Promise.race([new Promise<void>((resolve) => child.once('close', () => resolve())), delay(3000)])
    for (const entry of pids.reverse()) {
      try {
        const stat = await readFile(`/proc/${entry.pid}/stat`, 'utf8')
        const fields = stat
          .slice(stat.lastIndexOf(')') + 2)
          .trim()
          .split(/\s+/)
        if (`${entry.pid}:${fields[19]}` !== entry.identity) continue
        process.kill(entry.pid, 'SIGKILL')
      } catch {}
    }
    if (child.pid && child.exitCode === null && child.signalCode === null) {
      try {
        process.kill(-child.pid, 'SIGKILL')
      } catch {}
    }
    await renderer?.dispose()
    await writeFile(join(directory, 'application.log'), log)
  }
  const dispose = (): Promise<void> => (disposePromise ??= finish())
  try {
    await hooks.onSpawn?.(child)
    renderer = await connectTarget(rendererPort)
    await waitReady(renderer, benchmark.startup && benchmark.scenario === 'workspace')
    if (spawnError) throw spawnError
    const ready = performance.now()
    await hooks.onReady?.(renderer)
    return { child, renderer, main, started, ready, dispose }
  } catch (error) {
    await dispose()
    throw error
  }
}

export const measureSample = async (options: RunOptions, pair: number, revision: Revision, order: number): Promise<Sample> => {
  const { benchmark } = options
  const directory = resolve(options.output, 'raw', `${pair}-${revision}`)
  const profile = join(directory, 'profile')
  const workspace = join(directory, 'workspace')
  await mkdir(directory, { recursive: true })
  const sample: Sample = { pair, revision, order, status: 'success', metrics: [], diagnostics: [], raw: [], elapsedMs: 0 }
  const started = performance.now()
  let app: Application | undefined
  let scenario: Scenario | undefined
  let activeRendererMeasure: typeof MeasureCpuProfile | undefined
  let perf: PerfSession | undefined
  let resources: ResourceSampler | undefined
  let resourceMetrics: Metric[] = []
  try {
    if (options.injectFailure === `${benchmark.id}:${revision}:${pair}`) throw new Error('Injected collector failure')
    await prepareFixture(workspace)
    await prepareProfile(profile)
    if (benchmark.cache === 'warm') {
      const primeDirectory = join(directory, 'prime')
      await mkdir(primeDirectory, { recursive: true })
      const prime = await launch(options.paths[revision], profile, workspace, { ...benchmark, collector: 'timing' }, primeDirectory)
      await prime.dispose()
      sample.raw.push(`raw/${pair}-${revision}/prime/application.log`)
    }
    await writeJson(join(directory, 'cache-policy.json'), {
      cache: benchmark.cache,
      profilePrimed: benchmark.cache === 'warm',
      profileCacheFilesBeforeMeasuredLaunch: await profileCacheFiles(profile),
      osCachePolicy: benchmark.cache === 'cold' ? 'sync and drop_caches=3 immediately before spawn' : 'preserved',
      extensions: 'disabled',
    })
    if (benchmark.collector === 'instructions' || benchmark.collector === 'resources') {
      try {
        perf = await PerfSession.create(directory, benchmark.collector === 'instructions' ? hardwareEvents : softwareEvents)
      } catch (error) {
        if (benchmark.collector === 'instructions') throw error
        sample.diagnostics.push(errorMessage(error))
        sample.status = 'partial'
      }
    }
    app = await launch(
      options.paths[revision],
      profile,
      workspace,
      benchmark,
      directory,
      benchmark.startup ? perf : undefined,
      benchmark.startup
        ? {
            onSpawn: async (child) => {
              if (benchmark.collector === 'resources') {
                resources = new ResourceSampler(child.pid!, !!perf)
                await resources.start()
              }
            },
            onReady: async (renderer) => {
              if (benchmark.collector === 'timeline') await evaluate(renderer, `console.timeStamp('large-end')`)
              await perf?.freeze()
              if (resources) resourceMetrics = await resources.stop()
            },
          }
        : {},
    )
    const { renderer } = app
    // Readiness is the startup boundary. Subsequent collector finalization is outside timing results.
    if (benchmark.startup && benchmark.collector === 'timing')
      sample.metrics.push({
        name: 'startupTime',
        unit: 'ms',
        value: app.ready - app.started,
        coverage: 'spawn to visible workbench (and rendered text for workspace startup); includes automation polling',
      })
    if (!benchmark.startup) {
      const version = JSON.parse(await readFile(join(resolve(options.paths[revision], '..'), 'resources/app/package.json'), 'utf8')).version
      const [major, minor, patch] = version.split('.').map(Number)
      scenario = await createScenario(renderer, await app.main(), workspace, benchmark.scenario, { major, minor, patch })
      await scenario.setup()
    }
    let before: Metric[] = []
    let browserBefore: { name: string; value: number }[] = []
    if (benchmark.collector === 'resources' && !benchmark.startup) {
      resources = new ResourceSampler(app.child.pid!, benchmark.startup && !!perf)
      await resources.start()
    }
    if (!benchmark.startup && perf) await perf.attach((await processTree(app.child.pid!)).map((entry) => entry.pid))
    if (benchmark.collector === 'renderer') {
      activeRendererMeasure = MeasureBrowserPerformanceCounters
      browserBefore = (await activeRendererMeasure.start(renderer)).metrics
    }
    if (benchmark.collector === 'timeline') {
      if (!benchmark.startup) {
        await evaluate(
          await app.main(),
          electronExpression(
            `await electron.contentTracing.startRecording({categoryFilter: ${JSON.stringify(traceCategories)}, traceOptions: 'record-until-full'})`,
          ),
        )
        await evaluate(renderer, `console.timeStamp('large-start')`)
      }
    }
    if (benchmark.collector === 'profile') {
      activeRendererMeasure = MeasureCpuProfile
      await activeRendererMeasure.start(renderer)
    }
    if (benchmark.collector === 'memory' && !benchmark.startup) {
      before = await heapSnapshot(renderer, join(directory, 'before.heapsnapshot'))
      await compressEvidence(join(directory, 'before.heapsnapshot'))
      sample.raw.push(`raw/${pair}-${revision}/before.heapsnapshot.gz`)
    }
    if (!benchmark.startup) {
      const actionStart = performance.now()
      await scenario!.run()
      if (benchmark.collector === 'timing')
        sample.metrics.push({
          name: 'actionTime',
          unit: 'ms',
          value: performance.now() - actionStart,
          coverage: 'input dispatch to asserted visible completion; includes automation polling',
        })
    }
    if (!benchmark.startup) {
      await perf?.freeze()
      if (resources) resourceMetrics = await resources.stop()
    }
    if (perf) {
      // A launch-wrapping perf process waits for Electron to exit before writing its final totals.
      // Counters were already disabled at readiness, so graceful shutdown is outside their window.
      if (benchmark.startup) await app.dispose()
      try {
        sample.metrics.push(...(await perf.stop()))
      } catch (error) {
        if (benchmark.collector !== 'resources') throw error
        sample.diagnostics.push(errorMessage(error))
        sample.status = 'partial'
      }
      sample.raw.push(`raw/${pair}-${revision}/perf.csv`)
    }
    if (resources) {
      sample.metrics.push(...resourceMetrics)
      sample.diagnostics.push(...resources.diagnostics)
      if (resources.diagnostics.length && sample.status === 'success') sample.status = 'partial'
      await writeJson(join(directory, 'resources.json'), {
        intervalMs: 250,
        samples: resources.samples,
        diagnostics: resources.diagnostics,
      })
      sample.raw.push(`raw/${pair}-${revision}/resources.json`)
    }
    if (benchmark.collector === 'renderer') {
      const browserAfter = (await MeasureBrowserPerformanceCounters.stop(renderer)).metrics
      sample.metrics.push(...rendererMetrics(browserBefore, browserAfter))
      await writeJson(join(directory, 'renderer.json'), { before: browserBefore, after: browserAfter })
      sample.raw.push(`raw/${pair}-${revision}/renderer.json`)
    }
    if (benchmark.collector === 'timeline') {
      if (!benchmark.startup) await evaluate(renderer, `console.timeStamp('large-end')`)
      // VS Code's --trace hook starts recording before it creates the workbench renderer.
      sample.metrics.push(...(await stopTrace(await app.main(), join(directory, 'trace.json'), benchmark.startup)))
      await compressEvidence(join(directory, 'trace.json'))
      sample.raw.push(`raw/${pair}-${revision}/trace.json.gz`)
    }
    if (benchmark.collector === 'profile') {
      const cpuProfile = await MeasureCpuProfile.stop(renderer)
      sample.metrics.push(...(await profileMetrics(cpuProfile, join(directory, 'renderer.cpuprofile'))))
      sample.raw.push(`raw/${pair}-${revision}/renderer.cpuprofile`, `raw/${pair}-${revision}/renderer-functions.json`)
    }
    if (benchmark.collector === 'memory') {
      const after = await heapSnapshot(renderer, join(directory, 'after.heapsnapshot'))
      await compressEvidence(join(directory, 'after.heapsnapshot'))
      sample.metrics.push(...after.map((metric) => ({ ...metric, name: `final${metric.name[0]!.toUpperCase()}${metric.name.slice(1)}` })))
      sample.metrics.push(
        ...before.map((metric) => ({
          ...metric,
          name: `delta${metric.name[0]!.toUpperCase()}${metric.name.slice(1)}`,
          value: after.find((entry) => entry.name === metric.name)!.value - metric.value,
        })),
      )
      sample.raw.push(`raw/${pair}-${revision}/after.heapsnapshot.gz`)
    }
    if (!sample.metrics.length) throw new UnavailableError('Collector produced no usable metrics')
  } catch (error) {
    sample.status = error instanceof UnavailableError ? 'unavailable' : 'failed'
    sample.diagnostics.push(errorMessage(error))
    if (app) {
      try {
        await writeJson(
          join(directory, 'failure-state.json'),
          await evaluate(
            app.renderer,
            `({ text: document.body.innerText.slice(0, 30000), activeElement: document.activeElement?.outerHTML, tabs: [...document.querySelectorAll('.tab')].map(e => e.outerHTML) })`,
          ),
        )
      } catch {}
    }
  } finally {
    try {
      if (perf && app) await perf.freeze()
      await resources?.stop()
    } catch (error) {
      sample.diagnostics.push(`Collector boundary cleanup: ${errorMessage(error)}`)
    }
    try {
      if (activeRendererMeasure && app) await activeRendererMeasure.releaseResources(app.renderer)
    } catch (error) {
      sample.diagnostics.push(`Renderer collector cleanup: ${errorMessage(error)}`)
      sample.status = 'failed'
    }
    try {
      await scenario?.dispose()
    } catch (error) {
      sample.diagnostics.push(`Scenario cleanup: ${errorMessage(error)}`)
      sample.status = 'failed'
    }
    try {
      await app?.dispose()
    } catch (error) {
      sample.diagnostics.push(`Application cleanup: ${errorMessage(error)}`)
      sample.status = 'failed'
    }
    try {
      await perf?.dispose()
    } catch (error) {
      sample.diagnostics.push(`perf cleanup: ${errorMessage(error)}`)
      sample.status = 'failed'
    }
    try {
      await access(join(directory, 'application.log'))
    } catch {
      await writeFile(join(directory, 'application.log'), 'Application was not launched; see sample diagnostics.\n')
    }
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (!entry.isFile()) continue
      let name = entry.name
      if (name.endsWith('.heapsnapshot') || name === 'trace.json') {
        try {
          await compressEvidence(join(directory, name))
          name += '.gz'
        } catch (error) {
          sample.diagnostics.push(`Evidence compression: ${errorMessage(error)}`)
        }
      }
      const path = `raw/${pair}-${revision}/${name}`
      if (!sample.raw.includes(path)) sample.raw.push(path)
    }
    // Keep measurement evidence, not large profiles/workspaces that contain no measurement results.
    await rm(profile, { recursive: true, force: true })
    await rm(workspace, { recursive: true, force: true })
    sample.raw.push(`raw/${pair}-${revision}/application.log`)
    sample.elapsedMs = performance.now() - started
  }
  return sample
}

export const runBenchmark = async (options: RunOptions, measure = measureSample): Promise<Result> => {
  const count = sampleCount(options.benchmark, options.samples)
  const result: Result = {
    schemaVersion: 1,
    benchmark: options.benchmark,
    commits: options.commits,
    requestedSamples: count,
    status: 'missing',
    runner: {
      hostname: hostname(),
      kernel: release(),
      cpu: cpus()[0]?.model ?? 'unknown',
      node: process.version,
      runnerImage: process.env.ImageVersion ?? '',
      display: process.env.DISPLAY ?? '',
    },
    samples: [],
    diagnostics: [],
  }
  const outputPath = join(options.output, 'result.json')
  await writeJson(outputPath, result)
  const deadline = Date.now() + (options.budgetMs ?? 5 * 60 * 60 * 1000)
  for (let pair = 0; pair < count; pair++) {
    for (const [order, revision] of sampleOrder(pair).entries()) {
      if (Date.now() >= deadline) {
        result.diagnostics.push('Measurement time budget exhausted; remaining samples are missing')
        result.status = result.samples.some((sample) => sample.metrics.length) ? 'partial' : 'failed'
        await writeJson(outputPath, result)
        return result
      }
      let sample: Sample
      try {
        sample = await measure(options, pair, revision, order)
      } catch (error) {
        sample = { pair, revision, order, status: 'failed', metrics: [], raw: [], diagnostics: [errorMessage(error)], elapsedMs: 0 }
      }
      result.samples.push(sample)
      const valid = result.samples.filter((entry) => entry.status === 'success' || entry.status === 'partial')
      result.status =
        result.samples.length === count * 2 && result.samples.every((entry) => entry.status === 'success')
          ? 'success'
          : valid.length
            ? 'partial'
            : result.samples.every((entry) => entry.status === 'unavailable')
              ? 'unavailable'
              : 'failed'
      await writeJson(outputPath, result)
      console.log(
        `${options.benchmark.id} ${revision} sample ${pair + 1}/${count}: ${sample.status}${sample.diagnostics.length ? ` (${sample.diagnostics.map((message) => message.split('\n')[0]).join('; ')})` : ''}`,
      )
    }
  }
  return result
}
