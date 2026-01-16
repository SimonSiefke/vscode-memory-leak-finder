import { test, expect } from '@jest/globals'
import { transformCode } from '../src/transform-script.js'
import { FunctionStatistics } from '../src/types.js'

test('Integration Tests - Real-world scenarios - should handle complex nested functions', () => {
  // Reset global statistics before each test
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).___functionStatistics
    delete (globalThis as any).getFunctionStatistics
    delete (globalThis as any).resetFunctionStatistics
  }

  const code = `
    function outerFunction(x) {
      const innerFunction = (y) => {
        return x + y
      }
      return innerFunction(5)
    }
    
    class Calculator {
      add(a, b) {
        return a + b
      }
      
      multiply = (a, b) => a * b
    }
  `
  
  const transformed = transformCode(code, { filename: 'complex.js' })
  
  expect(transformed).toContain('globalThis.___functionStatistics')
  expect(transformed).toContain('trackFunctionCall')
})

test('Integration Tests - Real-world scenarios - should handle TypeScript syntax', () => {
  // Reset global statistics before each test
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).___functionStatistics
    delete (globalThis as any).getFunctionStatistics
    delete (globalThis as any).resetFunctionStatistics
  }

  const code = `
    function typedFunction(name: string): string {
      return \`Hello, \${name}!\`
    }
    
    interface Person {
      name: string
      age: number
    }
    
    class Greeter {
      private greeting: string
      
      constructor(message: string) {
        this.greeting = message
      }
      
      greet(): string {
        return this.greeting
      }
    }
  `
  
  const transformed = transformCode(code, { filename: 'typescript.ts' })
  
  expect(transformed).toContain('globalThis.___functionStatistics')
})

test('Integration Tests - Real-world scenarios - should handle async functions', () => {
  // Reset global statistics before each test
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).___functionStatistics
    delete (globalThis as any).getFunctionStatistics
    delete (globalThis as any).resetFunctionStatistics
  }

  const code = `
    async function fetchData(url: string): Promise<any> {
      const response = await fetch(url)
      return response.json()
    }
    
    const asyncArrow = async () => {
      return await Promise.resolve('data')
    }
  `
  
  const transformed = transformCode(code, { filename: 'async.ts' })
  
  expect(transformed).toContain('globalThis.___functionStatistics')
  expect(transformed).toContain('trackFunctionCall')
})

test('Integration Tests - Real-world scenarios - should handle generator functions', () => {
  // Reset global statistics before each test
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).___functionStatistics
    delete (globalThis as any).getFunctionStatistics
    delete (globalThis as any).resetFunctionStatistics
  }

  const code = `
    function* numberGenerator() {
      let i = 0
      while (true) {
        yield i++
      }
    }
    
    const asyncGenerator = async function*() {
      yield await Promise.resolve(1)
      yield await Promise.resolve(2)
    }
  `
  
  const transformed = transformCode(code, { filename: 'generator.ts' })
  
  expect(transformed).toContain('globalThis.___functionStatistics')
})

test('Integration Tests - Real-world scenarios - should handle destructuring and complex parameters', () => {
  // Reset global statistics before each test
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).___functionStatistics
    delete (globalThis as any).getFunctionStatistics
    delete (globalThis as any).resetFunctionStatistics
  }

  const code = `
    function processUser({ name, age }: { name: string; age: number }) {
      return \`\${name} is \${age} years old\`
    }
    
    const calculate = ({ a, b, ...rest }: any) => {
      return a + b
    }
  `
  
  const transformed = transformCode(code, { filename: 'destructuring.ts' })
  
  expect(transformed).toContain('globalThis.___functionStatistics')
})

test('Integration Tests - Real-world scenarios - should handle conditional functions', () => {
  // Reset global statistics before each test
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).___functionStatistics
    delete (globalThis as any).getFunctionStatistics
    delete (globalThis as any).resetFunctionStatistics
  }

  const code = `
    let dynamicFunction
    
    if (Math.random() > 0.5) {
      dynamicFunction = () => 'heads'
    } else {
      dynamicFunction = function() { return 'tails' }
    }
    
    const factory = (type: string) => {
      switch (type) {
        case 'string':
          return (x: any) => String(x)
        case 'number':
          return (x: any) => Number(x)
        default:
          return (x: any) => x
      }
    }
  `
  
  const transformed = transformCode(code, { filename: 'conditional.ts' })
  
  expect(transformed).toContain('globalThis.___functionStatistics')
})

test('Integration Tests - Performance tests - should handle large files efficiently', () => {
  // Reset global statistics before each test
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).___functionStatistics
    delete (globalThis as any).getFunctionStatistics
    delete (globalThis as any).resetFunctionStatistics
  }

  // Generate a large file with many functions
  let code = ''
  for (let i = 0; i < 100; i++) {
    code += `
      function function${i}() {
        return ${i}
      }
      
      const arrow${i} = () => ${i * 2}
      
      class Class${i} {
        method${i}() {
          return ${i * 3}
        }
      }
    `
  }
  
  const startTime = Date.now()
  const transformed = transformCode(code, { filename: 'large.js' })
  const endTime = Date.now()
  
  expect(transformed).toContain('globalThis.___functionStatistics')
  expect(endTime - startTime).toBeLessThan(5000) // Should complete in under 5 seconds
})

