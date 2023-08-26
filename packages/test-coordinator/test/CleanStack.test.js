import * as CleanStack from '../src/parts/CleanStack/CleanStack.js'

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
