const SOURCE_MAP_ISDEV_LINKED_FALSE_REGEX = /sourcemap:\s*isDev\s*\?\s*['"]linked['"]\s*:\s*false/gi

export const getNewEsbuildConfig = (oldConfig: string): string => {
  return oldConfig.replaceAll(SOURCE_MAP_ISDEV_LINKED_FALSE_REGEX, "sourcemap: isDev ? 'linked' : 'linked'")
}
