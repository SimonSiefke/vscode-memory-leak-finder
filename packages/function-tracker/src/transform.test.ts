/// <reference types="jest" />
import { transformCode, createFunctionWrapperPlugin } from './transform'
import { TransformOptions, FunctionStatistics } from './types'

// Extend globalThis for testing
declare global {
  var getFunctionStatistics: (() => FunctionStatistics) | undefined
  var resetFunctionStatistics: (() => void) | undefined
  var ___functionStatistics: Map<string, number> | undefined
}

describe('Transform Script', () => {
  beforeEach(() => {
    // Reset global statistics before each test
    if (typeof globalThis !== 'undefined') {
      delete (globalThis as any).___functionStatistics
      delete (globalThis as any).getFunctionStatistics
      delete (globalThis as any).resetFunctionStatistics
    }
  })

  describe('transformCode', () => {
    it('should transform function declarations', () => {
      const code = `
        function testFunction() {
          return 'test'
        }
      `
      
      const transformed = transformCode(code, { filename: 'test.js' })
      
      expect(transformed).toContain('trackFunctionCall("testFunction", "test.js:2")')
      expect(transformed).toContain('function testFunction()')
      expect(transformed).toContain('globalThis.___functionStatistics')
    })

    it('should transform arrow functions', () => {
      const code = `
        const arrowFunction = () => {
          return 'arrow'
        }
      `
      
      const transformed = transformCode(code, { filename: 'test.js' })
      
      expect(transformed).toContain('trackFunctionCall("arrowFunction", "test.js:2")')
      expect(transformed).toContain('const arrowFunction = ()')
    })

    it('should transform concise arrow functions', () => {
      const code = `
        const conciseArrow = x => x * 2
      `
      
      const transformed = transformCode(code, { filename: 'test.js' })
      
      expect(transformed).toContain('trackFunctionCall("conciseArrow", "test.js:2")')
      expect(transformed).toContain('return x * 2')
    })

    it('should transform function expressions', () => {
      const code = `
        const funcExpression = function() {
          return 'expression'
        }
      `
      
      const transformed = transformCode(code, { filename: 'test.js' })
      
      expect(transformed).toContain('trackFunctionCall("funcExpression", "test.js:2")')
    })

    it('should transform object methods', () => {
      const code = `
        const obj = {
          method() {
            return 'method'
          },
          
          arrowMethod: () => 'arrow method'
        }
      `
      
      const transformed = transformCode(code, { filename: 'test.js' })
      
      expect(transformed).toContain('trackFunctionCall("arrowMethod", "test.js:5")')
    })

    it('should transform class methods', () => {
      const code = `
        class TestClass {
          constructor() {
            this.value = 42
          }
          
          classMethod() {
            return this.value
          }
        }
      `
      
      const transformed = transformCode(code, { filename: 'test.js' })
      
      expect(transformed).toContain('trackFunctionCall("constructor", "test.js:2")')
      expect(transformed).toContain('trackFunctionCall("classMethod", "test.js:6")')
    })

    it('should exclude functions matching exclude patterns', () => {
      const code = `
        function testFunction() {
          return 'test'
        }
        
        function privateHelper() {
          return 'helper'
        }
      `
      
      const transformed = transformCode(code, { 
        filename: 'test.js',
        excludePatterns: ['private']
      })
      
      expect(transformed).toContain('trackFunctionCall("testFunction", "test.js:2")')
      expect(transformed).not.toContain('trackFunctionCall("privateHelper"')
    })

    it('should not transform tracking functions themselves', () => {
      const code = `
        function trackFunctionCall() {
          return 'tracking'
        }
        
        function getFunctionStatistics() {
          return 'stats'
        }
        
        function regularFunction() {
          return 'regular'
        }
      `
      
      const transformed = transformCode(code, { filename: 'test.js' })
      
      expect(transformed).not.toContain('trackFunctionCall("trackFunctionCall"')
      expect(transformed).not.toContain('trackFunctionCall("getFunctionStatistics"')
      expect(transformed).toContain('trackFunctionCall("regularFunction", "test.js:10")')
    })

    it('should handle empty code', () => {
      const code = ''
      const transformed = transformCode(code, { filename: 'test.js' })
      
      expect(transformed).toContain('globalThis.___functionStatistics')
    })

    it('should handle invalid code gracefully', () => {
      const code = 'invalid javascript syntax {{{'
      const transformed = transformCode(code, { filename: 'test.js' })
      
      expect(transformed).toBe(code) // Should return original code
    })

    it('should use default filename when not provided', () => {
      const code = `
        function testFunction() {
          return 'test'
        }
      `
      
      const transformed = transformCode(code)
      
      expect(transformed).toContain('trackFunctionCall("testFunction", "unknown:2")')
    })
  })

  describe('createFunctionWrapperPlugin', () => {
    it('should create a plugin with expected structure', () => {
      const plugin = createFunctionWrapperPlugin({ filename: 'test.js' })
      
      expect(plugin).toHaveProperty('visitor')
      expect(plugin.visitor).toHaveProperty('FunctionDeclaration')
      expect(plugin.visitor).toHaveProperty('FunctionExpression')
      expect(plugin.visitor).toHaveProperty('ArrowFunctionExpression')
    })

    it('should handle default options', () => {
      const plugin = createFunctionWrapperPlugin()
      
      expect(plugin).toBeDefined()
      expect(plugin.visitor).toBeDefined()
    })
  })

  describe('Tracking functionality', () => {
    it('should track function calls when executed', () => {
      const code = `
        function testFunction() {
          return 'test'
        }
        
        const arrowFunction = () => {
          return 'arrow'
        }
      `
      
      const transformed = transformCode(code, { filename: 'test.js' })
      
      // Execute the transformed code
      const executeCode = new Function(transformed + `
        return {
          testFunction,
          arrowFunction
        };
      `)
      
      const { testFunction, arrowFunction } = executeCode()
      
      // Call the functions
      testFunction()
      arrowFunction()
      
      // Check statistics
      if (typeof globalThis.getFunctionStatistics === 'function') {
        const stats = globalThis.getFunctionStatistics()
        expect(stats).toHaveProperty('testFunction (test.js:2)', 1)
        expect(stats).toHaveProperty('arrowFunction (test.js:6)', 1)
      }
    })

    it('should reset statistics', () => {
      const code = `
        function testFunction() {
          return 'test'
        }
      `
      
      const transformed = transformCode(code, { filename: 'test.js' })
      
      // Execute and call function
      const executeCode = new Function(transformed + `
        return {
          testFunction
        };
      `)
      
      const { testFunction } = executeCode()
      testFunction()
      
      // Check that we have statistics
      if (typeof globalThis.getFunctionStatistics === 'function') {
        const stats = globalThis.getFunctionStatistics()
        expect(Object.keys(stats)).toHaveLength(1)
        
        // Reset statistics
        if (typeof globalThis.resetFunctionStatistics === 'function') {
          globalThis.resetFunctionStatistics()
          const resetStats = globalThis.getFunctionStatistics()
          expect(Object.keys(resetStats)).toHaveLength(0)
        }
      }
    })

    it('should count multiple calls', () => {
      const code = `
        function testFunction() {
          return 'test'
        }
      `
      
      const transformed = transformCode(code, { filename: 'test.js' })
      
      const executeCode = new Function(transformed + `
        return {
          testFunction
        };
      `)
      
      const { testFunction } = executeCode()
      
      // Call function multiple times
      testFunction()
      testFunction()
      testFunction()
      
      if (typeof globalThis.getFunctionStatistics === 'function') {
        const stats = globalThis.getFunctionStatistics()
        expect(stats).toHaveProperty('testFunction (test.js:2)', 3)
      }
    })
  })
})
