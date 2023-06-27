import * as CleanStack from '../src/parts/CleanStack/CleanStack.js'

test('cleanStack - show internal errors', () => {
  const stack = `DevtoolsProtocolError: uniqueContextId not found
    at Module.evaluate (/test/packages/test-worker/src/parts/DevtoolsProtocolRuntime/DevtoolsProtocolRuntime.js:13:11)
    at async toHaveText (/test/packages/test-worker/src/parts/ExpectLocatorToHaveText/ExpectLocatorToHaveText.js:14:16)
    at async Module.test (/test/packages/e2e/src/sample.hello-world.js:15:3)
    at async Module.runTest (/test/packages/test-worker/src/parts/RunTest/RunTest.js:22:5)
    at async runTests (/test/packages/test-worker/src/parts/RunTests/RunTests.js:30:5)`
  expect(CleanStack.cleanStack(stack))
    .toBe(`    at Module.evaluate (/test/packages/test-worker/src/parts/DevtoolsProtocolRuntime/DevtoolsProtocolRuntime.js:13:11)
    at async toHaveText (/test/packages/test-worker/src/parts/ExpectLocatorToHaveText/ExpectLocatorToHaveText.js:14:16)
    at async Module.test (/test/packages/e2e/src/sample.hello-world.js:15:3)
    at async Module.runTest (/test/packages/test-worker/src/parts/RunTest/RunTest.js:22:5)
    at async runTests (/test/packages/test-worker/src/parts/RunTests/RunTests.js:30:5)`)
})
