import type { MethodInfo } from './types.ts'
import { extractParameterInfo } from './ExtractParameterInfo.ts'
import { extractReturnType } from './ExtractReturnType.ts'

export const extractMethodInfo = (content: string): MethodInfo[] => {
  const methods: MethodInfo[] = []

  // Match async method definitions
  const asyncMethodRegex = /async\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+))?\s*{/g
  let match

  while ((match = asyncMethodRegex.exec(content)) !== null) {
    const methodName = match[1]
    const paramString = match[2] || ''
    const explicitReturnType = match[3]?.trim()
    const methodStartIndex = match.index

    const parameters = extractParameterInfo(paramString)

    // Always extract return type manually (regex may capture incomplete types with {)
    // Only use explicit return type if it looks complete (doesn't end with < or {)
    let returnType: string
    if (explicitReturnType && !explicitReturnType.endsWith('<') && !explicitReturnType.endsWith('{')) {
      returnType = explicitReturnType
    } else {
      returnType = extractReturnType(content, methodStartIndex, methodName)
    }

    // Ensure Promise wrapper for async methods
    if (!returnType.startsWith('Promise<')) {
      returnType = `Promise<${returnType}>`
    }

    // Simplify qualified type names (e.g., Server.ServerInfo -> any)
    // If it contains a dot, it's a qualified name - use any to avoid namespace issues
    const innerTypeMatch = returnType.match(/Promise<([^>]+)>/)
    if (innerTypeMatch && innerTypeMatch[1].includes('.')) {
      returnType = 'Promise<any>'
    }

    methods.push({
      name: methodName,
      parameters,
      returnType,
      isAsync: true,
    })
  }

  // Also match non-async methods (regular methods that might return promises)
  // Pattern: methodName(...) { ... return this.someMethod() ... }
  const nonAsyncMethodRegex = /(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+))?\s*{/g
  // Reset regex lastIndex to start from beginning
  nonAsyncMethodRegex.lastIndex = 0

  while ((match = nonAsyncMethodRegex.exec(content)) !== null) {
    const methodName = match[1]
    const paramString = match[2] || ''
    const explicitReturnType = match[3]?.trim()
    const methodStartIndex = match.index

    // Skip if this method was already captured as async
    if (methods.some(m => m.name === methodName && m.isAsync)) {
      continue
    }

    // Skip if it's a property (has : before { without being a return type)
    const beforeMatch = content.substring(Math.max(0, methodStartIndex - 20), methodStartIndex)
    if (beforeMatch.trim().endsWith(':')) {
      continue
    }

    const parameters = extractParameterInfo(paramString)

    // For non-async methods, check if they return a promise
    // Look at the method body to see if it returns this.someMethod() or similar
    const methodSignature = content.substring(methodStartIndex)
    const methodBodyStart = methodSignature.indexOf('{')
    if (methodBodyStart === -1) {
      continue
    }

    // Find the matching closing brace
    let methodBodyEnd = methodBodyStart + 1
    let depth = 1
    while (methodBodyEnd < methodSignature.length && depth > 0) {
      if (methodSignature[methodBodyEnd] === '{') depth++
      if (methodSignature[methodBodyEnd] === '}') depth--
      methodBodyEnd++
    }

    const methodBody = methodSignature.substring(methodBodyStart, methodBodyEnd)

    // Check if method returns this.someMethod() or similar async call
    // If it does, it likely returns a Promise
    const returnMatch = methodBody.match(/return\s+(this\.\w+\([^)]*\)|await\s+)/)
    if (returnMatch || methodBody.includes('return this.')) {
      // This method returns a promise (likely from another async method)
      let returnType = 'Promise<void>'

      if (explicitReturnType && !explicitReturnType.endsWith('<') && !explicitReturnType.endsWith('{')) {
        returnType = explicitReturnType
        if (!returnType.startsWith('Promise<')) {
          returnType = `Promise<${returnType}>`
        }
      }

      methods.push({
        name: methodName,
        parameters,
        returnType,
        isAsync: false,
      })
    }
  }

  return methods
}
