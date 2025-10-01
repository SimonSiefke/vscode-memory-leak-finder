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
  callback,
  addDisposable,
  clearDisposables,
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
    )

    addDisposable(async () => {
      await testWorkerRpc.dispose()
    })
    addDisposable(async () => {
      await memoryRpc.dispose()
    })
    addDisposable(async () => {
      await videoRpc?.dispose()
    })
    const context = {
      runs,
    }

    const intializeEnd = performance.now()
    const intializeTime = intializeEnd - initialStart

    await callback(TestWorkerEventType.HandleInitialized, intializeTime)

    const testStart = performance.now()
    await callback(TestWorkerEventType.TestsStarting, total)
    await callback(TestWorkerEventType.TestRunning, first.absolutePath, first.relativeDirname, first.dirent, /* isFirst */ true)

    let currentMemoryRpc = memoryRpc
    let currentTestRpc = testWorkerRpc
    let currentVideoRpc = videoRpc
    for (let i = 0; i < formattedPaths.length; i++) {
      const formattedPath = formattedPaths[i]
      const { absolutePath, relativeDirname, dirent, relativePath } = formattedPath
      const forceRun = runSkippedTestsAnyway || dirent === `${filterValue}.js`
      let wasOriginallySkipped = false
      if (i !== 0) {
        await callback(TestWorkerEventType.TestRunning, absolutePath, relativeDirname, dirent, /* isFirst */ true)
      }

      try {
        const start = i === 0 ? initialStart : Time.now()
        const testResult = await TestWorkerSetupTest.testWorkerSetupTest(currentTestRpc, connectionId, absolutePath, forceRun, timeouts)
        const testSkipped = testResult.skipped
        wasOriginallySkipped = testResult.wasOriginallySkipped

        if (recordVideo) {
          await VideoRecording.addChapter(currentVideoRpc, dirent, start)
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
                await TestWorkerRunTest.testWorkerRunTest(currentTestRpc, connectionId, absolutePath, forceRun, runMode)
              }
            }
            await MemoryLeakFinder.start(currentMemoryRpc, connectionId)
            for (let i = 0; i < runs; i++) {
              await TestWorkerRunTest.testWorkerRunTest(currentTestRpc, connectionId, absolutePath, forceRun, runMode)
            }
            if (timeoutBetween) {
              await Timeout.setTimeout(timeoutBetween)
            }
            await MemoryLeakFinder.stop(currentMemoryRpc, connectionId)

            // TODO memory leak finder should write result, to avoid sending large result here
            const result = await MemoryLeakFinder.compare(currentMemoryRpc, connectionId, context)
            const fileName = dirent.replace('.js', '.json').replace('.ts', '.json')
            const testName = fileName.replace('.json', '')
            let resultPath
            if (measureNode) {
              resultPath = join(MemoryLeakResultsPath.memoryLeakResultsPath, 'node', measure, testName + '.json')
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
              await TestWorkerRunTest.testWorkerRunTest(currentTestRpc, connectionId, absolutePath, forceRun, runMode)
            }
          }
          await TestWorkerTeardownTest.testWorkerTearDownTest(currentTestRpc, connectionId, absolutePath)
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
      } finally {
        if (restartBetween) {
          await clearDisposables()
          PrepareTestsOrAttach.state.promise = undefined
          const { memoryRpc, testWorkerRpc, videoRpc } = await PrepareTestsOrAttach.prepareTestsAndAttach(
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
          )
          addDisposable(async () => {
            await memoryRpc.dispose()
          })
          addDisposable(async () => {
            await videoRpc?.dispose()
          })
          addDisposable(async () => {
            await testWorkerRpc?.dispose()
          })
          currentTestRpc = testWorkerRpc
          currentMemoryRpc = memoryRpc
          currentVideoRpc = videoRpc
        }
      }
    }
    const end = Time.now()
    const duration = end - testStart
    if (recordVideo) {
      await VideoRecording.finalize(currentVideoRpc)
    }
    await callback(TestWorkerEventType.AllTestsFinished, passed, failed, skipped, skippedFailed, leaking, total, duration, filterValue)
  } catch (error) {
    const PrettyError = await import('../PrettyError/PrettyError.ts')
    const prettyError = await PrettyError.prepare(error, { color, root })
    await callback(TestWorkerEventType.UnexpectedTestError, prettyError)
  }
}
