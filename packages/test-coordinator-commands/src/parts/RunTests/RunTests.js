import * as FileSystem from '../FileSystem/FileSystem.js'
import * as JsonRpcEvent from '../JsonRpcEvent/JsonRpcEvent.js'
import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.js'
import * as Logger from '../Logger/Logger.js'
import * as Path from '../Path/Path.js'
import * as PrettyError from '../PrettyError/PrettyError.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'
import * as Time from '../Time/Time.js'
import * as GetTestToRun from '../GetTestToRun/GetTestsToRun.js'

let child
let webSocketUrl

// 1. get matching files
// 2. launch vscode
// 3. get websocket url
// 4. launch test worker
// 5. pass websocket url to test worker and wait for connection
// 6. pass matching files to test worker

export const runTests = async (root, filterValue, headlessMode, color, callback) => {
  console.log('run tests', root, filterValue, headlessMode, color, callback)
  Logger.log(`[test-coordinator] start running tests`)
  const start = Time.now()
  // TODO pass process cwd as parameter
  const cwd = process.cwd()
  const formattedPaths = await GetTestToRun.getTestsToRun(root, cwd, filterValue)
  const total = formattedPaths.length
  if (total === 0) {
    return callback(JsonRpcEvent.create(TestWorkerEventType.AllTestsFinished, [0, 0, 0, 0, 0, filterValue]))
  }
  const state = {
    passed: 0,
    failed: 0,
    skipped: 0,
    total,
  }
  const first = formattedPaths[0]
  const { absolutePath, relativePath, relativeDirname, dirent } = first
  callback(JsonRpcEvent.create(TestWorkerEventType.TestRunning, [absolutePath, relativeDirname, dirent]))
  const initialStart = Time.now()
  try {
    if (!child) {
      const context = await LaunchVsCode.launchVsCode({
        headlessMode,
      })
      child = context.child
      webSocketUrl = context.webSocketUrl
    }
    console.log('launched vscode')
  } catch (error) {
    const prettyError = await PrettyError.prepare(error, { root, color })
    callback(JsonRpcEvent.create(TestWorkerEventType.TestFailed, [absolutePath, relativeDirname, relativePath, first, prettyError]))
    state.failed++
  }
  const end = Time.now()
  const duration = end - start
  callback(
    JsonRpcEvent.create(TestWorkerEventType.AllTestsFinished, [
      state.passed,
      state.failed,
      state.skipped,
      state.total,
      duration,
      filterValue,
    ]),
  )
  Logger.log(`[test-coordinator] finished running tests`)
  // CleanUpTestState.cleanUpTestState()
  // LaunchElectron.cleanup()
}
