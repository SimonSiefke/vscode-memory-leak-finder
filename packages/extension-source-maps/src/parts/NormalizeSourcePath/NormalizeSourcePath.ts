export const normalizeSourcePath = (path: string | null): string | null => {
  if (!path) {
    return null
  }
  // Remove "../" prefixes from the beginning of the path
  let normalized = path
  while (normalized.startsWith('../')) {
    normalized = normalized.slice(3)
  }
  return normalized
}

