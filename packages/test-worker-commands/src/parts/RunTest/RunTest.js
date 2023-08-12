import * as ImportTest from '../ImportTest/ImportTest.js'
import * as JsonRpcEvent from '../JsonRpcEvent/JsonRpcEvent.js'
import * as PrettyError from '../PrettyError/PrettyError.js'
import * as TestStage from '../TestStage/TestStage.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'
import * as Time from '../Time/Time.js'
import * as MemoryLeakFinder from '../../../../memory-leak-finder/src/index.js'
import { mkdir, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import * as Root from '../Root/Root.js'

export const runTest = async (
  state,
  context,
  file,
  relativeDirName,
  relativeFilePath,
  fileName,
  root,
  headlessMode,
  color,
  pageObject,
  start,
  callback,
) => {
  try {
    const module = await ImportTest.importTest(start, file)
    if (module.skip) {
      const end = Time.now()
      const duration = end - start
      callback(JsonRpcEvent.create(TestWorkerEventType.TestSkipped, [file, relativeDirName, fileName, duration]))
      state.skipped++
      return
    }
    const session = context.firstWindow.rpc
    const measure = MemoryLeakFinder.combine(MemoryLeakFinder.Measures.MeasureEventListeners.create(session))
    await TestStage.beforeSetup(module, pageObject)
    await TestStage.setup(module, pageObject)
    const before = await measure.start()
    await TestStage.run(module, pageObject)
    const after = await measure.stop()
    const result = measure.compare(before, after)
    const end = Time.now()
    const duration = end - start
    callback(JsonRpcEvent.create(TestWorkerEventType.TestPassed, [file, relativeDirName, fileName, duration, result]))
    state.passed++
    const resultPath = join(Root.root, '.vscode-memory-leak-finder-results', 'results.json')
    await mkdir(dirname(resultPath), { recursive: true })
    await writeFile(resultPath, JSON.stringify(result, null, 2))
  } catch (error) {
    const prettyError = await PrettyError.prepare(error, { root, color })
    callback(JsonRpcEvent.create(TestWorkerEventType.TestFailed, [file, relativeDirName, relativeFilePath, fileName, prettyError]))
    state.failed++
  } finally {
    // CleanUpTestState.cleanUpTestState()
    // LaunchElectron.cleanup()
  }
}
