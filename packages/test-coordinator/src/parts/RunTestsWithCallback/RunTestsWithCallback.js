import { join } from 'path'
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
import * as Time from '../Time/Time.js'

// 1. get matching files
// 2. launch vscode
// 3. get websocket url
// 4. launch test worker
// 5. pass websocket url to test worker and wait for connection
// 6. pass matching files to test worker

export const runTests = async (root, cwd, filterValue, headlessMode, color, checkLeaks, recordVideo, runs, measure, callback) => {
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
    let passed = 0
    let failed = 0
    let skipped = 0
    let leaking = 0
    const start = Time.now()
    const formattedPaths = await GetTestToRun.getTestsToRun(root, cwd, filterValue)
    const total = formattedPaths.length
    if (total === 0) {
      return callback(TestWorkerEventType.AllTestsFinished, 0, 0, 0, 0, 0, filterValue)
    }
    const initialStart = Time.now()
    const first = formattedPaths[0]
    callback(TestWorkerEventType.TestsStarting, total)
    callback(TestWorkerEventType.TestRunning, first.absolutePath, first.relativeDirname, first.dirent, /* isFirst */ true)
    const connectionId = Id.create()
    const testWorkerIpc = await PrepareTestsOrAttach.prepareTestsOrAttach(cwd, headlessMode, recordVideo, connectionId)
    const memoryLeakWorkerIpc = MemoryLeakWorker.getIpc()
    if (checkLeaks) {
      await MemoryLeakFinder.setup(memoryLeakWorkerIpc, connectionId, measure)
    }
    for (let i = 0; i < formattedPaths.length; i++) {
      const formattedPath = formattedPaths[i]
      const { absolutePath, relativeDirname, dirent, relativePath } = formattedPath
      if (i !== 0) {
        callback(TestWorkerEventType.TestRunning, absolutePath, relativeDirname, dirent, /* isFirst */ true)
      }
      try {
        const start = i === 0 ? initialStart : Time.now()
        const testSkipped = await TestWorkerSetupTest.testWorkerSetupTest(testWorkerIpc, connectionId, formattedPath.absolutePath)
        if (testSkipped) {
          skipped++
          const end = Time.now()
          const duration = end - start
          callback(TestWorkerEventType.TestSkipped, absolutePath, relativeDirname, dirent, duration)
        } else {
          let isLeak = false
          if (checkLeaks) {
            const before = await MemoryLeakFinder.start(memoryLeakWorkerIpc, connectionId)
            await TestWorkerRunTest.testWorkerRunTest(testWorkerIpc, connectionId, formattedPath.absolutePath, root, color)
            const after = await MemoryLeakFinder.stop(memoryLeakWorkerIpc, connectionId)
            const result = await MemoryLeakFinder.compare(memoryLeakWorkerIpc, connectionId, before, after)
            const fileName = dirent.replace('.js', '.json')
            const absolutePath = join(MemoryLeakResultsPath.memoryLeakResultsPath, measure, fileName)
            await JsonFile.writeJson(absolutePath, result)
            if (result.isLeak) {
              isLeak = true
              leaking++
            }
            if (result && result.eventListeners) {
              console.log({ eventListeners: result.eventListeners })
            } else {
              console.log({ result })
            }
          } else {
            for (let i = 0; i < runs; i++) {
              await TestWorkerRunTest.testWorkerRunTest(testWorkerIpc, connectionId, formattedPath.absolutePath, root, color)
            }
          }
          const end = Time.now()
          const duration = end - start
          callback(TestWorkerEventType.TestPassed, absolutePath, relativeDirname, dirent, duration, isLeak)
          if (!isLeak) {
            passed++
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
    callback(TestWorkerEventType.AllTestsFinished, passed, failed, skipped, leaking, total, duration, filterValue)
  } catch (error) {
    const PrettyError = await import('../PrettyError/PrettyError.js')
    const prettyError = await PrettyError.prepare(error, { color, root })
    callback(TestWorkerEventType.UnexpectedTestError, prettyError)
  }
}
