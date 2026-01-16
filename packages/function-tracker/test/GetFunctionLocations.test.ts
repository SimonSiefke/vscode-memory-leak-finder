import { test, expect } from '@jest/globals'
import parser from '@babel/parser'
import { getFunctionLocations } from '../src/parts/GetFunctionLocations/GetFunctionLocations.js'

// @ts-ignore
const parser2 = (parser.default || parser) as typeof import('@babel/parser')

test('GetFunctionLocations - should collect function declarations', () => {
  const code = `
    function testFunction() {
      return 'test'
    }
    
    function anotherFunction() {
      return 'another'
    }
  `
  
  const ast = parser2.parse(code, {
    sourceType: 'module',
    plugins: [],
  })
  
  const locations = getFunctionLocations(ast)
  
  expect(locations.size).toBe(2)
  
  const locationArray = Array.from(locations.values())
  expect(locationArray).toContainEqual({ line: 2, column: 4 })
  expect(locationArray).toContainEqual({ line: 6, column: 4 })
})

test('GetFunctionLocations - should collect function expressions', () => {
  const code = `
    const funcExpression = function() {
      return 'expression'
    }
    
    const namedExpression = function namedFunc() {
      return 'named'
    }
  `
  
  const ast = parser2.parse(code, {
    sourceType: 'module',
    plugins: [],
  })
  
  const locations = getFunctionLocations(ast)
  
  expect(locations.size).toBe(2)
  
  const locationArray = Array.from(locations.values())
  expect(locationArray).toContainEqual({ line: 2, column: 27 })
  expect(locationArray).toContainEqual({ line: 6, column: 28 })
})

test('GetFunctionLocations - should collect arrow functions', () => {
  const code = `
    const arrowFunction = () => {
      return 'arrow'
    }
    
    const conciseArrow = x => x * 2
    
    const asyncArrow = async () => {
      return await Promise.resolve('async')
    }
  `
  
  const ast = parser2.parse(code, {
    sourceType: 'module',
    plugins: [],
  })
  
  const locations = getFunctionLocations(ast)
  
  expect(locations.size).toBe(3)
  
  const locationArray = Array.from(locations.values())
  expect(locationArray).toContainEqual({ line: 2, column: 26 })
  expect(locationArray).toContainEqual({ line: 6, column: 25 })
  expect(locationArray).toContainEqual({ line: 8, column: 23 })
})

test('GetFunctionLocations - should collect object methods', () => {
  const code = `
    const obj = {
      method() {
        return 'method'
      },
      
      arrowMethod: () => 'arrow method',
      
      computedMethod() {
        return 'computed'
      }
    }
  `
  
  const ast = parser2.parse(code, {
    sourceType: 'module',
    plugins: [],
  })
  
  const locations = getFunctionLocations(ast)
  
  expect(locations.size).toBe(3)
  
  const locationArray = Array.from(locations.values())
  expect(locationArray).toContainEqual({ line: 3, column: 6 })
  expect(locationArray).toContainEqual({ line: 7, column: 19 })
  expect(locationArray).toContainEqual({ line: 9, column: 6 })
})

test('GetFunctionLocations - should collect class methods', () => {
  const code = `
    class TestClass {
      constructor() {
        this.value = 42
      }
      
      classMethod() {
        return this.value
      }
      
      static staticMethod() {
        return 'static'
      }
      
      async asyncMethod() {
        return await Promise.resolve()
      }
      
      *generatorMethod() {
        yield 1
      }
    }
  `
  
  const ast = parser2.parse(code, {
    sourceType: 'module',
    plugins: [],
  })
  
  const locations = getFunctionLocations(ast)
  
  expect(locations.size).toBe(5) // constructor + 4 methods
  
  const locationArray = Array.from(locations.values())
  expect(locationArray).toContainEqual({ line: 3, column: 6 }) // constructor
  expect(locationArray).toContainEqual({ line: 7, column: 6 }) // classMethod
  expect(locationArray).toContainEqual({ line: 11, column: 6 }) // staticMethod
  expect(locationArray).toContainEqual({ line: 15, column: 6 }) // asyncMethod
  expect(locationArray).toContainEqual({ line: 19, column: 6 }) // generatorMethod
})

