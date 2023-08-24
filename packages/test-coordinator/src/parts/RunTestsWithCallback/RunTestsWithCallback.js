import * as GetTestToRun from '../GetTestToRun/GetTestsToRun.js'
import * as Id from '../Id/Id.js'
import * as PrepareTests from '../PrepareTests/PrepareTests.js'
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
  const connectionId = Id.create()
  const ipc = await PrepareTests.prepareTests(cwd, headlessMode)
  for (const formattedPath of formattedPaths) {
    await TestWorkerRunTest.testWorkerRunTest(ipc, connectionId, formattedPaths)
  }

  // console.log({ formattedPaths })

  const end = Time.now()
  const duration = end - start
  callback(TestWorkerEventType.AllTestsFinished, 0, 0, 0, 0, duration, filterValue)
}
