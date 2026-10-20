import { mkdir, mkdtemp, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import { takeHeapSnapshot } from '../../memory-leak-finder/src/parts/HeapSnapshot/HeapSnapshot.ts'
import { launchHeapSnapshotWorker } from '../../memory-leak-finder/src/parts/LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import { create as createScriptHandler } from '../../memory-leak-finder/src/parts/ScriptHandler/ScriptHandler.ts'
import { measureHeapUsage } from './heapUsage.ts'
import { launch, stopChild } from './launch.ts'
import { prepare } from './prepare.ts'
import type { Scenario } from './types.ts'

const root = resolve(import.meta.dirname, '../../..')
const scenariosPath = resolve(import.meta.dirname, '../scenarios')

const positiveInteger = (value: string, name: string): number => {
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < 1) throw new Error(`${name} must be a positive integer`)
  return number
}

const main = async (): Promise<void> => {
  const { values } = parseArgs({
    options: {
      only: { type: 'string', default: 'window-open-close' },
      measure: { type: 'string', default: 'named-function-count3' },
      runs: { type: 'string', default: '5' },
      warmup: { type: 'string', default: '2' },
      'cache-dir': { type: 'string' },
      'results-dir': { type: 'string' },
      'check-leaks': { type: 'boolean', default: false },
      'no-sandbox': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  })
  if (values.help) {
    console.log(`Usage: npm run e2e:electron -- [options]
  --only <scenario>       Scenario filename from packages/electron-e2e/scenarios (default: window-open-close)
  --measure <measure>     named-function-count3 or heap-usage
  --runs <n>             Measured cycles (default: 5)
  --warmup <n>           Warmup cycles before baseline (default: 2)
  --cache-dir <path>     Override persistent Electron workspace cache
  --results-dir <path>   Override results directory
  --check-leaks          Exit with code 1 when growing functions are found
  --no-sandbox           Pass --no-sandbox to Electron`)
    return
  }
  if (values.measure !== 'named-function-count3' && values.measure !== 'heap-usage') {
    throw new Error(`Unsupported Electron measure: ${values.measure}`)
  }
  const runs = positiveInteger(values.runs, '--runs')
  const warmup = positiveInteger(values.warmup, '--warmup')
  const scenarios = (await readdir(scenariosPath)).filter((name) => name.endsWith('.ts')).map((name) => name.slice(0, -3))
  if (!scenarios.includes(values.only)) throw new Error(`Unknown scenario: ${values.only}. Available: ${scenarios.join(', ')}`)
  const scenario: Scenario = await import(pathToFileURL(join(scenariosPath, `${values.only}.ts`)).href)
  const workspace = await prepare(values['cache-dir'] ? resolve(values['cache-dir']) : undefined)
  const resultsDir = values['results-dir']
    ? resolve(values['results-dir'])
    : join(root, '.vscode-memory-leak-finder-results/electron-main', values.measure)
  await mkdir(resultsDir, { recursive: true })
  const artifactsPath = await mkdtemp(join(resultsDir, `${values.only}-`))
  const app = await launch(workspace, join(artifactsPath, 'user-data'), values['no-sandbox'])
  let shutdown: Promise<void> | undefined
  const stop = (): Promise<void> => {
    if (!shutdown) {
      app.rpc.dispose()
      shutdown = stopChild(app.child)
    }
    return shutdown
  }
  const onInterrupt = () => {
    process.exitCode = 130
    void stop().catch(console.error)
  }
  const onTerminate = () => {
    process.exitCode = 143
    void stop().catch(console.error)
  }
  process.once('SIGINT', onInterrupt)
  process.once('SIGTERM', onTerminate)
  const context = { evaluate: app.evaluate, pid: app.identity.pid }
  const scriptHandler = createScriptHandler()
  try {
    console.log(`Measuring Electron ${app.identity.electron} main process (pid ${context.pid})`)
    if (values.measure === 'named-function-count3') await scriptHandler.start(app.rpc)
    try {
      await scenario.setup?.(context)
      for (let i = 0; i < warmup; i++) await scenario.run(context)
      let measurement: Record<string, unknown>
      let suspectedLeak = false
      if (values.measure === 'heap-usage') {
        const result = await measureHeapUsage(app.rpc, runs, () => scenario.run(context))
        measurement = result
        console.log(`Post-GC heap usage delta: ${result.heapUsage.delta} bytes`)
      } else {
        const beforePath = join(artifactsPath, 'before.heapsnapshot')
        const afterPath = join(artifactsPath, 'after.heapsnapshot')
        await app.rpc.invoke('HeapProfiler.collectGarbage')
        await takeHeapSnapshot(app.rpc, beforePath)
        for (let i = 0; i < runs; i++) await scenario.run(context)
        await app.rpc.invoke('HeapProfiler.collectGarbage')
        await takeHeapSnapshot(app.rpc, afterPath)
        const scriptMap = scriptHandler.scriptMap
        await writeFile(join(artifactsPath, 'script-map.json'), JSON.stringify(scriptMap, null, 2) + '\n')
        await using worker = await launchHeapSnapshotWorker()
        // Same comparison as named-function-count3, scoped to this app's scripts.
        const functions = await worker.invoke('HeapSnapshot.compareFunctions2', beforePath, afterPath, { minCount: runs, scriptMap })
        console.log(`${functions.length} growing function locations`)
        measurement = { namedFunctionCount3: functions }
        suspectedLeak = functions.length > 0
      }
      const result = {
        scenario: values.only,
        measure: values.measure,
        process: 'electron-main',
        pid: context.pid,
        electronVersion: app.identity.electron,
        runs,
        warmup,
        workspace,
        artifactsPath,
        ...measurement,
      }
      const json = JSON.stringify(result, null, 2) + '\n'
      await writeFile(join(artifactsPath, 'result.json'), json)
      const resultPath = join(resultsDir, `${values.only}.json`)
      await writeFile(resultPath, json)
      console.log(`Results: ${resultPath}`)
      if (values['check-leaks'] && suspectedLeak) process.exitCode = 1
    } finally {
      await scenario.teardown?.(context)
    }
  } finally {
    process.off('SIGINT', onInterrupt)
    process.off('SIGTERM', onTerminate)
    await stop()
  }
}

try {
  await main()
} catch (error) {
  console.error(error)
  process.exitCode ||= 1
}
