import * as CleanUpTestState from '../CleanUpTestState/CleanUpTestState.js'
import * as FileSystem from '../FileSystem/FileSystem.js'
import * as JsonRpcEvent from '../JsonRpcEvent/JsonRpcEvent.js'
import * as LaunchElectron from '../LaunchElectron/LaunchElectron.js'
import * as LaunchVsCode from '../LaunchVsCode/LaunchVsCode.js'
import * as Path from '../Path/Path.js'
import * as PrettyError from '../PrettyError/PrettyError.js'
import * as RunTest from '../RunTest/RunTest.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'
import * as Time from '../Time/Time.js'
import * as Logger from '../Logger/Logger.js'

const getMatchingFiles = (dirents, filterValue) => {
  const matchingFiles = []
  for (const dirent of dirents) {
    if (dirent.includes(filterValue)) {
      matchingFiles.push(dirent)
    }
  }
  return matchingFiles
}

let context
let pageObject
let firstWindow

export const runTests = async (root, filterValue, headlessMode, color, callback) => {
  Logger.log(`[test-worker] start running tests`)
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
      if (!context) {
        context = await LaunchVsCode.launchVsCode({
          headlessMode,
        })
        pageObject = context.pageObject
        firstWindow = context.firstWindow
      }
    } catch (error) {
      const prettyError = await PrettyError.prepare(error, { root, color })
      callback(JsonRpcEvent.create(TestWorkerEventType.TestFailed, [absolutePath, relativeDirname, relativePath, first, prettyError]))
      state.failed++
      break outer
    }
    for (let i = 0; i < total; i++) {
      const dirent = matchingDirents[i]
      const absolutePath = Path.join(testsPath, dirent)
      const relativePath = Path.relative(process.cwd(), absolutePath)
      const relativeDirname = Path.dirname(relativePath)
      if (i !== 0) {
        callback(JsonRpcEvent.create(TestWorkerEventType.TestRunning, [absolutePath, relativeDirname, dirent]))
      }
      const start = i === 0 ? initialStart : Time.now()
      await RunTest.runTest(
        state,
        absolutePath,
        relativeDirname,
        relativePath,
        dirent,
        root,
        headlessMode,
        color,
        pageObject,
        start,
        callback,
      )
      // TODO only reload when leak is found
      // if (i !== total - 1) {
      //   await firstWindow.reload()
      // }
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
  Logger.log(`[test-worker] finished running tests`)
  // CleanUpTestState.cleanUpTestState()
  // LaunchElectron.cleanup()
}
