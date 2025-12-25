import type { MethodInfo } from './types.ts'
import { extractParameterInfo } from './ExtractParameterInfo.ts'
import { extractReturnType } from './ExtractReturnType.ts'

export const extractMethodInfo = (content: string): MethodInfo[] => {
  const methods: MethodInfo[] = []

  // Match async method definitions with better regex
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

  return methods
}
