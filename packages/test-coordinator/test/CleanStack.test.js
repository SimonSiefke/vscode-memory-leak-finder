import * as CleanStack from '../src/parts/CleanStack/CleanStack.js'
import { test, expect } from '@jest/globals'

test('cleanStack - show internal errors', async () => {
  const stack = `DevtoolsProtocolError: uniqueContextId not found
    at Module.evaluate (/test/packages/test-worker/src/parts/DevtoolsProtocolRuntime/DevtoolsProtocolRuntime.js:13:11)
    at async toHaveText (/test/packages/test-worker/src/parts/ExpectLocatorToHaveText/ExpectLocatorToHaveText.js:14:16)
    at async Module.test (/test/packages/e2e/src/sample.hello-world.js:15:3)
    at async Module.runTest (/test/packages/test-worker/src/parts/RunTest/RunTest.js:22:5)
    at async runTests (/test/packages/test-worker/src/parts/RunTests/RunTests.js:30:5)`
  expect(await CleanStack.cleanStack(stack))
    .toBe(`    at evaluate (/test/packages/test-worker/src/parts/DevtoolsProtocolRuntime/DevtoolsProtocolRuntime.js:13:11)
    at async toHaveText (/test/packages/test-worker/src/parts/ExpectLocatorToHaveText/ExpectLocatorToHaveText.js:14:16)
    at async test (/test/packages/e2e/src/sample.hello-world.js:15:3)
    at async runTest (/test/packages/test-worker/src/parts/RunTest/RunTest.js:22:5)
    at async runTests (/test/packages/test-worker/src/parts/RunTests/RunTests.js:30:5)`)
})

test('cleanStack - remove module prefix', async () => {
  const stack = `TypeError: result.filter is not a function
    at Module.removePlaywrightListeners (/test/packages/memory-leak-finder/src/parts/RemovePlaywrightListeners/RemovePlaywrightListeners.js:9:17)
    at Module.start (/test/packages/memory-leak-finder/src/parts/MeasureEventListeners/MeasureEventListeners.js:23:68)
    at async Object.start (/test/packages/memory-leak-finder/src/parts/MeasureCombined/MeasureCombined.js:5:31)
    at async Module.runTest (/test/packages/test-worker-commands/src/parts/RunTest/RunTest.js:39:20)
    at async runTests (/test/packages/test-worker-commands/src/parts/RunTests/RunTests.js:72:7)`
  expect(await CleanStack.cleanStack(stack))
    .toBe(`    at removePlaywrightListeners (/test/packages/memory-leak-finder/src/parts/RemovePlaywrightListeners/RemovePlaywrightListeners.js:9:17)
    at start (/test/packages/memory-leak-finder/src/parts/MeasureEventListeners/MeasureEventListeners.js:23:68)
    at async start (/test/packages/memory-leak-finder/src/parts/MeasureCombined/MeasureCombined.js:5:31)
    at async runTest (/test/packages/test-worker-commands/src/parts/RunTest/RunTest.js:39:20)
    at async runTests (/test/packages/test-worker-commands/src/parts/RunTests/RunTests.js:72:7)`)
})

