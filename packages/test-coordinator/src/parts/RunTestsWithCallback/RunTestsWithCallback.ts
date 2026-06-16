import { join } from 'node:path'
import type { RunTestsWithCallbackOptions } from '../RunTestsOptions/RunTestsOptions.ts'
import type { RunTestsResult } from '../RunTestsResult/RunTestsResult.ts'
import * as Assert from '../Assert/Assert.ts'
import * as GetPageObjectPath from '../GetPageObjectPath/GetPageObjectPath.ts'
import * as GetPrettyError from '../GetPrettyError/GetPrettyError.ts'
import * as GetProxyTestFolderName from '../GetProxyTestFolderName/GetProxyTestFolderName.ts'
import * as GetTestToRun from '../GetTestToRun/GetTestsToRun.ts'
import * as Id from '../Id/Id.ts'
import * as MemoryLeakFinder from '../MemoryLeakFinder/MemoryLeakFinder.ts'
import * as MemoryLeakResultsPath from '../MemoryLeakResultsPath/MemoryLeakResultsPath.ts'
import * as PrepareTestsOrAttach from '../PrepareTestsOrAttach/PrepareTestsOrAttach.ts'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.ts'
import * as TestWorkerRunTests from '../TestWorkerRunTests/TestWorkerRunTests.ts'
import * as TestWorkerSetupTest from '../TestWorkerSetupTest/TestWorkerSetupTest.ts'
import * as TestWorkerTeardownTest from '../TestWorkerTeardownTest/TestWorkerTearDownTest.ts'
import * as Time from '../Time/Time.ts'
import * as Timeout from '../Timeout/Timeout.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'
import * as SetupOnly from '../SetupOnly/SetupOnly.ts'
import * as VideoRecording from '../VideoRecording/VideoRecording.ts'
import type { Rpc } from '@lvce-editor/rpc'
import { emptyRpc } from '../EmptyRpc/EmptyRpc.ts'
import { doLogin } from '../DoLogin/DoLogin.ts'

interface WorkerMap {
  readonly functionTrackerRpc: Rpc
  readonly initializationWorkerRpc: Rpc
  readonly memoryRpc: Rpc
  readonly testWorkerRpc: Rpc
  readonly videoRpc: Rpc
}

const MACOS_E2E_PHASE_TIMEOUT = 60_000
const MACOS_E2E_TIMEOUT_CODE = 'MACOS_E2E_TIMEOUT'

const createMacosTimeoutError = (phase: string, absolutePath: string): Error & { code: string } => {
  const error = new Error(`macOS e2e timeout after ${MACOS_E2E_PHASE_TIMEOUT}ms during ${phase} for ${absolutePath}`)
  ;(error as Error & { code: string }).code = MACOS_E2E_TIMEOUT_CODE
  return error as Error & { code: string }
}

const isMacosTimeoutError = (error: unknown): boolean => {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === MACOS_E2E_TIMEOUT_CODE)
}

const withMacosPhaseTimeout = async <T>(promise: Promise<T>, platform: string, phase: string, absolutePath: string): Promise<T> => {
  if (platform !== 'darwin') {
    return promise
  }
  let timeout: NodeJS.Timeout | undefined
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        timeout = undefined
        reject(createMacosTimeoutError(phase, absolutePath))
      }, MACOS_E2E_PHASE_TIMEOUT)
      timeout.unref?.()
    })
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

const disposeWorkers = async (workers: WorkerMap): Promise<void> => {
  const { functionTrackerRpc, initializationWorkerRpc, memoryRpc, testWorkerRpc, videoRpc } = workers
  await Promise.all([functionTrackerRpc.dispose(), memoryRpc.dispose(), testWorkerRpc.dispose(), videoRpc.dispose()])
  await initializationWorkerRpc.dispose()
}

