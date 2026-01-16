import { trackingCode } from '../TrackingCode/TrackingCode.js'
import { createFunctionWrapperPlugin } from '../CreateFunctionWrapperPlugin/CreateFunctionWrapperPlugin.js'


export const transformCode = async (code: string, filename?: string, excludePatterns?: string[]): Promise<string> => {
  try {
    // Dynamic imports for proper module resolution
    const [parser, traverseModule, generateModule, t] = await Promise.all([
      import('@babel/parser'),
      import('@babel/traverse'),
      import('@babel/generator'),
      import('@babel/types')
    ])
    
    const traverse = traverseModule.default.default || traverseModule.default || traverseModule
    const generate = generateModule.default.default || generateModule.default || generateModule
    // Try different parsing strategies
    let ast
    const parseStrategies = [
      // Strategy 1: Try without TypeScript plugin (more permissive for JS)
      () => parser.parse(code, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        plugins: ['jsx', 'decorators-legacy', 'objectRestSpread', 'classProperties']
      }),
      // Strategy 2: Script without TypeScript
      () => parser.parse(code, {
        sourceType: 'script',
        allowImportExportEverywhere: true,
        plugins: ['jsx', 'decorators-legacy', 'objectRestSpread', 'classProperties']
      }),
      // Strategy 3: Minimal plugins
      () => parser.parse(code, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        plugins: ['jsx']
      }),
      // Strategy 4: Script with minimal plugins
      () => parser.parse(code, {
        sourceType: 'script',
        allowImportExportEverywhere: true,
        plugins: ['jsx']
      }),
      // Strategy 5: Try with TypeScript but more permissive
      () => parser.parse(code, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        plugins: ['jsx', 'typescript', 'decorators-legacy']
      }),
      // Strategy 6: Script with TypeScript
      () => parser.parse(code, {
        sourceType: 'script',
        allowImportExportEverywhere: true,
        plugins: ['jsx', 'typescript', 'decorators-legacy']
      })
    ]

    for (let i = 0; i < parseStrategies.length; i++) {
      try {
        ast = parseStrategies[i]()
        console.log(`Parse strategy ${i + 1} succeeded!`)
        break // Success! Exit the loop
      } catch (error) {
        console.log(`Parse strategy ${i + 1} failed:`, error.message.split('\n')[0])
        continue // Try next strategy
      }
    }

    if (!ast) {
      console.log('All parsing strategies failed - returning original code without transformation')
      return code // Return original code if all parsing fails
    }
    
    // Add tracking code at the beginning
    const trackingAST = parser.parse(trackingCode, {
      sourceType: 'script'
    })
    
    // Transform the original code with proper file context
    try {
      const plugin = createFunctionWrapperPlugin({ filename, excludePatterns })
      console.log('Plugin created successfully:', plugin)
      console.log('AST before transformation:', ast)
      traverse(ast, plugin.visitor as any)
      console.log('AST after transformation successful')
    } catch (error) {
      console.error('Error transforming code:', error)
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
      return code // Return original code if transformation fails
    }
    
    // Combine tracking code with transformed code
    const combinedAST = t.program([...trackingAST.program.body, ...ast.program.body])
    
    const result = generate(combinedAST, {
      retainLines: false,
      compact: false
    })
    
    return result.code
  } catch (error) {
    console.error('Error transforming code:', error)
    return code // Return original code if transformation fails
  }
}

export {
  createFunctionWrapperPlugin
}
