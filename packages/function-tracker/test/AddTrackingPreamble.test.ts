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
  expect(result.includes('globalThis.___functionStatistics')).toBe(true)
  expect(result.includes('trackFunctionCall')).toBe(true)
  expect(result.includes('getFunctionStatistics')).toBe(true)
  expect(result.includes('resetFunctionStatistics')).toBe(true)
  
  // Should contain original function
  expect(result.includes('function testFunction()')).toBe(true)
  expect(result.includes("return 'test'")).toBe(true)
})

test('AddTrackingPreamble - should add tracking preamble to arrow function', async () => {
  const code = `
    const arrowFunction = () => {
      return 'arrow'
    }
  `

  const result = await addTrackingPreamble(code)
  
  expect(result.includes('globalThis.___functionStatistics')).toBe(true)
  expect(result.includes('const arrowFunction = () =>')).toBe(true)
})

test('AddTrackingPreamble - should handle empty code', async () => {
  const code = ''
  const result = await addTrackingPreamble(code)
  
  expect(result.includes('globalThis.___functionStatistics')).toBe(true)
  expect(result.includes('trackFunctionCall')).toBe(true)
})

test('AddTrackingPreamble - should handle TypeScript code', async () => {
  const code = `
    function typedFunction(param: string): number {
      return param.length
    }
  `

  const result = await addTrackingPreamble(code)
  
  expect(result.includes('globalThis.___functionStatistics')).toBe(true)
  expect(result.includes('function typedFunction(param: string): number')).toBe(true)
})

test('AddTrackingPreamble - should handle JSX code', async () => {
  const code = `
    function Component() {
      return <div>Hello</div>
    }
  `

  const result = await addTrackingPreamble(code)
  
  expect(result.includes('globalThis.___functionStatistics')).toBe(true)
  expect(result.includes('function Component()')).toBe(true)
  expect(result.includes('<div>Hello</div>')).toBe(true)
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
  expect(result.startsWith('// Function call tracking system')).toBe(true)
  
  // Should preserve original code structure
  expect(result.includes('// Original comment')).toBe(true)
  expect(result.includes('const constant = 42')).toBe(true)
  expect(result.includes('function calculate(x: number, y: number): number')).toBe(true)
  expect(result.includes('export { calculate }')).toBe(true)
})
