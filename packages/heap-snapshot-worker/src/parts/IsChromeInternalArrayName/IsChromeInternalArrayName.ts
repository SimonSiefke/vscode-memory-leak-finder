/**
 * Checks if an array name indicates it's a Chrome internal array that should be filtered out
 * @param name - The array name (string with "/" separators for multiple names)
 * @returns True if the array is a Chrome internal, false otherwise
 */
export const isChromeInternalArrayName = (name: string): boolean => {
  if (!name || typeof name !== 'string') {
    return false
  }

  // Check if name starts with <dummy> or contains <
  if (name.startsWith('<dummy>') || name.includes('<')) {
    return true
  }

  // Check if name contains WeakMap references
  if (name.includes('WeakMap') || name.includes('part of key') || name.includes('pair in WeakMap')) {
    return true
  }

  // Check if name contains "system"
  if (name.includes('system')) {
    return true
  }

  // Check if name is numeric-only (just numbers, possibly with spaces and slashes)
  // This handles cases like "102", "150/188/28", etc.
  const parts = name.split('/')
  const allNumeric = parts.every((part) => {
    const trimmed = part.trim()
    return /^\d+$/.test(trimmed)
  })
  if (allNumeric && parts.length > 0) {
    return true
  }

  // Check if name contains internal Map types
  if (name.includes('Map (') && (name.includes('Uncached') || name.includes('Internalized'))) {
    return true
  }

  // Check for specific internal names
  if (name === 'transition_info' || name.includes('transition_info/') || name.includes('/transition_info')) {
    return true
  }

  return false
}
