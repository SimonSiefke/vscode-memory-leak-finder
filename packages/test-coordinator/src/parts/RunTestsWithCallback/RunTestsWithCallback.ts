import { join } from 'node:path'
import * as Assert from '../Assert/Assert.ts'
import * as GetTestToRun from '../GetTestToRun/GetTestsToRun.ts'
import * as Id from '../Id/Id.ts'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import * as MemoryLeakFinder from '../MemoryLeakFinder/MemoryLeakFinder.ts'
import * as MemoryLeakResultsPath from '../MemoryLeakResultsPath/MemoryLeakResultsPath.ts'
import * as MemoryLeakWorker from '../MemoryLeakWorker/MemoryLeakWorker.ts'
import * as PrepareTestsOrAttach from '../PrepareTestsOrAttach/PrepareTestsOrAttach.ts'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.ts'
import * as TestWorkerRunTest from '../TestWorkerRunTest/TestWorkerRunTest.ts'
import * as TestWorkerSetupTest from '../TestWorkerSetupTest/TestWorkerSetupTest.ts'
import * as Time from '../Time/Time.ts'
import * as Timeout from '../Timeout/Timeout.ts'
import * as TestWorkerTeardownTest from '../TestWorkerTeardownTest/TestWorkerTearDownTest.ts'
import * as VideoRecording from '../VideoRecording/VideoRecording.ts'

// 1. get matching files
// 2. launch vscode
// 3. get websocket url
// 4. launch test worker
// 5. pass websocket url to test worker and wait for connection
// 6. pass matching files to test worker

const getSummary = (result) => {
  if (result && result.eventListeners) {
    return { eventListeners: result.eventListeners }
  }
  if (result && result.summary) {
    return result.summary
  }
  return { result }
}

export const runTests = async (
  root,
  cwd,
  filterValue,
  headlessMode,
  color,
  checkLeaks,
  recordVideo,
  runs,
  measure,
  measureAfter,
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
) => {
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
    Assert.boolean(timeouts)
    Assert.number(timeoutBetween)
    Assert.number(runMode)
    Assert.boolean(restartBetween)
    Assert.string(ide)
    Assert.string(ideVersion)
    Assert.boolean(setupOnly)

    // If setup-only mode is enabled and a commit is provided, only set up VS Code
    if (setupOnly && commit) {
      console.log(`Setting up VS Code for commit: ${commit}`)
      const connectionId = Id.create()
      await PrepareTestsOrAttach.prepareTestsOrAttach(
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
      )
      console.log('VS Code setup completed successfully')
      return callback(TestWorkerEventType.AllTestsFinished, 0, 0, 0, 0, 0, 0, filterValue)
    }

    let passed = 0
    let failed = 0
    let skipped = 0
    let leaking = 0
    const start = Time.now()
    const formattedPaths = await GetTestToRun.getTestsToRun(root, cwd, filterValue)
    const total = formattedPaths.length
    if (total === 0) {
      return callback(TestWorkerEventType.AllTestsFinished, passed, failed, skipped, leaking, total, 0, filterValue)
    }
    const initialStart = Time.now()
    const first = formattedPaths[0]
    await callback(TestWorkerEventType.TestsStarting, total)
    await callback(TestWorkerEventType.TestRunning, first.absolutePath, first.relativeDirname, first.dirent, /* isFirst */ true)
    const connectionId = Id.create()
    let testWorkerIpc = await PrepareTestsOrAttach.prepareTestsOrAttach(
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
    )
    let memoryLeakWorkerRpc = MemoryLeakWorker.getRpc()
    let targetId = ''
    if (checkLeaks) {
      const info = await MemoryLeakFinder.setup(memoryLeakWorkerRpc, connectionId, measure)
      targetId = info.targetId
    }
    for (let i = 0; i < formattedPaths.length; i++) {
      const formattedPath = formattedPaths[i]
      const { absolutePath, relativeDirname, dirent, relativePath } = formattedPath
      const forceRun = dirent === `${filterValue}.js`
      if (i !== 0) {
        await callback(TestWorkerEventType.TestRunning, absolutePath, relativeDirname, dirent, /* isFirst */ true)
      }

      try {
        const start = i === 0 ? initialStart : Time.now()
        const testSkipped = await TestWorkerSetupTest.testWorkerSetupTest(testWorkerIpc, connectionId, absolutePath, forceRun, timeouts)

        if (recordVideo) {
          await VideoRecording.addChapter(dirent, start)
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
                await TestWorkerRunTest.testWorkerRunTest(testWorkerIpc, connectionId, absolutePath, forceRun, runMode)
              }
            }
            const before = await MemoryLeakFinder.start(memoryLeakWorkerRpc, connectionId, targetId)
            for (let i = 0; i < runs; i++) {
              await TestWorkerRunTest.testWorkerRunTest(testWorkerIpc, connectionId, absolutePath, forceRun, runMode)
            }
            if (timeoutBetween) {
              await Timeout.setTimeout(timeoutBetween)
            }
            const after = await MemoryLeakFinder.stop(memoryLeakWorkerRpc, connectionId, targetId)

            const result = await MemoryLeakFinder.compare(memoryLeakWorkerRpc, connectionId, before, after)
            const fileName = dirent.replace('.ts', '.json')
            const resultPath = join(MemoryLeakResultsPath.memoryLeakResultsPath, measure, fileName)
            await JsonFile.writeJson(resultPath, result)
            if (result.isLeak) {
              isLeak = true
              leaking++
            }
            const summary = getSummary(result)
            console.log(summary)
          } else {
            for (let i = 0; i < runs; i++) {
              await TestWorkerRunTest.testWorkerRunTest(testWorkerIpc, connectionId, absolutePath, forceRun, runMode)
            }
          }
          await TestWorkerTeardownTest.testWorkerTearDownTest(testWorkerIpc, connectionId, absolutePath)
          const end = Time.now()
          const duration = end - start
          await callback(TestWorkerEventType.TestPassed, absolutePath, relativeDirname, dirent, duration, isLeak)
          if (!isLeak) {
            passed++
          }
          if (restartBetween) {
            if (memoryLeakWorkerRpc) {
              memoryLeakWorkerRpc.dispose()
              memoryLeakWorkerRpc = undefined
            }
            if (testWorkerIpc) {
              testWorkerIpc.dispose()
            }
            PrepareTestsOrAttach.state.promise = undefined
            testWorkerIpc = await PrepareTestsOrAttach.prepareTestsOrAttach(
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
            )
            if (checkLeaks) {
              memoryLeakWorkerRpc = MemoryLeakWorker.getRpc()
              await MemoryLeakFinder.setup(memoryLeakWorkerRpc, connectionId, measure)
            }
          }
        }
      } catch (error) {
        failed++
        const PrettyError = await import('../PrettyError/PrettyError.ts')
        const prettyError = await PrettyError.prepare(error, { color, root })
        await callback(TestWorkerEventType.TestFailed, absolutePath, relativeDirname, relativePath, dirent, prettyError)
      }
    }
    const end = Time.now()
    const duration = end - start
    if (recordVideo) {
      await VideoRecording.finalize()
    }
    await callback(TestWorkerEventType.AllTestsFinished, passed, failed, skipped, leaking, total, duration, filterValue)
  } catch (error) {
    const PrettyError = await import('../PrettyError/PrettyError.ts')
    const prettyError = await PrettyError.prepare(error, { color, root })
    await callback(TestWorkerEventType.UnexpectedTestError, prettyError)
  }
}
