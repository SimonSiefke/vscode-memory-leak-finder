import { test, expect } from '@jest/globals'
import { transformCodeWithTracking } from '../src/parts/TransformCodeWithTracking/TransformCodeWithTracking.js'

test('should transform class methods and constructors', async () => {
    const code = `
    class TestClass {
      constructor() {
        console.log('constructor')
      }

      method() {
        console.log('method')
      }
    }
  `

    const transformed = await transformCodeWithTracking(code, {
        filename: 'test-class.js'
    })

    // Should track constructor
    expect(transformed).toContain('trackFunctionCall("TestClass.constructor", "test-class.js:3")')

    // Should track method
    expect(transformed).toContain('trackFunctionCall("TestClass.method", "test-class.js:7")')
})
