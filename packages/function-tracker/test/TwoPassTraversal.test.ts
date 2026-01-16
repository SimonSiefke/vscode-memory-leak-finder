import { test, expect } from '@jest/globals'
import { transformCodeWithTracking } from '../src/parts/TransformCodeWithTracking/TransformCodeWithTracking.js'

test('Two-pass traversal - should preserve original locations accurately', () => {
  const code = `
function firstFunction() {
  return 'first'
}

const secondFunction = () => {
  return 'second'
}

class TestClass {
  method() {
    return 'method'
  }
}
`

  const transformed = transformCodeWithTracking(code, { scriptId: 123 })
  
  // The transformed code should contain tracking calls with correct original locations
  expect(transformed).toContain('trackFunctionCall(123, 2, 0)')
  expect(transformed).toContain('trackFunctionCall(123, 6, 25)')
  expect(transformed).toContain('trackFunctionCall(123, 10, 2)')
  
  // Verify the structure is correct
  expect(transformed).toContain('function firstFunction()')
  expect(transformed).toContain('const secondFunction = () =>')
  expect(transformed).toContain('class TestClass')
})

test('Two-pass traversal - should handle nested functions with correct locations', () => {
  const code = `
function outer() {
  function inner() {
    return 'inner'
  }
  return inner
}
`

  const transformed = transformCodeWithTracking(code, { scriptId: 456 })
  
  // Both functions should have their correct original locations
  expect(transformed).toContain('trackFunctionCall(456, 2, 0)')
  expect(transformed).toContain('trackFunctionCall(456, 3, 2)')
})

test('Two-pass traversal - should handle complex expressions with correct locations', () => {
  const code = `
const obj = {
  method() {
    return 'method'
  },
  arrow: () => 'arrow'
}

setTimeout(function() {
  console.log('callback')
}, 1000)
`

  const transformed = transformCodeWithTracking(code, { scriptId: 789 })
  
  // Check that different function types have correct locations
  expect(transformed).toContain('trackFunctionCall(789, 3, 2)') // object method
  expect(transformed).toContain('trackFunctionCall(789, 5, 9)') // object arrow
  expect(transformed).toContain('trackFunctionCall(789, 8, 14)') // setTimeout callback
})
