export const sortTests = (dirents: readonly string[]): readonly string[] => {
  return [...dirents].sort((first, second) => first.localeCompare(second))
}
