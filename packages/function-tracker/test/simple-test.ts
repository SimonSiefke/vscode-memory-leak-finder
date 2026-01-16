import { transformCode } from '../src/transform-script.js'

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

async function runTest() {
  try {
    const transformed = await transformCode(testCode, { filename: 'test.js' })
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
    
    console.log('Before calls - Statistics:', Object.fromEntries(globalThis.___functionStatistics || new Map()))
    
    testFunction()
    arrowFunction()
    
    console.log('After calls - Statistics:', Object.fromEntries(globalThis.___functionStatistics || new Map()))
    
    if (typeof globalThis.getFunctionStatistics === 'function') {
      const stats = globalThis.getFunctionStatistics()
      console.log('Final statistics:', stats)
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

runTest()
