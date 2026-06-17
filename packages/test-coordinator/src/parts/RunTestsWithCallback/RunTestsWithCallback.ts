import { join } from 'node:path'
import type { RunTestsWithCallbackOptions } from '../RunTestsOptions/RunTestsOptions.ts'
import type { RunTestsResult } from '../RunTestsResult/RunTestsResult.ts'
import * as Assert from '../Assert/Assert.ts'
import * as BrowserPageTargets from '../BrowserPageTargets/BrowserPageTargets.ts'
import * as GetPageObjectPath from '../GetPageObjectPath/GetPageObjectPath.ts'
import * as GetPrettyError from '../GetPrettyError/GetPrettyError.ts'
import * as GetProxyTestFolderName from '../GetProxyTestFolderName/GetProxyTestFolderName.ts'
import * as GetTestToRun from '../GetTestToRun/GetTestsToRun.ts'
import * as Id from '../Id/Id.ts'
import * as MemoryLeakFinder from '../MemoryLeakFinder/MemoryLeakFinder.ts'
import * as MemoryLeakWorker from '../MemoryLeakWorker/MemoryLeakWorker.ts'
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
  inspectIntegratedBrowser,
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
    Assert.boolean(inspectIntegratedBrowser)
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
        inspectIntegratedBrowser,
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
      devtoolsWebSocketUrl: '',
      functionTrackerRpc: emptyRpc,
      initializationWorkerRpc: emptyRpc,
      memoryRpc: emptyRpc,
      pid: 0,
      testWorkerRpc: emptyRpc,
      videoRpc: emptyRpc,
      webSocketUrl: '',
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
        if (inspectIntegratedBrowser && workers.memoryRpc !== emptyRpc) {
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
            if (inspectIntegratedBrowser) {
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
            const memoryRpc = workers.memoryRpc
            await MemoryLeakFinder.start(memoryRpc, connectionId)
            await TestWorkerRunTests.testWorkerRunTests(testWorkerRpc, connectionId, absolutePath, forceRun, runMode, platform, runs)
            if (timeoutBetween) {
              await Timeout.setTimeout(timeoutBetween)
            }
            await MemoryLeakFinder.stop(memoryRpc, connectionId)

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
            } else if (inspectIntegratedBrowser) {
              resultPath = join(MemoryLeakResultsPath.memoryLeakResultsPath, 'integrated-browser', measure, fileName)
            } else {
              resultPath = join(MemoryLeakResultsPath.memoryLeakResultsPath, measure, fileName)
            }

            const result = await MemoryLeakFinder.compare(memoryRpc, connectionId, context, resultPath)
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
