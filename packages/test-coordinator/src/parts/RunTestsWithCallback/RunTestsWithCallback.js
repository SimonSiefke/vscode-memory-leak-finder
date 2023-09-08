import * as GetTestToRun from '../GetTestToRun/GetTestsToRun.js'
import * as Id from '../Id/Id.js'
import * as MemoryLeakFinder from '../MemoryLeakFinder/MemoryLeakFinder.js'
import * as PrepareTestsOrAttach from '../PrepareTestsOrAttach/PrepareTestsOrAttach.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'
import * as TestWorkerRunTest from '../TestWorkerRunTest/TestWorkerRunTest.js'
import * as TestWorkerSetupTest from '../TestWorkerSetupTest/TestWorkerSetupTest.js'
import * as MemoryLeakWorker from '../MemoryLeakWorker/MemoryLeakWorker.js'
import * as Time from '../Time/Time.js'
// 1. get matching files
// 2. launch vscode
// 3. get websocket url
// 4. launch test worker
// 5. pass websocket url to test worker and wait for connection
// 6. pass matching files to test worker

export const runTests = async (root, cwd, filterValue, headlessMode, color, checkLeaks, runs, callback) => {
  try {
    let passed = 0
    let failed = 0
    let skipped = 0
    const start = Time.now()
    const formattedPaths = await GetTestToRun.getTestsToRun(root, cwd, filterValue)
    const total = formattedPaths.length
    if (total === 0) {
      return callback(TestWorkerEventType.AllTestsFinished, 0, 0, 0, 0, 0, filterValue)
    }
    const initialStart = Time.now()
    const first = formattedPaths[0]
    callback(TestWorkerEventType.TestsStarting, total)
    callback(TestWorkerEventType.TestRunning, first.absolutePath, first.relativeDirname, first.dirent)
    const connectionId = Id.create()
    const testWorkerIpc = await PrepareTestsOrAttach.prepareTestsOrAttach(cwd, headlessMode, connectionId)
    const memoryLeakWorkerIpc = MemoryLeakWorker.getIpc()
    if (checkLeaks) {
      await MemoryLeakFinder.setup(memoryLeakWorkerIpc, connectionId)
    }
    for (let i = 0; i < formattedPaths.length; i++) {
      const formattedPath = formattedPaths[i]
      const { absolutePath, relativeDirname, dirent, relativePath } = formattedPath
      if (i !== 0) {
        callback(TestWorkerEventType.TestRunning, absolutePath, relativeDirname, dirent)
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
          if (checkLeaks) {
            const before = await MemoryLeakFinder.start(memoryLeakWorkerIpc, connectionId)
            await TestWorkerRunTest.testWorkerRunTest(testWorkerIpc, connectionId, formattedPath.absolutePath, root, color)
            const after = await MemoryLeakFinder.stop(memoryLeakWorkerIpc, connectionId)
            const result = await MemoryLeakFinder.compare(memoryLeakWorkerIpc, connectionId, before, after)
            console.log({ result })
          } else {
            for (let i = 0; i < runs; i++) {
              await TestWorkerRunTest.testWorkerRunTest(testWorkerIpc, connectionId, formattedPath.absolutePath, root, color)
            }
          }
          const end = Time.now()
          const duration = end - start
          callback(TestWorkerEventType.TestPassed, absolutePath, relativeDirname, dirent, duration)
          passed++
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
    callback(TestWorkerEventType.AllTestsFinished, passed, failed, skipped, total, duration, filterValue)
  } catch (error) {
    const PrettyError = await import('../PrettyError/PrettyError.js')
    const prettyError = await PrettyError.prepare(error, { color, root })
    callback(TestWorkerEventType.UnexpectedTestError, prettyError)
  }
}
