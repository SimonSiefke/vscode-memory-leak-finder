import { join } from 'node:path'
import * as Assert from '../Assert/Assert.ts'
import * as GetPageObjectPath from '../GetPageObjectPath/GetPageObjectPath.ts'
import { getSummary } from '../GetSummary/GetSummary.ts'
import * as GetTestToRun from '../GetTestToRun/GetTestsToRun.ts'
import * as Id from '../Id/Id.ts'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import * as MemoryLeakFinder from '../MemoryLeakFinder/MemoryLeakFinder.ts'
import * as MemoryLeakResultsPath from '../MemoryLeakResultsPath/MemoryLeakResultsPath.ts'
import * as PrepareTestsOrAttach from '../PrepareTestsOrAttach/PrepareTestsOrAttach.ts'
import type { RunTestsWithCallbackOptions } from '../RunTestsOptions/RunTestsOptions.ts'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.ts'
import * as TestWorkerRunTest from '../TestWorkerRunTest/TestWorkerRunTest.ts'
import * as TestWorkerSetupTest from '../TestWorkerSetupTest/TestWorkerSetupTest.ts'
import * as TestWorkerTeardownTest from '../TestWorkerTeardownTest/TestWorkerTearDownTest.ts'
import * as Time from '../Time/Time.ts'
import * as Timeout from '../Timeout/Timeout.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'
import * as VideoRecording from '../VideoRecording/VideoRecording.ts'

const emptyRpc = {
  invoke() {
    throw new Error(`not implemented`)
  },
  async dispose() {},
}

const disposeWorkers = async (workers) => {
  const { initializationWorkerRpc, memoryRpc, testWorkerRpc, videoRpc } = workers
  await initializationWorkerRpc.dispose()
  await memoryRpc.dispose()
  await testWorkerRpc.dispose()
  await videoRpc.dispose()
}

