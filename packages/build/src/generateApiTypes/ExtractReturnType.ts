export const extractReturnType = (content: string, methodStartIndex: number, methodName: string): string => {
  // Look for explicit return type annotation in the method signature
  const methodSignature = content.substring(methodStartIndex)

  // Find the closing paren and the opening brace
  const parenIndex = methodSignature.indexOf(')')
  if (parenIndex === -1) {
    return 'Promise<void>'
  }

  const afterParen = methodSignature.substring(parenIndex + 1).trim()
  const colonIndex = afterParen.indexOf(':')
  const braceIndex = afterParen.indexOf('{')

  // Only treat : as return type if it comes before the method body brace
  if (colonIndex !== -1 && (braceIndex === -1 || colonIndex < braceIndex)) {
    // Check that this looks like a return type (not part of method body)
    const afterColon = afterParen.substring(colonIndex + 1).trim()
    // If immediately followed by {, it's not a return type
    if (afterColon.startsWith('{')) {
      // No return type annotation
    } else {
      // There's a return type annotation
      const returnTypeStart = colonIndex + 1
      // Find where the return type ends (before the method body brace)
      // Check a larger preview to catch multi-line return types, but stop at method body
      let previewEnd = braceIndex !== -1 ? braceIndex : Math.min(returnTypeStart + 500, afterParen.length)
      const returnTypePreview = afterParen.substring(returnTypeStart, previewEnd).trim()

      // If return type contains braces or brackets (but not just Promise<>), it's complex - use Promise<any>
      // Check if braces/brackets are inside the Promise<> or part of the type itself
      const trimmedPreview = returnTypePreview.trim()
      if (trimmedPreview.startsWith('Promise<')) {
        // Check if there are braces/brackets after Promise< and before the closing >
        const afterPromise = trimmedPreview.substring('Promise<'.length)
        const closingAngleIndex = afterPromise.indexOf('>')
        if (closingAngleIndex !== -1) {
          const innerType = afterPromise.substring(0, closingAngleIndex)
          if (innerType.includes('{') || innerType.includes('[')) {
            return 'Promise<any>'
          }
        }
      } else if (returnTypePreview.includes('{') || returnTypePreview.includes('[')) {
        // Check if the brace/bracket is part of the return type or the method body
        // If we found a brace index and it's after the preview, the braces in preview are in the type
        if (braceIndex === -1 || braceIndex > returnTypeStart + returnTypePreview.length) {
          return 'Promise<any>'
        }
      }

      // For simple return types, find the method body brace
      // Need to find the brace that's NOT inside the return type
      let methodBodyBraceIndex = -1
      let angleDepth = 0
      let braceDepth = 0

      for (let i = returnTypeStart; i < afterParen.length; i++) {
        const char = afterParen[i]
        if (char === '<') {
          angleDepth++
        } else if (char === '>') {
          angleDepth--
          // After closing all angles and braces, the next { is the method body
          if (angleDepth === 0 && braceDepth === 0) {
            // Look for the next { which should be the method body brace
            const nextBrace = afterParen.indexOf('{', i + 1)
            if (nextBrace !== -1) {
              methodBodyBraceIndex = nextBrace
              break
            }
          }
        } else if (char === '{') {
          if (angleDepth === 0 && braceDepth === 0) {
            // This is the method body brace (return type has no generics or braces)
            methodBodyBraceIndex = i
            break
          }
          braceDepth++
        } else if (char === '}') {
          braceDepth--
          // After closing all braces and angles, the next { is the method body
          if (angleDepth === 0 && braceDepth === 0) {
            const nextBrace = afterParen.indexOf('{', i + 1)
            if (nextBrace !== -1) {
              methodBodyBraceIndex = nextBrace
              break
            }
          }
        }
      }

      if (methodBodyBraceIndex !== -1) {
        let returnType = afterParen.substring(returnTypeStart, methodBodyBraceIndex).trim()

        // If still complex after extraction, use any
        if (returnType.includes('{') || returnType.includes('[')) {
          return 'Promise<any>'
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

        return returnType
      }
    }
  }

  // Look for return statements to infer type
  const methodBodyStart = methodSignature.indexOf('{')
  if (methodBodyStart === -1) {
    return 'Promise<void>'
  }

  // Find the matching closing brace for the method body
  let methodBodyEnd = methodBodyStart + 1
  let depth = 1
  while (methodBodyEnd < methodSignature.length && depth > 0) {
    if (methodSignature[methodBodyEnd] === '{') depth++
    if (methodSignature[methodBodyEnd] === '}') depth--
    methodBodyEnd++
  }
  
  // Extract only this method's body, not subsequent methods
  const methodBody = methodSignature.substring(methodBodyStart, methodBodyEnd)

  // Check for specific method name patterns
  if (methodName.includes('getInputValue') || methodName.includes('getValue')) {
    return 'Promise<string>'
  }
  if (methodName.includes('getVisibleCommands') || methodName.includes('getCommands')) {
    return 'Promise<string[]>'
  }
  if (methodName.includes('createMCPServer') || methodName.includes('createServer')) {
    return 'Promise<any>'
  }
  if (methodName.includes('item') && methodName !== 'getItem') {
    return 'Promise<any>'
  }

  // Look for return statements with actual values (not just "return" alone)
  // Match "return" followed by non-whitespace (actual return value), stopping at ; or newline/brace
  const returnMatches = methodBody.matchAll(/return\s+([^\s;{}]+[^;{}]*?)(?:\s*[;{}]|$)/g)
  for (const returnMatch of returnMatches) {
    const returnValue = returnMatch[1].trim()
    // Skip empty return values (just "return" with no value)
    if (!returnValue || returnValue === '') {
      continue
    }
    // Check for array returns
    if (returnValue.includes('commands') || returnValue.includes('[]') || returnValue.match(/\[.*\]/)) {
      return 'Promise<string[]>'
    }
    // Check for string returns
    if (returnValue.includes("getAttribute('value')") ||
        returnValue.includes("textContent()") ||
        returnValue.includes("|| ''") ||
        returnValue.includes("|| \"\"")) {
      return 'Promise<string>'
    }
    // Check for object/any returns
    if (returnValue.includes('instance') || returnValue.includes('server') || returnValue.includes('Server')) {
      return 'Promise<any>'
    }
  }

  // Default to Promise<void> for async methods
  return 'Promise<void>'
}
