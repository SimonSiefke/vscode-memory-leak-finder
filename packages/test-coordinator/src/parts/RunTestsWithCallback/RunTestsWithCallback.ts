import type { Rpc } from '@lvce-editor/rpc'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { RunTestsWithCallbackOptions } from '../RunTestsOptions/RunTestsOptions.ts'
import type { RunTestsResult } from '../RunTestsResult/RunTestsResult.ts'
import { runMemoryCityComparisons } from '../RunMemoryCityComparisons/RunMemoryCityComparisons.ts'
import * as Assert from '../Assert/Assert.ts'
import * as BrowserPageTargets from '../BrowserPageTargets/BrowserPageTargets.ts'
import { doLogin } from '../DoLogin/DoLogin.ts'
import { emptyRpc } from '../EmptyRpc/EmptyRpc.ts'
import * as GetPageObjectPath from '../GetPageObjectPath/GetPageObjectPath.ts'
import * as GetPrettyError from '../GetPrettyError/GetPrettyError.ts'
import * as GetProxyTestFolderName from '../GetProxyTestFolderName/GetProxyTestFolderName.ts'
import * as GetTestToRun from '../GetTestToRun/GetTestsToRun.ts'
import * as Id from '../Id/Id.ts'
import * as Ide from '../Ide/Ide.ts'
import * as MemoryLeakFinder from '../MemoryLeakFinder/MemoryLeakFinder.ts'
import * as MemoryLeakWorker from '../MemoryLeakWorker/MemoryLeakWorker.ts'
import * as MemoryLeakResultsPath from '../MemoryLeakResultsPath/MemoryLeakResultsPath.ts'
import * as PrepareTestsOrAttach from '../PrepareTestsOrAttach/PrepareTestsOrAttach.ts'
import * as PrepareTrackedVscode from '../PrepareTrackedVscode/PrepareTrackedVscode.ts'
import * as SetupOnly from '../SetupOnly/SetupOnly.ts'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.ts'
import * as TestWorkerRunTests from '../TestWorkerRunTests/TestWorkerRunTests.ts'
import * as TestWorkerSetupTest from '../TestWorkerSetupTest/TestWorkerSetupTest.ts'
import * as TestWorkerTeardownTest from '../TestWorkerTeardownTest/TestWorkerTearDownTest.ts'
import * as Time from '../Time/Time.ts'
import * as Timeout from '../Timeout/Timeout.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'
import * as VideoRecording from '../VideoRecording/VideoRecording.ts'

interface WorkerMap {
  devtoolsWebSocketUrl: string
  readonly functionTrackerRpc: Rpc
  readonly initializationWorkerRpc: Rpc
  memoryRpc: Rpc
  pid: number
  readonly testWorkerRpc: Rpc
  readonly videoRpc: Rpc
  webSocketUrl: string
}

const disposeWorkers = async (workers: WorkerMap): Promise<void> => {
  const { functionTrackerRpc, initializationWorkerRpc, memoryRpc, testWorkerRpc, videoRpc } = workers
  await Promise.all([functionTrackerRpc.dispose(), memoryRpc.dispose(), testWorkerRpc.dispose(), videoRpc.dispose()])
  await initializationWorkerRpc.dispose()
}

const getProcessResultFolder = (inspectProcess: string): string => {
  return inspectProcess.replaceAll('/', '-').replaceAll('\\', '-')
}

const StartupCounterMeasureId = 'cpu-performance-counters-from-start'
const StartupCounterMeasureResultId = 'cpuPerformanceCountersFromStart'

const isStartupCounterMeasure = (measure: string): boolean => {
  return measure === StartupCounterMeasureId || measure === StartupCounterMeasureResultId
}

const isMemoryCityMeasure = (measure: string): boolean => {
  return measure === 'memory-city' || measure === 'memoryCity'
}

const round = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

const getMedian = (values: readonly number[]): number => {
  const middle = Math.floor(values.length / 2)
  if (values.length % 2 === 1) {
    return values[middle]
  }
  return (values[middle - 1] + values[middle]) / 2
}