test('cleanStack - remove object prefix', async () => {
  const stack = `TypeError: before is not iterable
    at Object.compare (../memory-leak-finder/src/parts/MeasureEventListeners/MeasureEventListeners.js:34:26)
    at Object.compare (../memory-leak-finder/src/parts/MeasureCombined/MeasureCombined.js:23:39)
    at compare (../memory-leak-worker/src/parts/MemoryLeakFinderCompare/MemoryLeakFinderCompare.js:8:18)
    at execute (../memory-leak-worker/src/parts/Command/Command.js:9:10)
    at getResponse (../memory-leak-worker/src/parts/GetResponse/GetResponse.js:6:26)
    at handleJsonRpcMessage (../memory-leak-worker/src/parts/HandleJsonRpcMessage/HandleJsonRpcMessage.js:8:38)
    at MessagePort.handleMessage (../memory-leak-worker/src/parts/HandleIpc/HandleIpc.js:5:33)
    at restoreJsonRpcError (../test-coordinator/src/parts/RestoreJsonRpcError/RestoreJsonRpcError.js:53:68)
    at unwrapJsonRpcResult (../test-coordinator/src/parts/UnwrapJsonRpcResult/UnwrapJsonRpcResult.js:6:47)
    at async runTests (../test-coordinator/src/parts/RunTestsWithCallback/RunTestsWithCallback.js:62:28)
    at async getResponse (../test-coordinator/src/parts/GetResponse/GetResponse.js:6:20)
    at async handleJsonRpcMessage (../test-coordinator/src/parts/HandleJsonRpcMessage/HandleJsonRpcMessage.js:8:20)`
  expect(await CleanStack.cleanStack(stack))
    .toBe(`    at compare (../memory-leak-finder/src/parts/MeasureEventListeners/MeasureEventListeners.js:34:26)
    at compare (../memory-leak-finder/src/parts/MeasureCombined/MeasureCombined.js:23:39)
    at compare (../memory-leak-worker/src/parts/MemoryLeakFinderCompare/MemoryLeakFinderCompare.js:8:18)
    at execute (../memory-leak-worker/src/parts/Command/Command.js:9:10)
    at getResponse (../memory-leak-worker/src/parts/GetResponse/GetResponse.js:6:26)
    at handleJsonRpcMessage (../memory-leak-worker/src/parts/HandleJsonRpcMessage/HandleJsonRpcMessage.js:8:38)
    at MessagePort.handleMessage (../memory-leak-worker/src/parts/HandleIpc/HandleIpc.js:5:33)
    at async runTests (../test-coordinator/src/parts/RunTestsWithCallback/RunTestsWithCallback.js:62:28)
    at async getResponse (../test-coordinator/src/parts/GetResponse/GetResponse.js:6:20)`)
})

test('cleanStack - remove jsonrpc lines', async () => {
  const stack = ` Failed to search for @builtin html : DevtoolsProtocolError: AssertionError: expected .extensions-viewlet .inputarea to be focused but active element is .editor-group-container active empty
    at checkSingleElementCondition (../../<anonymous>:1104:9)
    at async evaluateInUtilityContext (../test-worker-commands/src/parts/EvaluateInUtilityContext/EvaluateInUtilityContext.js:14:18)
    at async checkSingleElementCondition (../test-worker-commands/src/parts/ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.js:4:3)
    at async search (../page-object/src/parts/Extensions/Extensions.js:15:9)
    at async setup (src/sample.extension-context-menu.js:5:3)
    at async setup (../test-worker-commands/src/parts/TestStage/TestStage.js:9:5)
    at async setupTestWithCallback (../test-worker-commands/src/parts/SetupTestWithCallback/SetupTestWithCallback.js:10:3)
    at async setupTest (../test-worker-commands/src/parts/SetupTest/SetupTest.js:9:19)
    at restoreJsonRpcError (../test-coordinator/src/parts/RestoreJsonRpcError/RestoreJsonRpcError.js:53:68)
    at unwrapJsonRpcResult (../test-coordinator/src/parts/UnwrapJsonRpcResult/UnwrapJsonRpcResult.js:6:47)
    at invoke (../test-coordinator/src/parts/JsonRpc/JsonRpc.js:14:38)
    at async runTests (../test-coordinator/src/parts/RunTestsWithCallback/RunTestsWithCallback.js:59:29)
    at async getResponse (../test-coordinator/src/parts/GetResponse/GetResponse.js:6:20)
    at async handleJsonRpcMessage (../test-coordinator/src/parts/HandleJsonRpcMessage/HandleJsonRpcMessage.js:8:20)`
  expect(await CleanStack.cleanStack(stack)).toBe(`    at checkSingleElementCondition (../../<anonymous>:1104:9)
    at async evaluateInUtilityContext (../test-worker-commands/src/parts/EvaluateInUtilityContext/EvaluateInUtilityContext.js:14:18)
    at async checkSingleElementCondition (../test-worker-commands/src/parts/ExpectLocatorSingleElementCondition/ExpectLocatorSingleElementCondition.js:4:3)
    at async search (../page-object/src/parts/Extensions/Extensions.js:15:9)
    at async setup (src/sample.extension-context-menu.js:5:3)
    at async setup (../test-worker-commands/src/parts/TestStage/TestStage.js:9:5)
    at async setupTestWithCallback (../test-worker-commands/src/parts/SetupTestWithCallback/SetupTestWithCallback.js:10:3)
    at async setupTest (../test-worker-commands/src/parts/SetupTest/SetupTest.js:9:19)
    at async runTests (../test-coordinator/src/parts/RunTestsWithCallback/RunTestsWithCallback.js:59:29)
    at async getResponse (../test-coordinator/src/parts/GetResponse/GetResponse.js:6:20)`)
})
