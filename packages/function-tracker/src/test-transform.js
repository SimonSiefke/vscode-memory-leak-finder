import { transformCode } from './transform-script.js'

// Test code with various function types
const testCode = `
function testFunction() {
  return 'test'
}

const arrowFunction = () => {
  return 'arrow'
}

const conciseArrow = x => x * 2

const objectLiteral = {
  method() {
    return 'method'
  },
  
  arrowMethod: () => 'arrow method'
}

class TestClass {
  constructor() {
    this.value = 42
  }
  
  classMethod() {
    return this.value
  }
}
`

console.log('Original code:')
console.log(testCode)
console.log('\n' + '='.repeat(50) + '\n')

const transformedCode = transformCode(testCode, 'test.js')

console.log('Transformed code:')
console.log(transformedCode)

// Test that the tracking functions are properly added
console.log('\n' + '='.repeat(50) + '\n')
console.log('Testing tracking functionality...')

// Create a mock globalThis for testing
globalThis.___functionStatistics = new Map()

// Execute the transformed code in a safe way
try {
  // Use Function constructor to create a proper scope
  const executeCode = new Function(transformedCode + `
    return {
      testFunction,
      arrowFunction,
      conciseArrow,
      objectLiteral,
      TestClass
    };
  `)
  
  const { testFunction, arrowFunction, conciseArrow, objectLiteral, TestClass } = executeCode()
  
  console.log('Transformed code executed successfully')
  console.log('Function statistics before calls:', Object.fromEntries(globalThis.___functionStatistics))
  
  // Now call the functions to test tracking
  testFunction()
  arrowFunction()
  conciseArrow(5)
  objectLiteral.method()
  objectLiteral.arrowMethod()
  
  const testInstance = new TestClass()
  testInstance.classMethod()
  
  console.log('Function statistics after calls:', Object.fromEntries(globalThis.___functionStatistics))
  
  // Test the tracking functions
  if (typeof globalThis.getFunctionStatistics === 'function') {
    const stats = globalThis.getFunctionStatistics()
    console.log('Retrieved statistics:', stats)
  }
  
} catch (error) {
  console.error('Error executing transformed code:', error)
}