interface AggregateMetric {
  readonly count: number
  readonly max: number
  readonly mean: number
  readonly median: number
  readonly min: number
  readonly name: string
  readonly unit: string
}

const getAggregateMetric = (samples: readonly any[], name: string, unit: string) => {
  const values = samples
    .map((sample) => sample[name])
    .filter((value) => typeof value === 'number' && Number.isFinite(value))
    .sort((a, b) => a - b)
  if (values.length === 0) {
    return undefined
  }
  const total = values.reduce((sum, value) => sum + value, 0)
  return {
    count: values.length,
    max: round(values[values.length - 1]),
    mean: round(total / values.length),
    median: round(getMedian(values)),
    min: round(values[0]),
    name,
    unit,
  }
}

const isAggregateMetric = (metric: AggregateMetric | undefined): metric is AggregateMetric => {
  return metric !== undefined
}

const getStartupCounterAggregate = (samples: readonly any[]) => {
  const metrics = [
    getAggregateMetric(samples, 'instructions', 'count'),
    getAggregateMetric(samples, 'cycles', 'count'),
    getAggregateMetric(samples, 'instructionsPerCycle', 'ratio'),
  ].filter(isAggregateMetric)
  const lines = ['CPU performance counters from start:', 'metric | count | median | mean | min | max | unit']
  for (const metric of metrics) {
    lines.push(`${metric.name} | ${metric.count} | ${metric.median} | ${metric.mean} | ${metric.min} | ${metric.max} | ${metric.unit}`)
  }
  return {
    [StartupCounterMeasureResultId]: {
      isLeak: false,
      metrics,
      samples,
    },
    isLeak: false,
    samples,
    summary: metrics.length === 0 ? 'No CPU performance counters from start were available' : lines.join('\n'),
  }
}

const readJson = async (path: string): Promise<any> => {
  const content = await readFile(path, 'utf8')
  return JSON.parse(content)
}

const writeJson = async (path: string, value: any): Promise<void> => {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(value, null, 2) + '\n')
}

const getResultPath = ({
  dirent,
  inspectExtensions,
  inspectIntegratedBrowser,
  inspectProcess,
  inspectPtyHost,
  inspectSharedProcess,
  measure,
  measureNode,
}: {
  readonly dirent: string
  readonly inspectExtensions: boolean
  readonly inspectIntegratedBrowser: boolean
  readonly inspectProcess: string
  readonly inspectPtyHost: boolean
  readonly inspectSharedProcess: boolean
  readonly measure: string
  readonly measureNode: boolean
}): string => {
  const fileName = dirent.replace('.js', '.json').replace('.ts', '.json')
  const testName = fileName.replace('.json', '')
  if (isMemoryCityMeasure(measure)) {
    return join(MemoryLeakResultsPath.memoryLeakResultsPath, 'memory-city', fileName)
  }
  if (measureNode) {
    return join(MemoryLeakResultsPath.memoryLeakResultsPath, 'node', measure, testName + '.json')
  }
  if (inspectSharedProcess) {
    return join(MemoryLeakResultsPath.memoryLeakResultsPath, 'shared-process', measure, fileName)
  }
  if (inspectExtensions) {
    return join(MemoryLeakResultsPath.memoryLeakResultsPath, 'extension-host', measure, fileName)
  }
  if (inspectPtyHost) {
    return join(MemoryLeakResultsPath.memoryLeakResultsPath, 'pty-host', measure, fileName)
  }
  if (inspectIntegratedBrowser) {
    return join(MemoryLeakResultsPath.memoryLeakResultsPath, 'integrated-browser', measure, fileName)
  }
  if (inspectProcess) {
    return join(MemoryLeakResultsPath.memoryLeakResultsPath, 'process', getProcessResultFolder(inspectProcess), measure, fileName)
  }
  return join(MemoryLeakResultsPath.memoryLeakResultsPath, measure, fileName)
}

