import { join } from 'node:path'
import * as Assert from '../Assert/Assert.js'
import * as GetTestToRun from '../GetTestToRun/GetTestsToRun.js'
import * as Id from '../Id/Id.js'
import * as JsonFile from '../JsonFile/JsonFile.js'
import * as MemoryLeakFinder from '../MemoryLeakFinder/MemoryLeakFinder.js'
import * as MemoryLeakResultsPath from '../MemoryLeakResultsPath/MemoryLeakResultsPath.js'
import * as MemoryLeakWorker from '../MemoryLeakWorker/MemoryLeakWorker.js'
import * as PrepareTestsOrAttach from '../PrepareTestsOrAttach/PrepareTestsOrAttach.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'
import * as TestWorkerRunTest from '../TestWorkerRunTest/TestWorkerRunTest.js'
import * as TestWorkerSetupTest from '../TestWorkerSetupTest/TestWorkerSetupTest.js'
import * as VideoRecording from '../VideoRecording/VideoRecording.js'
import * as Time from '../Time/Time.js'
import * as Timeout from '../Timeout/Timeout.js'
import { createWriteStream } from 'node:fs'

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

const logStream = createWriteStream('/tmp/log.txt')
const log = (...args) => {
  logStream.write(JSON.stringify(args, null, 2) + '\n')
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
    Assert.boolean(restartBetween)
    console.log({ restartBetween })
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
    callback(TestWorkerEventType.TestsStarting, total)
    callback(TestWorkerEventType.TestRunning, first.absolutePath, first.relativeDirname, first.dirent, /* isFirst */ true)
    const connectionId = Id.create()
    let testWorkerIpc = await PrepareTestsOrAttach.prepareTestsOrAttach(cwd, headlessMode, recordVideo, connectionId, timeouts)
    let memoryLeakWorkerIpc = MemoryLeakWorker.getIpc()
    if (checkLeaks) {
      await MemoryLeakFinder.setup(memoryLeakWorkerIpc, connectionId, measure)
    }
    for (let i = 0; i < formattedPaths.length; i++) {
      log('i' + i)
      const formattedPath = formattedPaths[i]
      const { absolutePath, relativeDirname, dirent, relativePath } = formattedPath
      const forceRun = dirent === `${filterValue}.js`
      if (i !== 0) {
        callback(TestWorkerEventType.TestRunning, absolutePath, relativeDirname, dirent, /* isFirst */ true)
      }

      try {
        const start = i === 0 ? initialStart : Time.now()
        log('before serup')
        const testSkipped = await TestWorkerSetupTest.testWorkerSetupTest(testWorkerIpc, connectionId, absolutePath, forceRun, timeouts)
        log('after serup')

        if (recordVideo) {
          await VideoRecording.addChapter(dirent, start)
        }

        if (testSkipped) {
          skipped++
          const end = Time.now()
          const duration = end - start
          callback(TestWorkerEventType.TestSkipped, absolutePath, relativeDirname, dirent, duration)
        } else {
          let isLeak = false
          if (checkLeaks) {
            if (measureAfter) {
              for (let i = 0; i < 2; i++) {
                await TestWorkerRunTest.testWorkerRunTest(testWorkerIpc, connectionId, absolutePath, forceRun)
              }
            }
            log('before sraer')
            const before = await MemoryLeakFinder.start(memoryLeakWorkerIpc, connectionId)
            console.log('after start')
            for (let i = 0; i < runs; i++) {
              log('before run')
              await TestWorkerRunTest.testWorkerRunTest(testWorkerIpc, connectionId, absolutePath, forceRun)
              log('after run')
            }
            if (timeoutBetween) {
              await Timeout.setTimeout(timeoutBetween)
            }
            log('before stop')
            const after = await MemoryLeakFinder.stop(memoryLeakWorkerIpc, connectionId)
            log('after stop')

            const result = await MemoryLeakFinder.compare(memoryLeakWorkerIpc, connectionId, before, after)
            const fileName = dirent.replace('.js', '.json')
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
              await TestWorkerRunTest.testWorkerRunTest(testWorkerIpc, connectionId, absolutePath, forceRun)
            }
          }
          const end = Time.now()
          const duration = end - start
          callback(TestWorkerEventType.TestPassed, absolutePath, relativeDirname, dirent, duration, isLeak)
          if (!isLeak) {
            passed++
          }
          if (restartBetween) {
            log('restarting')
            if (checkLeaks) {
              // TODO dispose old ipc
              MemoryLeakWorker.state.ipc = undefined
            }
            PrepareTestsOrAttach.state.promise = undefined
            testWorkerIpc = await PrepareTestsOrAttach.prepareTestsOrAttach(cwd, headlessMode, recordVideo, connectionId, timeouts)
            if (checkLeaks) {
              memoryLeakWorkerIpc = MemoryLeakWorker.getIpc()
              await MemoryLeakFinder.setup(memoryLeakWorkerIpc, connectionId, measure)
            }
            log('did restart')
          }
        }
      } catch (error) {
        failed++
        const PrettyError = await import('../PrettyError/PrettyError.js')
        const prettyError = await PrettyError.prepare(error, { color, root })
        callback(TestWorkerEventType.TestFailed, absolutePath, relativeDirname, relativePath, dirent, prettyError)
      }
    }
    const end = Time.now()
    const duration = end - start
    if (recordVideo) {
      await VideoRecording.finalize()
    }
    callback(TestWorkerEventType.AllTestsFinished, passed, failed, skipped, leaking, total, duration, filterValue)
  } catch (error) {
    const PrettyError = await import('../PrettyError/PrettyError.js')
    const prettyError = await PrettyError.prepare(error, { color, root })
    callback(TestWorkerEventType.UnexpectedTestError, prettyError)
  }
}
