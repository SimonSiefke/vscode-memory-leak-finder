// List of Chrome internal array names that should be filtered out
const internalNames = [
  'initial_array_prototype',
  '(GC roots)',
  '(Bootstrapper)',
  '(Builtins)',
  '(Client heap)',
  '(Code flusher)',
  '(Compilation cache)',
  '(Debugger)',
  '(Extensions)',
]

/**
 * Checks if an array name indicates it's a Chrome internal array that should be filtered out
 * @param {string|Array} name - The array name (string or array of strings)
 * @returns {boolean} - True if the array is a Chrome internal, false otherwise
 */
export const isInternalArray = (name) => {
  // Convert array of names to comma-separated string for checking
  const nameString = Array.isArray(name) ? name.join(',') : name

  return internalNames.includes(nameString)
}