export const runTestsWithCallback = async ({
  allowCopilotAuthInCi,
  arch,
  buildVscodeMinified,
  callback,
  checkLeaks,
  clearExtensions,
  color,
  commit,
  compressVideo,
  continueValue,
  cwd,
  downloadUserDataZipFileToken,
  downloadUserDataZipFileUrl,
  enableExtensions,
  enableProxy,
  filterValue,
  getTimeStamp,
  headlessMode,
  ide,
  ideVersion,
  insidersCommit,
  inspectExtensions,
  inspectExtensionsPort,
  inspectIntegratedBrowser,
  inspectProcess = '',
  inspectPtyHost,
  inspectPtyHostPort,
  inspectSharedProcess,
  inspectSharedProcessPort,
  isGithubActions,
  login,
  measure,
  measureAfter,
  measureNode,
  openDevtools,
  pageObjectPath,
  platform,
  recordVideo,
  restartBetween,
  root,
  runMode,
  runNetworkTestsAnyway,
  runs,
  runSkippedTestsAnyway,
  screencastQuality,
  setupOnly,
  startupRuns,
  timeoutBetween,
  timeouts,
  trackFunctions,
  updateUrl,
  useProxyMock,
  vscodePath,
  vscodeVersion,
}: RunTestsWithCallbackOptions): Promise<RunTestsResult> => {
  try {
    Assert.string(root)
    Assert.string(cwd)
    Assert.string(filterValue)
    Assert.boolean(headlessMode)
    Assert.boolean(buildVscodeMinified)
    Assert.boolean(color)
    Assert.boolean(checkLeaks)
    Assert.boolean(recordVideo)
    Assert.number(runs)
    Assert.string(measure)
    Assert.boolean(measureAfter)
    Assert.boolean(measureNode)
    Assert.boolean(inspectIntegratedBrowser)
    Assert.string(inspectProcess)
    Assert.boolean(timeouts)
    Assert.number(timeoutBetween)
    Assert.number(runMode)
    Assert.boolean(restartBetween)
    Assert.string(ide)
    Assert.string(ideVersion)
    Assert.boolean(setupOnly)
    Assert.boolean(login)
    Assert.boolean(enableExtensions)
    Assert.number(startupRuns)

    const connectionId = Id.create()
    const attachedToPageTimeout = TimeoutConstants.AttachToPage
    const idleTimeout = TimeoutConstants.Idle
    const pageObjectPathResolved = GetPageObjectPath.getPageObjectPath(pageObjectPath)

    // TODO for each connection id, launch all needed workers
    // when a new connection id comes in, dispose them (even while running)
    // Then recreate the workers, ensuring a clean state

    if (setupOnly && commit) {
      await SetupOnly.setupOnly({
        arch,
        buildVscodeMinified,
        clearExtensions,
        commit,
        cwd,
        downloadUserDataZipFileToken,
        downloadUserDataZipFileUrl,
        enableExtensions,
        enableProxy,
        ide,
        insidersCommit,
        inspectExtensions,
        inspectExtensionsPort,
        inspectPtyHost,
        inspectPtyHostPort,
        inspectSharedProcess,
        inspectSharedProcessPort,
        platform,
        updateUrl,
        useProxyMock,
        vscodePath,
        vscodeVersion,
      })
      return {
        duration: 0,
        failed: 0,
        filterValue,
        leaked: 0,
        passed: 0,
        skipped: 0,
        skippedFailed: 0,
        total: 0,
        type: 'success',
      }
    }

    if (login) {
      return await doLogin({
        arch,
        attachedToPageTimeout,
        buildVscodeMinified,
        clearExtensions,
        commit,
        compressVideo,
        connectionId,
        cwd,
        downloadUserDataZipFileToken,
        downloadUserDataZipFileUrl,
        enableExtensions,
        enableProxy,
        filterValue,
        headlessMode,
        ide,
        ideVersion,
        idleTimeout,
        insidersCommit,
        inspectExtensions,
        inspectExtensionsPort,
        inspectIntegratedBrowser,
        inspectProcess,
        inspectPtyHost,
        inspectPtyHostPort,
        inspectSharedProcess,
        inspectSharedProcessPort,
        measure,
        measureNode,
        openDevtools,
        pageObjectPathResolved,
        platform,
        proxyTestFolderName: '',
        recordVideo,
        runMode,
        screencastQuality,
        timeouts,
        trackFunctions,
        updateUrl,
        useProxyMock,
        vscodePath,
        vscodeVersion,
      })
    }

    let passed = 0
    let failed = 0
    let skipped = 0
    let skippedFailed = 0
    let leaking = 0
    const formattedPaths = await GetTestToRun.getTestsToRun(root, cwd, filterValue, continueValue)
    const total = formattedPaths.length
    if (total === 0) {
      return {
        duration: 0,
        failed,
        filterValue,
        leaked: leaking,
        passed,
        skipped,
        skippedFailed: 0,
        total,
        type: 'success',
      }
    }
    const initialStart = Time.now()
    const first = formattedPaths[0]
    await callback(TestWorkerEventType.HandleInitializing)

    const preparedVscodePath =
      trackFunctions && ide === Ide.VsCode
        ? await PrepareTrackedVscode.prepareTrackedVscode({
            arch,
            buildVscodeMinified,
            commit,
            insidersCommit,
            measureId: measure,
            platform,
            updateUrl,
            vscodePath,
            vscodeVersion,
          })
        : ''

    const context = {
      runs,
    }

    const intializeEnd = getTimeStamp()
    const intializeTime = intializeEnd - initialStart

    await callback(TestWorkerEventType.HandleInitialized, intializeTime)

    const testStart = getTimeStamp()
    await callback(TestWorkerEventType.TestsStarting, total)
    await callback(TestWorkerEventType.TestRunning, first.absolutePath, first.relativeDirname, first.dirent, /* isFirst */ true)

    let workers: WorkerMap = {
      devtoolsWebSocketUrl: '',
      functionTrackerRpc: emptyRpc,
      initializationWorkerRpc: emptyRpc,
      memoryRpc: emptyRpc,
      pid: 0,
      testWorkerRpc: emptyRpc,
      videoRpc: emptyRpc,
      webSocketUrl: '',
    }

    if (isStartupCounterMeasure(measure) && startupRuns > 1) {
      for (let i = 0; i < formattedPaths.length; i++) {
        const formattedPath = formattedPaths[i]
        const { absolutePath, dirent, relativeDirname, relativePath } = formattedPath
        const proxyTestFolderName = GetProxyTestFolderName.getProxyTestFolderName(absolutePath)
        const forceRun = runSkippedTestsAnyway || dirent === `${filterValue}.js`
        const start = i === 0 ? initialStart : Time.now()
        if (i !== 0) {
          await callback(TestWorkerEventType.TestRunning, absolutePath, relativeDirname, dirent, /* isFirst */ true)
        }
        let wasOriginallySkipped = false
        try {
          const samples: any[] = []
          for (let startupRun = 0; startupRun < startupRuns; startupRun++) {
            await disposeWorkers(workers)
            workers = {
              devtoolsWebSocketUrl: '',
              functionTrackerRpc: emptyRpc,
              initializationWorkerRpc: emptyRpc,
              memoryRpc: emptyRpc,
              pid: 0,
              testWorkerRpc: emptyRpc,
              videoRpc: emptyRpc,
              webSocketUrl: '',
            }
            PrepareTestsOrAttach.state.promise = undefined
            const sampleConnectionId = connectionId
            const prepared = await PrepareTestsOrAttach.prepareTestsAndAttach({
              arch,
              attachedToPageTimeout,
              buildVscodeMinified,
              clearExtensions,
              commit,
              compressVideo,
              connectionId: sampleConnectionId,
              cwd,
              downloadUserDataZipFileToken,
              downloadUserDataZipFileUrl,
              enableExtensions,
              enableProxy,
              headlessMode,
              ide,
              ideVersion,
              idleTimeout,
              insidersCommit,
              inspectExtensions,
              inspectExtensionsPort,
              inspectIntegratedBrowser,
              inspectProcess,
              inspectPtyHost,
              inspectPtyHostPort,
              inspectSharedProcess,
              inspectSharedProcessPort,
              measureId: measure,
              measureNode,
              openDevtools,
              pageObjectPath: pageObjectPathResolved,
              platform,
              preparedVscodePath,
              proxyTestFolderName,
              recordVideo,
              runMode,
              screencastQuality,
              timeouts,
              trackFunctions,
              updateUrl,
              useProxyMock,
              vscodePath,
              vscodeVersion,
            })
            workers = {
              devtoolsWebSocketUrl: prepared.devtoolsWebSocketUrl,
              functionTrackerRpc: prepared.functionTrackerRpc || emptyRpc,
              initializationWorkerRpc: prepared.initializationWorkerRpc || emptyRpc,
              memoryRpc: prepared.memoryRpc || emptyRpc,
              pid: prepared.pid,
              testWorkerRpc: prepared.testWorkerRpc || emptyRpc,
              videoRpc: prepared.videoRpc || emptyRpc,
              webSocketUrl: prepared.webSocketUrl,
            }
            if (enableProxy) {
              await workers.initializationWorkerRpc.invoke('Launch.setProxyTestFolderName', proxyTestFolderName)
            }
            const testResult = await TestWorkerSetupTest.testWorkerSetupTest(
              workers.testWorkerRpc,
              sampleConnectionId,
              absolutePath,
              forceRun,
              timeouts,
              isGithubActions,
              allowCopilotAuthInCi,
              runNetworkTestsAnyway,
            )
            if (testResult.error) {
              throw testResult.error
            }
            if (testResult.skipped) {
              wasOriginallySkipped = testResult.wasOriginallySkipped
              continue
            }
            wasOriginallySkipped = testResult.wasOriginallySkipped
            await MemoryLeakFinder.start(workers.memoryRpc, sampleConnectionId)
            await TestWorkerRunTests.testWorkerRunTests(
              workers.testWorkerRpc,
              sampleConnectionId,
              absolutePath,
              forceRun,
              runMode,
              platform,
              runs,
              () => MemoryLeakFinder.runCompletion(workers.memoryRpc, sampleConnectionId),
            )
            if (timeoutBetween) {
              await Timeout.setTimeout(timeoutBetween)
            }
            await MemoryLeakFinder.stop(workers.memoryRpc, sampleConnectionId)
            const resultPath = getResultPath({
              dirent,
              inspectExtensions,
              inspectIntegratedBrowser,
              inspectProcess,
              inspectPtyHost,
              inspectSharedProcess,
              measure,
              measureNode,
            })
            const sampleResultPath = resultPath.replace(/\.json$/, `.startup-${startupRun + 1}.json`)
            await MemoryLeakFinder.compare(
              workers.memoryRpc,
              sampleConnectionId,
              {
                runs,
                startupRun: startupRun + 1,
                startupRuns,
              },
              sampleResultPath,
            )
            const sampleResult = await readJson(sampleResultPath)
            samples.push(sampleResult[StartupCounterMeasureResultId] ?? sampleResult)
            await TestWorkerTeardownTest.testWorkerTearDownTest(workers.testWorkerRpc, sampleConnectionId, absolutePath)
          }
          const resultPath = getResultPath({
            dirent,
            inspectExtensions,
            inspectIntegratedBrowser,
            inspectProcess,
            inspectPtyHost,
            inspectSharedProcess,
            measure,
            measureNode,
          })
          const aggregateResult = getStartupCounterAggregate(samples)
          await writeJson(resultPath, aggregateResult)
          console.log(aggregateResult.summary)
          const end = Time.now()
          const duration = end - start
          await callback(TestWorkerEventType.TestPassed, absolutePath, relativeDirname, dirent, duration, false, wasOriginallySkipped)
          passed++
        } catch (error) {
          if (wasOriginallySkipped) {
            skippedFailed++
          } else {
            failed++
          }
          const prettyError = await GetPrettyError.getPrettyError(error, color, root)
          await callback(
            TestWorkerEventType.TestFailed,
            absolutePath,
            relativeDirname,
            relativePath,
            dirent,
            prettyError,
            wasOriginallySkipped,
          )
        }
      }
      const end = Time.now()
      const duration = end - testStart
      await disposeWorkers(workers)
      return {
        duration,
        failed,
        filterValue,
        leaked: leaking,
        passed,
        skipped,
        skippedFailed,
        total,
        type: 'success',
      }
    }

    for (let i = 0; i < formattedPaths.length; i++) {
      const formattedPath = formattedPaths[i]
      const { absolutePath, dirent, relativeDirname, relativePath } = formattedPath
      const proxyTestFolderName = GetProxyTestFolderName.getProxyTestFolderName(absolutePath)
      const forceRun = runSkippedTestsAnyway || dirent === `${filterValue}.js`

      const needsSetup = i === 0 || restartBetween

      if (needsSetup) {
        await disposeWorkers(workers)
        PrepareTestsOrAttach.state.promise = undefined
        const { devtoolsWebSocketUrl, functionTrackerRpc, initializationWorkerRpc, memoryRpc, pid, testWorkerRpc, videoRpc, webSocketUrl } =
          await PrepareTestsOrAttach.prepareTestsAndAttach({
            arch,
            attachedToPageTimeout,
            buildVscodeMinified,
            clearExtensions,
            commit,
            compressVideo,
            connectionId,
            cwd,
            downloadUserDataZipFileToken,
            downloadUserDataZipFileUrl,
            enableExtensions,
            enableProxy,
            headlessMode,
            ide,
            ideVersion,
            idleTimeout,
            insidersCommit,
            inspectExtensions,
            inspectExtensionsPort,
            inspectIntegratedBrowser,
            inspectProcess,
            inspectPtyHost,
            inspectPtyHostPort,
            inspectSharedProcess,
            inspectSharedProcessPort,
            measureId: measure,
            measureNode,
            openDevtools,
            pageObjectPath: pageObjectPathResolved,
            platform,
            preparedVscodePath,
            proxyTestFolderName,
            recordVideo,
            runMode,
            screencastQuality,
            timeouts,
            trackFunctions,
            updateUrl,
            useProxyMock,
            vscodePath,
            vscodeVersion,
          })
        workers = {
          devtoolsWebSocketUrl,
          functionTrackerRpc: functionTrackerRpc || emptyRpc,
          initializationWorkerRpc: initializationWorkerRpc || emptyRpc,
          memoryRpc: memoryRpc || emptyRpc,
          pid,
          testWorkerRpc: testWorkerRpc || emptyRpc,
          videoRpc: videoRpc || emptyRpc,
          webSocketUrl,
        }
      }

      if (enableProxy) {
        await workers.initializationWorkerRpc.invoke('Launch.setProxyTestFolderName', proxyTestFolderName)
      }

      const { testWorkerRpc, videoRpc } = workers

      let wasOriginallySkipped = false
      if (i !== 0) {
        await callback(TestWorkerEventType.TestRunning, absolutePath, relativeDirname, dirent, /* isFirst */ true)
      }

      try {
        const start = i === 0 ? initialStart : Time.now()
        if ((inspectIntegratedBrowser || inspectProcess) && workers.memoryRpc !== emptyRpc) {
          await workers.memoryRpc.dispose()
          workers.memoryRpc = emptyRpc
        }
        const integratedBrowserExcludedTargetIds =
          checkLeaks && inspectIntegratedBrowser ? await BrowserPageTargets.getBrowserPageTargetIds(workers.devtoolsWebSocketUrl) : []
        const testResult = await TestWorkerSetupTest.testWorkerSetupTest(
          testWorkerRpc,
          connectionId,
          absolutePath,
          forceRun,
          timeouts,
          isGithubActions,
          allowCopilotAuthInCi,
          runNetworkTestsAnyway,
        )
        const testSkipped = testResult.skipped
        wasOriginallySkipped = testResult.wasOriginallySkipped

        // Check if setup failed and we have error information
        if (testResult.error) {
          throw testResult.error
        }

        if (recordVideo) {
          await VideoRecording.addChapter(videoRpc, dirent, start)
        }

        if (testSkipped) {
          skipped++
          const end = Time.now()
          const duration = end - start
          await callback(TestWorkerEventType.TestSkipped, absolutePath, relativeDirname, dirent, duration)
        } else {
          let isLeak = false
          if (checkLeaks) {
            if (measureAfter) {
              await TestWorkerRunTests.testWorkerRunTests(testWorkerRpc, connectionId, absolutePath, forceRun, runMode, platform, 2)
            }
            if (inspectIntegratedBrowser || inspectProcess) {
              if (inspectProcess) {
                workers.memoryRpc = await MemoryLeakWorker.startWorker(
                  workers.devtoolsWebSocketUrl,
                  workers.webSocketUrl,
                  connectionId,
                  measure,
                  attachedToPageTimeout,
                  measureNode,
                  inspectSharedProcess,
                  inspectExtensions,
                  inspectIntegratedBrowser,
                  inspectPtyHost,
                  inspectPtyHostPort,
                  inspectSharedProcessPort,
                  inspectExtensionsPort,
                  workers.pid,
                  integratedBrowserExcludedTargetIds,
                  inspectProcess,
                  testWorkerRpc,
                )
              } else {
                workers.memoryRpc = await MemoryLeakWorker.startWorker(
                  workers.devtoolsWebSocketUrl,
                  workers.webSocketUrl,
                  connectionId,
                  measure,
                  attachedToPageTimeout,
                  measureNode,
                  inspectSharedProcess,
                  inspectExtensions,
                  inspectIntegratedBrowser,
                  inspectPtyHost,
                  inspectPtyHostPort,
                  inspectSharedProcessPort,
                  inspectExtensionsPort,
                  workers.pid,
                  integratedBrowserExcludedTargetIds,
                )
              }
            }
            const resultPath = getResultPath({
              dirent,
              inspectExtensions,
              inspectIntegratedBrowser,
              inspectProcess,
              inspectPtyHost,
              inspectSharedProcess,
              measure,
              measureNode,
            })
            let result
            if (isMemoryCityMeasure(measure)) {
              const extensionHostRpc = workers.memoryRpc
              const rendererRpc = await MemoryLeakWorker.startWorker(
                workers.devtoolsWebSocketUrl,
                workers.webSocketUrl,
                connectionId,
                measure,
                attachedToPageTimeout,
                false,
                false,
                false,
                false,
                false,
                inspectPtyHostPort,
                inspectSharedProcessPort,
                inspectExtensionsPort,
                workers.pid,
                integratedBrowserExcludedTargetIds,
              )
              const rendererResultPath = `${resultPath}.renderer.tmp`
              const extensionHostResultPath = `${resultPath}.extension-host.tmp`
              try {
                await Promise.all([
                  MemoryLeakFinder.start(rendererRpc, connectionId),
                  MemoryLeakFinder.start(extensionHostRpc, connectionId),
                ])
                await TestWorkerRunTests.testWorkerRunTests(
                  testWorkerRpc,
                  connectionId,
                  absolutePath,
                  forceRun,
                  runMode,
                  platform,
                  runs,
                  () =>
                    Promise.all([
                      MemoryLeakFinder.runCompletion(rendererRpc, connectionId),
                      MemoryLeakFinder.runCompletion(extensionHostRpc, connectionId),
                    ]),
                )
                if (timeoutBetween) {
                  await Timeout.setTimeout(timeoutBetween)
                }
                await Promise.all([MemoryLeakFinder.stop(rendererRpc, connectionId), MemoryLeakFinder.stop(extensionHostRpc, connectionId)])
                // Analyze sequentially so two full dominator graphs never compete for
                // memory. Capture remains simultaneous around the shared scenario.
                await runMemoryCityComparisons(
                  () => MemoryLeakFinder.compare(rendererRpc, connectionId, context, rendererResultPath),
                  () => MemoryLeakFinder.compare(extensionHostRpc, connectionId, context, extensionHostResultPath),
                )
                const [rendererResult, extensionHostResult] = await Promise.all([
                  readJson(rendererResultPath),
                  readJson(extensionHostResultPath),
                ])
                const renderer = rendererResult.memoryCity || rendererResult
                const extensionHost = extensionHostResult.memoryCity || extensionHostResult
                const combined = {
                  isLeak: false,
                  memoryCity: {
                    owners: {
                      extensionHost,
                      renderer,
                    },
                  },
                }
                await writeJson(resultPath, combined)
                result = { isLeak: false, summary: '' }
              } finally {
                await Promise.all([
                  rendererRpc.dispose(),
                  rm(rendererResultPath, { force: true }),
                  rm(extensionHostResultPath, { force: true }),
                ])
              }
            } else {
              const memoryRpc = workers.memoryRpc
              await MemoryLeakFinder.start(memoryRpc, connectionId)
              await TestWorkerRunTests.testWorkerRunTests(
                testWorkerRpc,
                connectionId,
                absolutePath,
                forceRun,
                runMode,
                platform,
                runs,
                () => MemoryLeakFinder.runCompletion(memoryRpc, connectionId),
              )
              if (timeoutBetween) {
                await Timeout.setTimeout(timeoutBetween)
              }
              await MemoryLeakFinder.stop(memoryRpc, connectionId)

              if (measureAfter) {
                await Timeout.setTimeout(3000)
              }

              result = await MemoryLeakFinder.compare(memoryRpc, connectionId, context, resultPath)
            }
            if (result.isLeak) {
              isLeak = true
              leaking++
            }
            if (result.summary) {
              // TODO log it in cli or stdout worker
              console.log(result.summary)
            }
          } else {
            await TestWorkerRunTests.testWorkerRunTests(testWorkerRpc, connectionId, absolutePath, forceRun, runMode, platform, runs)
          }
          await TestWorkerTeardownTest.testWorkerTearDownTest(testWorkerRpc, connectionId, absolutePath)
          const end = Time.now()
          const duration = end - start
          await callback(TestWorkerEventType.TestPassed, absolutePath, relativeDirname, dirent, duration, isLeak, wasOriginallySkipped)
          if (!isLeak) {
            passed++
          }
        }
      } catch (error) {
        if (wasOriginallySkipped) {
          skippedFailed++
        } else {
          failed++
        }
        const prettyError = await GetPrettyError.getPrettyError(error, color, root)
        await callback(
          TestWorkerEventType.TestFailed,
          absolutePath,
          relativeDirname,
          relativePath,
          dirent,
          prettyError,
          wasOriginallySkipped,
        )
      }
    }
    const end = Time.now()
    const duration = end - testStart
    if (recordVideo) {
      await VideoRecording.finalize(workers.videoRpc)
    }
    // TODO when in watch mode, dispose all workers except initialization worker to keep the application running
    await disposeWorkers(workers)
    workers = {
      devtoolsWebSocketUrl: '',
      functionTrackerRpc: emptyRpc,
      initializationWorkerRpc: emptyRpc,
      memoryRpc: emptyRpc,
      pid: 0,
      testWorkerRpc: emptyRpc,
      videoRpc: emptyRpc,
      webSocketUrl: '',
    }
    return {
      duration,
      failed,
      filterValue,
      leaked: leaking,
      passed,
      skipped,
      skippedFailed,
      total,
      type: 'success',
    }
  } catch (error) {
    const prettyError = await GetPrettyError.getPrettyError(error, color, root)
    return {
      prettyError,
      type: 'error',
    }
  }
}
