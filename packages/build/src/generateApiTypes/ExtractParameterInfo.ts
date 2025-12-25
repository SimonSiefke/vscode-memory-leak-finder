import type { ParameterInfo } from './types.ts'

export const extractParameterInfo = (paramString: string): ParameterInfo[] => {
  if (!paramString.trim()) {
    return []
  }

  const params: ParameterInfo[] = []

  // First, try to split by comma to handle multiple parameters
  // But be careful with destructuring - need to handle nested braces/brackets
  const paramList: string[] = []
  let currentParam = ''
  let braceDepth = 0
  let bracketDepth = 0

  for (let i = 0; i < paramString.length; i++) {
    const char = paramString[i]
    if (char === '{') braceDepth++
    else if (char === '}') braceDepth--
    else if (char === '[') bracketDepth++
    else if (char === ']') bracketDepth--
    else if (char === ',' && braceDepth === 0 && bracketDepth === 0) {
      paramList.push(currentParam.trim())
      currentParam = ''
      continue
    }
    currentParam += char
  }
  if (currentParam.trim()) {
    paramList.push(currentParam.trim())
  }

  // If there's only one parameter and it contains destructuring, handle it specially
  if (paramList.length === 1 && (paramList[0].includes('{') || paramList[0].includes('['))) {
    const singleParam = paramList[0]
    // Check if it's a destructured parameter with default
    if (singleParam.includes('=') && (singleParam.includes('{') || singleParam.includes('['))) {
      params.push({ name: 'options', isOptional: true })
    } else {
      params.push({ name: 'options', isOptional: false })
    }
    return params
  }

  // Handle each parameter individually
  for (const param of paramList) {
    // Check if this parameter has destructuring
    if (param.includes('{') || param.includes('[')) {
      // Destructured parameter
      if (param.includes('=')) {
        params.push({ name: 'options', isOptional: true })
      } else {
        params.push({ name: 'options', isOptional: false })
      }
    } else if (param.includes('=')) {
      // Simple parameter with default value
      const paramName = param.split('=')[0].trim().split(':')[0].trim()
      params.push({ name: paramName, isOptional: true })
    } else {
      // Simple parameter without default
      const paramName = param.split(':')[0].trim()
      params.push({ name: paramName, isOptional: false })
    }
  }

  return params
}
