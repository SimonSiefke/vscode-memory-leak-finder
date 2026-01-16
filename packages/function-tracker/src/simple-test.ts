import { transformCode } from './transform.js'

// Simple test to verify basic functionality
console.log('Testing transformCode function...')

const testCode = `
function testFunction() {
  return 'test'
}

const arrowFunction = () => {
  return 'arrow'
}
`

try {
  const transformed = transformCode(testCode, { filename: 'test.js' })
  console.log('Transformation successful!')
  console.log('Original code length:', testCode.length)
  console.log('Transformed code length:', transformed.length)
  console.log('Contains tracking code:', transformed.includes('trackFunctionCall'))
  console.log('Contains statistics map:', transformed.includes('___functionStatistics'))
  
  // Test execution
  const executeCode = new Function(transformed + `
    return {
      testFunction,
      arrowFunction
    };
  `)
  
  const { testFunction, arrowFunction } = executeCode()
  
  console.log('Before calls - Statistics:', Object.fromEntries((globalThis as any).___functionStatistics || new Map()))
  
  testFunction()
  arrowFunction()
  
  console.log('After calls - Statistics:', Object.fromEntries((globalThis as any).___functionStatistics || new Map()))
  
  if (typeof (globalThis as any).getFunctionStatistics === 'function') {
    const stats = (globalThis as any).getFunctionStatistics()
    console.log('Final statistics:', stats)
  }
  
} catch (error) {
  console.error('Test failed:', error)
}
