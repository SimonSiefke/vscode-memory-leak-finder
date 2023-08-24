import * as ImportTest from '../ImportTest/ImportTest.js'
import * as PrettyError from '../PrettyError/PrettyError.js'
import * as TestStage from '../TestStage/TestStage.js'
import * as TestWorkerEventType from '../TestWorkerEventType/TestWorkerEventType.js'

export const runTestWithCallback = async (pageObject, file, root, color, callback) => {
  try {
    const module = await ImportTest.importTest(file)
    if (module.skip) {
      return {
        method: TestWorkerEventType.TestSkipped,
      }
    }
    await TestStage.beforeSetup(module, pageObject)
    await TestStage.setup(module, pageObject)
    await TestStage.run(module, pageObject)
    return {
      method: TestWorkerEventType.TestPassed,
    }
  } catch (error) {
    const prettyError = await PrettyError.prepare(error, { root, color })
    return {
      method: TestWorkerEventType.TestFailed,
      params: [prettyError],
    }
  } finally {
  }
}