test('GetFunctionLocations - should handle nested functions', () => {
  const code = `
    function outerFunction() {
      function innerFunction() {
        return 'inner'
      }
      
      const innerArrow = () => {
        return 'inner arrow'
      }
      
      return innerFunction()
    }
  `
  
  const ast = parser2.parse(code, {
    sourceType: 'module',
    plugins: [],
  })
  
  const locations = getFunctionLocations(ast)
  
  expect(locations.size).toBe(3)
  
  const locationArray = Array.from(locations.values())
  expect(locationArray).toContainEqual({ line: 2, column: 4 }) // outerFunction
  expect(locationArray).toContainEqual({ line: 3, column: 6 }) // innerFunction
  expect(locationArray).toContainEqual({ line: 7, column: 25 }) // innerArrow
})

test('GetFunctionLocations - should handle functions as parameters', () => {
  const code = `
    setTimeout(function() {
      console.log('timeout callback')
    }, 1000)
    
    [1, 2, 3].map(function(item) {
      return item * 2
    })
    
    [4, 5, 6].filter(item => item > 4)
  `
  
  const ast = parser2.parse(code, {
    sourceType: 'module',
    plugins: [],
  })
  
  const locations = getFunctionLocations(ast)
  
  expect(locations.size).toBe(3)
  
  const locationArray = Array.from(locations.values())
  expect(locationArray).toContainEqual({ line: 2, column: 15 }) // setTimeout callback
  expect(locationArray).toContainEqual({ line: 6, column: 18 }) // map callback
  expect(locationArray).toContainEqual({ line: 10, column: 21 }) // filter callback
})

test('GetFunctionLocations - should handle complex parameter patterns', () => {
  const code = `
    function defaultParams(x = 10, y = 'default') {
      return x + y
    }
    
    function restParams(first, ...rest) {
      return rest.length
    }
    
    function destructuredParams({ a, b }, [c, d]) {
      return a + b + c + d
    }
  `
  
  const ast = parser2.parse(code, {
    sourceType: 'module',
    plugins: [],
  })
  
  const locations = getFunctionLocations(ast)
  
  expect(locations.size).toBe(3)
  
  const locationArray = Array.from(locations.values())
  expect(locationArray).toContainEqual({ line: 2, column: 4 }) // defaultParams
  expect(locationArray).toContainEqual({ line: 6, column: 4 }) // restParams
  expect(locationArray).toContainEqual({ line: 10, column: 4 }) // destructuredParams
})

test('GetFunctionLocations - should handle empty code', () => {
  const code = ''
  
  const ast = parser2.parse(code, {
    sourceType: 'module',
    plugins: [],
  })
  
  const locations = getFunctionLocations(ast)
  
  expect(locations.size).toBe(0)
})

test('GetFunctionLocations - should handle code with no functions', () => {
  const code = `
    const x = 42
    const y = 'hello'
    console.log(x, y)
  `
  
  const ast = parser2.parse(code, {
    sourceType: 'module',
    plugins: [],
  })
  
  const locations = getFunctionLocations(ast)
  
  expect(locations.size).toBe(0)
})

test('GetFunctionLocations - should handle functions with Unicode and special characters', () => {
  const code = `
    function 测试函数() {
      return 'Unicode test 🚀'
    }
    
    function special$Chars$_123() {
      return 'special chars'
    }
  `
  
  const ast = parser2.parse(code, {
    sourceType: 'module',
    plugins: [],
  })
  
  const locations = getFunctionLocations(ast)
  
  expect(locations.size).toBe(2)
  
  const locationArray = Array.from(locations.values())
  expect(locationArray).toContainEqual({ line: 2, column: 4 }) // Unicode function
  expect(locationArray).toContainEqual({ line: 6, column: 4 }) // special chars function
})
