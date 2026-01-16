import { test, expect } from '@jest/globals'
import { addTrackingPreamble } from '../src/parts/AddTrackingPreamble/AddTrackingPreamble.js'

test('AddTrackingPreamble - should add tracking preamble to simple function', async () => {
  const code = `
    function testFunction() {
      return 'test'
    }
  `

  const result = await addTrackingPreamble(code)
  
  // Should contain tracking code
  expect(result).toMatch(/globalThis\.___functionStatistics/)
  expect(result).toMatch(/trackFunctionCall/)
  expect(result).toMatch(/getFunctionStatistics/)
  expect(result).toMatch(/resetFunctionStatistics/)
  
  // Should contain original function
  expect(result).toMatch(/function testFunction\(\)/)
  expect(result).toMatch(/return 'test'/)
})

test('AddTrackingPreamble - should add tracking preamble to arrow function', async () => {
  const code = `
    const arrowFunction = () => {
      return 'arrow'
    }
  `

  const result = await addTrackingPreamble(code)
  
  expect(result).toMatch(/globalThis\.___functionStatistics/)
  expect(result).toMatch(/const arrowFunction = \(\) =>/)
})

test('AddTrackingPreamble - should handle empty code', async () => {
  const code = ''
  const result = await addTrackingPreamble(code)
  
  expect(result).toMatch(/globalThis\.___functionStatistics/)
  expect(result).toMatch(/trackFunctionCall/)
})

test('AddTrackingPreamble - should handle TypeScript code', async () => {
  const code = `
    function typedFunction(param: string): number {
      return param.length
    }
  `

  const result = await addTrackingPreamble(code)
  
  expect(result).toMatch(/globalThis\.___functionStatistics/)
  expect(result).toMatch(/function typedFunction\(param: string\): number/)
})

test('AddTrackingPreamble - should handle JSX code', async () => {
  const code = `
    function Component() {
      return <div>Hello</div>
    }
  `

  const result = await addTrackingPreamble(code)
  
  expect(result).toMatch(/globalThis\.___functionStatistics/)
  expect(result).toMatch(/function Component\(\)/)
  expect(result).toMatch(/<div>Hello<\/div>/)
})

test('AddTrackingPreamble - should handle invalid code gracefully', async () => {
  const code = 'invalid javascript syntax {{{'
  const result = await addTrackingPreamble(code)

  expect(result).toBe(code) // Should return original code
})

test('AddTrackingPreamble - should preserve code structure', async () => {
  const code = `
    // Original comment
    const constant = 42
    
    function calculate(x: number, y: number): number {
      return x + y
    }
    
    export { calculate }
  `

  const result = await addTrackingPreamble(code)
  
  // Should have tracking code at the beginning
  expect(result).toMatch(/^\/\/ Function call tracking system/)
  
  // Should preserve original code structure
  expect(result).toMatch(/\/\/ Original comment/)
  expect(result).toMatch(/const constant = 42/)
  expect(result).toMatch(/function calculate\(x: number, y: number\): number/)
  expect(result).toMatch(/export \{ calculate \}/)
})
