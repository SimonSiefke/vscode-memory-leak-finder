import { test, expect } from '@jest/globals'
import { transformCode } from '../src/parts/TransformScript/TransformScript.js'

// Simple test to verify basic functionality
test('Simple Test - should transform basic function', () => {
  console.log('Testing transformCode function...')

  const testCode = `
function testFunction() {
  return 'test'
}

const arrowFunction = () => {
  return 'arrow'
}
`

  const transformed = transformCode(testCode, 'simple-test.js')

  expect(transformed).toContain('trackFunctionCall("testFunction", "simple-test.js:2")')
  expect(transformed).toContain('function testFunction()')
  expect(transformed).toContain('globalThis.___functionStatistics')

  console.log('✓ Basic transformation test passed')
})
