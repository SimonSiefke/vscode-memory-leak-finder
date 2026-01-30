export const isExcludedPath = (target: string): boolean => {
  // Exclude irrelevant folders from measurement
  const excludedPatterns = ['Dictionaries', 'Local Storage', 'dmabuf', 'SharedStorage', 'nssdb', 'systemd', 'memfs']

  // Also exclude /dev paths except /dev/ptmx and /dev/udmabuf which are handled separately
  if (target.startsWith('/dev/') && target !== '/dev/ptmx' && target !== '/dev/udmabuf') {
    return true
  }

  return excludedPatterns.some((pattern) => target.includes(pattern))
}
