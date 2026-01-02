/**
 * Checks if a string is a Chrome internal string that should be filtered out
 * @param str - The string to check
 * @returns True if the string is a Chrome internal string, false otherwise
 */
export const isChromeInternalString = (str: string): boolean => {
  if (str.includes('part of key') && str.includes('WeakMap')) {
    return true
  }
  if (str.includes('system /')) {
    return true
  }
  if (str.includes('node:internal/')) {
    return true
  }
  if (str.includes('(instruction stream for')) {
    return true
  }
  if (str.includes('(code for ')) {
    return true
  }
  return false
}
