import * as GetTestToRun from '../GetTestToRun/GetTestsToRun.js'
import * as Id from '../Id/Id.js'
import * as PrepareTests from '../PrepareTests/PrepareTests.js'
import * as PrettyError from '../PrettyError/PrettyError.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'
import * as TestWorkerRunTest from '../TestWorkerRunTest/TestWorkerRunTest.js'
import * as Time from '../Time/Time.js'

// 1. get matching files
// 2. launch vscode
// 3. get websocket url
// 4. launch test worker
// 5. pass websocket url to test worker and wait for connection
// 6. pass matching files to test worker

export const runTests = async (root, cwd, filterValue, headlessMode, color, callback) => {
  const start = Time.now()
  const formattedPaths = await GetTestToRun.getTestsToRun(root, cwd, filterValue)
  const total = formattedPaths.length
  if (total === 0) {
    return callback(TestWorkerEventType.AllTestsFinished, 0, 0, 0, 0, 0, filterValue)
  }
  let passed = 0
  let failed = 0
  let skipped = 0
  const initialStart = Time.now()
  const first = formattedPaths[0]
  callback(TestWorkerEventType.TestsStarting, total)
  callback(TestWorkerEventType.TestRunning, first.absolutePath, first.relativeDirname, first.dirent)
  const connectionId = Id.create()
  const ipc = await PrepareTests.prepareTests(cwd, headlessMode, connectionId)
  for (let i = 0; i < formattedPaths.length; i++) {
    const formattedPath = formattedPaths[i]
    const { absolutePath, relativeDirname, dirent, relativePath } = formattedPath
    if (i !== 0) {
      callback(TestWorkerEventType.TestRunning, absolutePath, relativeDirname, dirent)
    }
    try {
      const start = i === 0 ? initialStart : Time.now()
      const testSkipped = await TestWorkerRunTest.testWorkerRunTest(ipc, connectionId, formattedPath.absolutePath, root, color)
      const end = Time.now()
      const duration = end - start
      if (testSkipped) {
        skipped++
        callback(TestWorkerEventType.TestSkipped, absolutePath, relativeDirname, dirent, duration)
      } else {
        callback(TestWorkerEventType.TestPassed, absolutePath, relativeDirname, dirent, duration)
        passed++
      }
    } catch (error) {
      failed++
      const prettyError = await PrettyError.prepare(error, { color, root })
      callback(TestWorkerEventType.TestFailed, absolutePath, relativeDirname, relativePath, dirent, prettyError)
    }
  }
  const end = Time.now()
  const duration = end - start
  callback(TestWorkerEventType.AllTestsFinished, passed, failed, skipped, total, duration, filterValue)
}