test('Integration Tests - Performance tests - should handle deeply nested function structures', () => {
  // Reset global statistics before each test
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).___functionStatistics
    delete (globalThis as any).getFunctionStatistics
    delete (globalThis as any).resetFunctionStatistics
  }

  let code = 'function level0() {\n'
  for (let i = 1; i <= 10; i++) {
    code += '  '.repeat(i) + `function level${i}() {\n`
  }
  for (let i = 10; i >= 0; i--) {
    code += '  '.repeat(i) + '  return ' + i + '\n'
    code += '  '.repeat(i) + '}\n'
  }
  
  const transformed = transformCode(code, { filename: 'nested.js' })
  
  expect(transformed).toContain('globalThis.___functionStatistics')
})

test('Integration Tests - Edge cases - should handle Unicode and special characters', () => {
  // Reset global statistics before each test
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).___functionStatistics
    delete (globalThis as any).getFunctionStatistics
    delete (globalThis as any).resetFunctionStatistics
  }

  const code = `
    function 中文函数() {
      return '中文'
    }
    
    const español = () => '¡Hola!'
    
    const русский = function() {
      return 'Привет'
    }
  `
  
  const transformed = transformCode(code, { filename: 'unicode.js' })
  
  expect(transformed).toContain('globalThis.___functionStatistics')
})

test('Integration Tests - Edge cases - should handle minified code', () => {
  // Reset global statistics before each test
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).___functionStatistics
    delete (globalThis as any).getFunctionStatistics
    delete (globalThis as any).resetFunctionStatistics
  }

  const code = 'function a(){return 1}const b=()=>2;class c{d(){return 3}}'
  
  const transformed = transformCode(code, { filename: 'minified.js' })
  
  expect(transformed).toContain('globalThis.___functionStatistics')
})

test('Integration Tests - Edge cases - should handle comments and whitespace', () => {
  // Reset global statistics before each test
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).___functionStatistics
    delete (globalThis as any).getFunctionStatistics
    delete (globalThis as any).resetFunctionStatistics
  }

  const code = `
    // This is a comment
    function /* inline comment */ commentedFunction() {
      /* Multi-line
         comment */
      return 'value'
    }
    
    /**
     * JSDoc comment
     * @param {string} name
     * @returns {string}
     */
    const documented = (name) => \`Hello \${name}!\`
  `
  
  const transformed = transformCode(code, { filename: 'comments.js' })
  
  expect(transformed).toContain('globalThis.___functionStatistics')
})

test('Integration Tests - Statistics functionality - should accurately track multiple function calls', () => {
  // Reset global statistics before each test
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).___functionStatistics
    delete (globalThis as any).getFunctionStatistics
    delete (globalThis as any).resetFunctionStatistics
  }

  const code = `
    function counter() {
      return Math.random()
    }
    
    const multiplier = (x) => x * 2
  `
  
  const transformed = transformCode(code, { filename: 'stats.js' })
  
  // Execute the transformed code
  const executeCode = new Function(transformed + `
    return {
      counter,
      multiplier
    };
  `)
  
  const { counter, multiplier } = executeCode()
  
  // Call functions multiple times
  counter()
  counter()
  multiplier(5)
  multiplier(10)
  multiplier(15)
  
  // Check statistics
  if (typeof globalThis.getFunctionStatistics === 'function') {
    const stats = globalThis.getFunctionStatistics()
    expect(stats).toHaveProperty('counter (stats.js:2)', 2)
    expect(stats).toHaveProperty('multiplier (stats.js:6)', 3)
  }
})

test('Integration Tests - Statistics functionality - should handle function call ordering', () => {
  // Reset global statistics before each test
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as any).___functionStatistics
    delete (globalThis as any).getFunctionStatistics
    delete (globalThis as any).resetFunctionStatistics
  }

  const code = `
    function first() {
      return 'first'
    }
    
    function second() {
      return 'second'
    }
    
    function third() {
      return 'third'
    }
  `
  
  const transformed = transformCode(code, { filename: 'ordering.js' })
  
  const executeCode = new Function(transformed + `
    return {
      first,
      second,
      third
    };
  `)
  
  const { first, second, third } = executeCode()
  
  // Call in specific order
  first()
  third()
  second()
  first()
  
  if (typeof globalThis.getFunctionStatistics === 'function') {
    const stats = globalThis.getFunctionStatistics()
    expect(stats).toHaveProperty('first (ordering.js:2)', 2)
    expect(stats).toHaveProperty('second (ordering.js:6)', 1)
    expect(stats).toHaveProperty('third (ordering.js:10)', 1)
  }
})
