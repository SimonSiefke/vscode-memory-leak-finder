import * as FileSystem from '../FileSystem/FileSystem.js'
import * as Path from '../Path/Path.js'
import * as RunTest from '../RunTest/RunTest.js'
import * as JsonRpcEvent from '../JsonRpcEvent/JsonRpcEvent.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'

const getMatchingFiles = (dirents, filterValue) => {
  const matchingFiles = []
  for (const dirent of dirents) {
    if (dirent.includes(filterValue)) {
      matchingFiles.push(dirent)
    }
  }
  return matchingFiles
}

export const runTests = async (root, filterValue, headlessMode, color, callback) => {
  const start = performance.now()
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
  for (const dirent of matchingDirents) {
    const absolutePath = Path.join(testsPath, dirent)
    const relativePath = Path.relative(process.cwd(), absolutePath)
    const relativeDirname = Path.dirname(relativePath)
    await RunTest.runTest(state, absolutePath, relativeDirname, relativePath, dirent, root, headlessMode, color, callback)
  }
  const end = performance.now()
  const duration = end - start
  callback(
    JsonRpcEvent.create(TestWorkerEventType.AllTestsFinished, [
      state.passed,
      state.failed,
      state.skipped,
      state.total,
      duration,
      filterValue,
    ])
  )
}