export const runTestsWithCallback = async ({
  allowCopilotAuthInCi,
  arch,
  callback,
  getTimeStamp,
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
  headlessMode,
  ide,
  ideVersion,
  insidersCommit,
  inspectExtensions,
  inspectExtensionsPort,
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
  runs,
  runSkippedTestsAnyway,
  screencastQuality,
  setupOnly,
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
    Assert.boolean(color)
    Assert.boolean(checkLeaks)
    Assert.boolean(recordVideo)
    Assert.number(runs)
    Assert.string(measure)
    Assert.boolean(measureAfter)
    Assert.boolean(measureNode)
    Assert.boolean(timeouts)
    Assert.number(timeoutBetween)
    Assert.number(runMode)
    Assert.boolean(restartBetween)
    Assert.string(ide)
    Assert.string(ideVersion)
    Assert.boolean(setupOnly)
    Assert.boolean(login)
    Assert.boolean(enableExtensions)

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
      functionTrackerRpc: emptyRpc,
      initializationWorkerRpc: emptyRpc,
      memoryRpc: emptyRpc,
      testWorkerRpc: emptyRpc,
      videoRpc: emptyRpc,
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
        const { functionTrackerRpc, initializationWorkerRpc, memoryRpc, testWorkerRpc, videoRpc } = await withMacosPhaseTimeout(
          PrepareTestsOrAttach.prepareTestsAndAttach({
            arch,
            attachedToPageTimeout,
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
            inspectPtyHost,
            inspectPtyHostPort,
            inspectSharedProcess,
            inspectSharedProcessPort,
            measureId: measure,
            measureNode,
            openDevtools,
            pageObjectPath: pageObjectPathResolved,
            platform,
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
          }),
          platform,
          'prepareTestsAndAttach',
          absolutePath,
        )
        workers = {
          functionTrackerRpc: functionTrackerRpc || emptyRpc,
          initializationWorkerRpc: initializationWorkerRpc || emptyRpc,
          memoryRpc: memoryRpc || emptyRpc,
          testWorkerRpc: testWorkerRpc || emptyRpc,
          videoRpc: videoRpc || emptyRpc,
        }
      }

      if (enableProxy) {
        await workers.initializationWorkerRpc.invoke('Launch.setProxyTestFolderName', proxyTestFolderName)
      }

      const { memoryRpc, testWorkerRpc, videoRpc } = workers

      let wasOriginallySkipped = false
      if (i !== 0) {
        await callback(TestWorkerEventType.TestRunning, absolutePath, relativeDirname, dirent, /* isFirst */ true)
      }

      try {
        const start = i === 0 ? initialStart : Time.now()
        const testResult = await withMacosPhaseTimeout<any>(
          TestWorkerSetupTest.testWorkerSetupTest(
            testWorkerRpc,
            connectionId,
            absolutePath,
            forceRun,
            timeouts,
            isGithubActions,
            allowCopilotAuthInCi,
          ),
          platform,
          'setupTest',
          absolutePath,
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
              await withMacosPhaseTimeout(
                TestWorkerRunTests.testWorkerRunTests(testWorkerRpc, connectionId, absolutePath, forceRun, runMode, platform, 2),
                platform,
                'measureAfterRunTests',
                absolutePath,
              )
            }
            await withMacosPhaseTimeout(MemoryLeakFinder.start(memoryRpc, connectionId), platform, 'memoryLeakStart', absolutePath)
            await withMacosPhaseTimeout(
              TestWorkerRunTests.testWorkerRunTests(testWorkerRpc, connectionId, absolutePath, forceRun, runMode, platform, runs),
              platform,
              'runTests',
              absolutePath,
            )
            if (timeoutBetween) {
              await Timeout.setTimeout(timeoutBetween)
            }
            await withMacosPhaseTimeout(MemoryLeakFinder.stop(memoryRpc, connectionId), platform, 'memoryLeakStop', absolutePath)

            if (measureAfter) {
              await Timeout.setTimeout(3000)
            }

            const fileName = dirent.replace('.js', '.json').replace('.ts', '.json')
            const testName = fileName.replace('.json', '')
            let resultPath
            if (measureNode) {
              resultPath = join(MemoryLeakResultsPath.memoryLeakResultsPath, 'node', measure, testName + '.json')
            } else if (inspectSharedProcess) {
              resultPath = join(MemoryLeakResultsPath.memoryLeakResultsPath, 'shared-process', measure, fileName)
            } else if (inspectExtensions) {
              resultPath = join(MemoryLeakResultsPath.memoryLeakResultsPath, 'extension-host', measure, fileName)
            } else if (inspectPtyHost) {
              resultPath = join(MemoryLeakResultsPath.memoryLeakResultsPath, 'pty-host', measure, fileName)
            } else {
              resultPath = join(MemoryLeakResultsPath.memoryLeakResultsPath, measure, fileName)
            }

            const result = await withMacosPhaseTimeout<any>(
              MemoryLeakFinder.compare(memoryRpc, connectionId, context, resultPath),
              platform,
              'memoryLeakCompare',
              absolutePath,
            )
            if (result.isLeak) {
              isLeak = true
              leaking++
            }
            if (result.summary) {
              // TODO log it in cli or stdout worker
              console.log(result.summary)
            }
          } else {
            await withMacosPhaseTimeout(
              TestWorkerRunTests.testWorkerRunTests(testWorkerRpc, connectionId, absolutePath, forceRun, runMode, platform, runs),
              platform,
              'runTests',
              absolutePath,
            )
          }
          await withMacosPhaseTimeout(
            TestWorkerTeardownTest.testWorkerTearDownTest(testWorkerRpc, connectionId, absolutePath),
            platform,
            'teardownTest',
            absolutePath,
          )
          const end = Time.now()
          const duration = end - start
          await callback(TestWorkerEventType.TestPassed, absolutePath, relativeDirname, dirent, duration, isLeak, wasOriginallySkipped)
          if (!isLeak) {
            passed++
          }
        }
      } catch (error) {
        if (isMacosTimeoutError(error)) {
          await disposeWorkers(workers)
          throw error
        }
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
      functionTrackerRpc: emptyRpc,
      initializationWorkerRpc: emptyRpc,
      memoryRpc: emptyRpc,
      testWorkerRpc: emptyRpc,
      videoRpc: emptyRpc,
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
