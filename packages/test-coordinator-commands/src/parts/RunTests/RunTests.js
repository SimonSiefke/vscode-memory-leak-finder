import * as FileSystem from '../FileSystem/FileSystem.js'
import * as JsonRpcEvent from '../JsonRpcEvent/JsonRpcEvent.js'
import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.js'
import * as Logger from '../Logger/Logger.js'
import * as Path from '../Path/Path.js'
import * as PrettyError from '../PrettyError/PrettyError.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'
import * as Time from '../Time/Time.js'

const getMatchingFiles = (dirents, filterValue) => {
  const matchingFiles = []
  for (const dirent of dirents) {
    if (dirent.includes(filterValue)) {
      matchingFiles.push(dirent)
    }
  }
  return matchingFiles
}

let child
let webSocketUrl

// 1. get matching files
// 2. launch vscode
// 3. get websocket url
// 4. launch test worker
// 5. pass websocket url to test worker and wait for connection
// 6. pass matching files to test worker
export const runTests = async (root, filterValue, headlessMode, color, callback) => {
  Logger.log(`[test-coordinator] start running tests`)
  const start = Time.now()
  const testsPath = Path.join(root, 'src')
  const testDirents = await FileSystem.readDir(testsPath)
  const matchingDirents = getMatchingFiles(testDirents, filterValue)
  const total = matchingDirents.length
  const state = {
    passed: 0,
    failed: 0,
    skipped: 0,
    total,
  }
  callback(JsonRpcEvent.create(TestWorkerEventType.TestsStarting, [total]))
  outer: if (total > 0) {
    const first = matchingDirents[0]
    const absolutePath = Path.join(testsPath, first)
    const relativePath = Path.relative(process.cwd(), absolutePath)
    const relativeDirname = Path.dirname(relativePath)
    callback(JsonRpcEvent.create(TestWorkerEventType.TestRunning, [absolutePath, relativeDirname, first]))

    const initialStart = Time.now()
    try {
      console.log('launching vscode')
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
      break outer
    }
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
