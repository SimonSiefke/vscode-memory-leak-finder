import type { ChildProcess } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import type { Metric } from '../Types/Types.ts'
import type { Benchmark } from '../Types/Types.ts'
import { readFile } from 'node:fs/promises'
import { resolve, relative, sep } from 'node:path'
import { sourceHash } from '../CssPreset/CssPreset.ts'
import { prepareWorkspaceWatcher } from '../WorkspaceReadiness/WorkspaceReadiness.ts'
import { repositoryRoot } from '../Prepare/Prepare.ts'

// The monorepo runs TypeScript sources directly. Use the same URL-based package
// loading as the existing workers rather than compile another package's sources.
const load = (packageName: string, path: string) => import(new URL(`../../../../${packageName}/src/${path}`, import.meta.url).href)
const [endpoint, capture, perf, pss, profile, browser, context, stages, fixtures, imports, css] = await Promise.all([
  load('memory-leak-finder', 'parts/ConnectDevtoolsEndpoint/ConnectDevtoolsEndpoint.ts'),
  load('memory-leak-finder', 'parts/PerformanceCapture/PerformanceCapture.ts'),
  load('memory-leak-finder', 'parts/ControlledPerfStat/ControlledPerfStat.ts'),
  load('memory-leak-finder', 'parts/MeasureProcessTreePss/MeasureProcessTreePss.ts'),
  load('memory-leak-finder', 'parts/MeasureCpuProfile/MeasureCpuProfile.ts'),
  load('memory-leak-finder', 'parts/MeasureBrowserPerformanceCounters/MeasureBrowserPerformanceCounters.ts'),
  load('test-worker', 'parts/CreateTestContext/CreateTestContext.ts'),
  load('test-worker', 'parts/TestStage/TestStage.ts'),
  import(new URL('../../../../e2e/helpers/performanceFixtures.ts', import.meta.url).href),
  load('test-worker', 'parts/ImportTest/ImportTest.ts'),
  load('memory-leak-finder', 'parts/CssSelectorStats/CssSelectorStats.ts'),
])

export interface Session {
  invoke<T = any>(method: string, params?: object): Promise<T>
  dispose(): void | Promise<void>
}
export const connectTarget: (port: number, inspector?: boolean) => Promise<Session> = endpoint.connectTarget
export const evaluate: <T = any>(session: Session, expression: string) => Promise<T> = endpoint.evaluate
export const waitReady: (session: Session, workspace: boolean) => Promise<void> = endpoint.waitReady
export const prepareFixture: (workspace: string) => Promise<void> = fixtures.prepareFixture
export const { electronExpression, traceCategories } = capture
export const heapSnapshot: (session: Session, path: string) => Promise<Metric[]> = capture.heapSnapshot
export const stopTrace: (session: Session, path: string, startup: boolean) => Promise<Metric[]> = capture.stopTrace
export const profileMetrics: (profile: any, path: string) => Promise<Metric[]> = capture.profileMetrics
export const rendererMetrics: (before: { name: string; value: number }[], after: { name: string; value: number }[]) => Metric[] =
  capture.rendererMetrics
export const processTree: (root: number) => Promise<{ pid: number; identity: string }[]> = pss.processTree
export const hardwareEvents: string[] = perf.hardwareEvents
export const softwareEvents: string[] = perf.softwareEvents
export const probePerf: (events: string[]) => Promise<void> = perf.probePerf

export interface PerfSession {
  args(startDisabled?: boolean): string[]
  bind(child: ChildProcess): void
  attach(pids: number[]): Promise<void>
  toggle(value: 'enable' | 'disable'): Promise<void>
  freeze(): Promise<void>
  stop(): Promise<Metric[]>
  dispose(): Promise<void>
}
export const PerfSession: { create(directory: string, events: string[], probe?: boolean): Promise<PerfSession> } = perf.PerfSession
export interface ResourceSampler {
  samples: unknown[]
  diagnostics: string[]
  start(): Promise<void>
  stop(): Promise<Metric[]>
}
export const ResourceSampler: { new (root: number, excludeRoot?: boolean): ResourceSampler } = pss.ResourceSampler

interface RendererMeasure {
  start(session: Session): Promise<any>
  stop(session: Session): Promise<any>
  releaseResources(session: Session): Promise<void>
}
export const MeasureCpuProfile: RendererMeasure = profile
export const MeasureBrowserPerformanceCounters: RendererMeasure = browser

export interface Scenario {
  setup(): Promise<void>
  run(): Promise<void>
  dispose(): Promise<void>
}
export const createScenario = async (
  renderer: Session,
  main: Session,
  workspacePath: string,
  scenario: string,
  ideVersion: any,
  benchmark?: Benchmark,
  extensionsPath?: string,
): Promise<Scenario> => {
  const file = benchmark?.sourceFile
    ? resolve(repositoryRoot, benchmark.sourceFile)
    : fileURLToPath(new URL(`../../../../e2e/src/performance-${scenario}.ts`, import.meta.url))
  const local = relative(resolve(repositoryRoot, 'packages/e2e/src'), file)
  if (local.startsWith('..') || local.includes(sep) || !/\.(ts|js)$/.test(local)) throw new Error('Invalid frozen scenario path')
  if (benchmark?.sourceFile && (!benchmark.sourceSha256 || sourceHash(await readFile(file, 'utf8')) !== benchmark.sourceSha256))
    throw new Error(`Frozen scenario source changed: ${benchmark.sourceFile}`)
  const module = await imports.importTest(file)
  const test = await context.createTestContext({
    renderer,
    main,
    workspacePath,
    ideVersion,
    extensionsPath,
    // Per-selector instrumentation can block the renderer beyond the ordinary
    // five-second transport watchdog. Keep the native scheduler yield unchanged.
    ...(benchmark?.collector === 'css-selectors' ? { idleTransportTimeout: 30_000 } : {}),
  })
  const api = test.api
  return {
    setup: async () => {
      await prepareWorkspaceWatcher(api)
      await stages.beforeSetup(module, api)
      await stages.setup(module, api)
    },
    run: () => stages.run(module, api),
    dispose: async () => {
      try {
        await stages.teardown(module, api)
      } finally {
        test.dispose()
      }
    },
  }
}

export const { stopRecording, traceWindow } = capture
export const { getCssSelectorStats } = css
