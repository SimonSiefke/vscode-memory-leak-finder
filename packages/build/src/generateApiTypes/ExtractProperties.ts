import type { PropertyInfo } from './types.ts'
import { findMatchingBrace } from './FindMatchingBrace.ts'

export const extractProperties = (content: string): PropertyInfo[] => {
  const properties: PropertyInfo[] = []

  // Find the return statement and extract the object
  const returnIndex = content.indexOf('return {')
  if (returnIndex === -1) {
    return properties
  }

  // Find the matching closing brace for the return object
  const objectStart = returnIndex + 'return {'.length - 1
  const objectEnd = findMatchingBrace(content, objectStart)
  if (objectEnd === -1) {
    return properties
  }

  const returnObjectContent = content.substring(objectStart + 1, objectEnd)

  // Match property definitions that are objects (have nested methods)
  // Pattern: propertyName: { ... async methodName(...) ... }
  const propertyRegex = /(\w+):\s*\{/g
  let match

  while ((match = propertyRegex.exec(returnObjectContent)) !== null) {
    const propertyName = match[1]
    const propertyStart = match.index
    const beforeProperty = returnObjectContent.substring(Math.max(0, propertyStart - 20), propertyStart)

    // Skip if it's part of a method parameter, destructuring, or type annotation
    if (beforeProperty.includes('async') ||
        beforeProperty.includes('function') ||
        beforeProperty.match(/\([^)]*$/)) {
      continue
    }

    // Check if this property has methods inside (it's an object with methods)
    const propertyObjectStart = propertyStart + match[0].length - 1
    const propertyEnd = findMatchingBrace(returnObjectContent, propertyObjectStart)
    if (propertyEnd !== -1) {
      const propertyBody = returnObjectContent.substring(propertyStart, propertyEnd)
      // Only include if it contains async methods (it's a nested object with methods)
      if (propertyBody.includes('async')) {
        properties.push({ name: propertyName, type: 'any' })
      }
    }
  }

  return properties
}
