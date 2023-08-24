import * as Connect from '../Connect/Connect.js'
import * as GetTestToRun from '../GetTestToRun/GetTestsToRun.js'
import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.js'
import * as TestWorker from '../TestWorker/TestWorker.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'
import * as TestWorkerRunTest from '../TestWorkerRunTest/TestWorkerRunTest.js'
import * as Time from '../Time/Time.js'
import * as Id from '../Id/Id.js'
import * as PageObject from '../PageObject/PageObject.js'

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
  const state = {
    passed: 0,
    failed: 0,
    skipped: 0,
    total,
  }
  const first = formattedPaths[0]
  const { absolutePath, relativePath, relativeDirname, dirent } = first
  callback(TestWorkerEventType.TestRunning, absolutePath, relativeDirname, dirent)
  const initialStart = Time.now()
  const context = await LaunchVsCode.launchVsCode({
    headlessMode,
    cwd,
  })
  const child = context.child
  const webSocketUrl = context.webSocketUrl

  const ipc = await TestWorker.launch()
  const connectionId = Id.create()
  await Connect.connect(ipc, connectionId, webSocketUrl)
  await PageObject.create(ipc, connectionId)
  for (const formattedPath of formattedPaths) {
    await TestWorkerRunTest.testWorkerRunTest(ipc, connectionId, formattedPaths)
  }

  // console.log({ formattedPaths })

  const end = Time.now()
  const duration = end - start
  callback(TestWorkerEventType.AllTestsFinished, state.passed, state.failed, state.skipped, state.total, duration, filterValue)
}