export const runTestsWithCallback = async ({
  root,
  cwd,
  filterValue,
  headlessMode,
  color,
  checkLeaks,
  runSkippedTestsAnyway,
  recordVideo,
  runs,
  measure,
  measureAfter,
  measureNode,
  timeouts,
  timeoutBetween,
  restartBetween,
  runMode,
  ide,
  ideVersion,
  vscodePath,
  commit,
  setupOnly,
  inspectSharedProcess,
  inspectExtensions,
  inspectPtyHost,
  callback,
}: RunTestsWithCallbackOptions) => {
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

    const connectionId = Id.create()
    const attachedToPageTimeout = TimeoutConstants.AttachToPage
    const idleTimeout = TimeoutConstants.Idle
    const pageObjectPath = GetPageObjectPath.getPageObjectPath()

    // TODO for each connection id, launch all needed workers
    // when a new connection id comes in, dispose them (even while running)
    // Then recreate the workers, ensuring a clean state

    if (setupOnly && commit) {
      const { testWorkerRpc, memoryRpc, videoRpc } = await PrepareTestsOrAttach.prepareTestsAndAttach(
        cwd,
        headlessMode,
        recordVideo,
        connectionId,
        timeouts,
        runMode,
        ide,
        ideVersion,
        vscodePath,
        commit,

        attachedToPageTimeout,
        measure,
        idleTimeout,
        pageObjectPath,
        measureNode,
        inspectSharedProcess,
        inspectExtensions,
        inspectPtyHost,
      )
      await testWorkerRpc.dispose()
      await memoryRpc?.dispose()
      await videoRpc?.dispose()
      return callback(TestWorkerEventType.AllTestsFinished, 0, 0, 0, 0, 0, 0, 0, filterValue)
    }

    let passed = 0
    let failed = 0
    let skipped = 0
    let skippedFailed = 0
    let leaking = 0
    const formattedPaths = await GetTestToRun.getTestsToRun(root, cwd, filterValue)
    const total = formattedPaths.length
    if (total === 0) {
      return callback(TestWorkerEventType.AllTestsFinished, passed, failed, skipped, 0, leaking, total, 0, filterValue)
    }
    const initialStart = Time.now()
    const first = formattedPaths[0]
    await callback(TestWorkerEventType.HandleInitializing)

    const context = {
      runs,
    }

    const intializeEnd = performance.now()
    const intializeTime = intializeEnd - initialStart

    await callback(TestWorkerEventType.HandleInitialized, intializeTime)

    const testStart = performance.now()
    await callback(TestWorkerEventType.TestsStarting, total)
    await callback(TestWorkerEventType.TestRunning, first.absolutePath, first.relativeDirname, first.dirent, /* isFirst */ true)

    let workers = {
      testWorkerRpc: emptyRpc,
      memoryRpc: emptyRpc,
      videoRpc: emptyRpc,
      initializationWorkerRpc: emptyRpc,
    }

    for (let i = 0; i < formattedPaths.length; i++) {
      const formattedPath = formattedPaths[i]
      const { absolutePath, relativeDirname, dirent, relativePath } = formattedPath
      const forceRun = runSkippedTestsAnyway || dirent === `${filterValue}.js`

      const needsSetup = i === 0 || restartBetween

      if (needsSetup) {
        await disposeWorkers(workers)
        PrepareTestsOrAttach.state.promise = undefined
        const { testWorkerRpc, memoryRpc, videoRpc, initializationWorkerRpc } = await PrepareTestsOrAttach.prepareTestsAndAttach(
          cwd,
          headlessMode,
          recordVideo,
          connectionId,
          timeouts,
          runMode,
          ide,
          ideVersion,
          vscodePath,
          commit,
          attachedToPageTimeout,
          measure,
          idleTimeout,
          pageObjectPath,
          measureNode,
          inspectSharedProcess,
          inspectExtensions,
          inspectPtyHost,
        )
        workers = {
          testWorkerRpc: testWorkerRpc || emptyRpc,
          memoryRpc: memoryRpc || emptyRpc,
          videoRpc: videoRpc || emptyRpc,
          initializationWorkerRpc: initializationWorkerRpc || emptyRpc,
        }
      }

      const { testWorkerRpc, memoryRpc, videoRpc } = workers

      let wasOriginallySkipped = false
      if (i !== 0) {
        await callback(TestWorkerEventType.TestRunning, absolutePath, relativeDirname, dirent, /* isFirst */ true)
      }

      try {
        const start = i === 0 ? initialStart : Time.now()
        const testResult = await TestWorkerSetupTest.testWorkerSetupTest(testWorkerRpc, connectionId, absolutePath, forceRun, timeouts)
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
              for (let i = 0; i < 2; i++) {
                await TestWorkerRunTest.testWorkerRunTest(testWorkerRpc, connectionId, absolutePath, forceRun, runMode)
              }
            }
            await MemoryLeakFinder.start(memoryRpc, connectionId)
            for (let i = 0; i < runs; i++) {
              await TestWorkerRunTest.testWorkerRunTest(testWorkerRpc, connectionId, absolutePath, forceRun, runMode)
            }
            if (timeoutBetween) {
              await Timeout.setTimeout(timeoutBetween)
            }
            await MemoryLeakFinder.stop(memoryRpc, connectionId)

            // TODO memory leak finder should write result, to avoid sending large result here
            const result = await MemoryLeakFinder.compare(memoryRpc, connectionId, context)
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
            await JsonFile.writeJson(resultPath, result)
            if (result.isLeak) {
              isLeak = true
              leaking++
            }
            const summary = getSummary(result)
            console.log(summary)
          } else {
            for (let i = 0; i < runs; i++) {
              await TestWorkerRunTest.testWorkerRunTest(testWorkerRpc, connectionId, absolutePath, forceRun, runMode)
            }
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
        const PrettyError = await import('../PrettyError/PrettyError.ts')
        const prettyError = await PrettyError.prepare(error, { color, root })
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
    await callback(TestWorkerEventType.AllTestsFinished, passed, failed, skipped, skippedFailed, leaking, total, duration, filterValue)
  } catch (error) {
    const PrettyError = await import('../PrettyError/PrettyError.ts')
    const prettyError = await PrettyError.prepare(error, { color, root })
    await callback(TestWorkerEventType.UnexpectedTestError, prettyError)
  }
}
