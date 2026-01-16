/// <reference types="jest" />
import { transformCode } from '../src/transform-script.js'

// Simple test to verify basic functionality
test('Simple test - transformCode function should work correctly', async () => {
  console.log('Testing transformCode function...')

  const testCode = `
function testFunction() {
  return 'test'
}

const arrowFunction = () => {
  return 'arrow'
}
`

  const transformed = await transformCode(testCode, { filename: 'simple-test.js' })
  
  expect(transformed).toContain('trackFunctionCall("testFunction", "simple-test.js:2")')
  expect(transformed).toContain('function testFunction()')
  expect(transformed).toContain('globalThis.___functionStatistics')
  
  // Test execution
  const executeCode = new Function(transformed + `
    return {
      testFunction,
      arrowFunction
    };
  `)
  
  const { testFunction, arrowFunction } = executeCode()
  
  // Call functions
  testFunction()
  arrowFunction()
  
  // Verify statistics are working
  expect(typeof globalThis.getFunctionStatistics).toBe('function')
  expect(typeof globalThis.___functionStatistics).toBe('object')
  
  console.log('✓ Basic transformation test passed')
})
