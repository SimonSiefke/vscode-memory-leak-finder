const LOCATION_UNKNOWN: string = 'unknown'

export const fallbackScan = (sourceContent: string, originalLine: number): string => {
  const RE_CLASSNAME: RegExp = /^[a-zA-Z\d]+/
  const classPrefix: string = 'class '
  const extendsPrefix: string = 'extends'
  const lines: string[] = sourceContent.split('\n')
  for (let i = originalLine; i >= 0; i--) {
    if (i >= lines.length) {
      continue
    }
    const line: string = lines[i]
    const classIndex: number = line.indexOf(classPrefix)
    if (classIndex !== -1) {
      const rest: string = line.slice(classIndex + classPrefix.length)
      const match: RegExpMatchArray | null = rest.match(RE_CLASSNAME)
      if (match) {
        const originalClassName: string = match[0]
        if (originalClassName === extendsPrefix) {
          const other: string = rest.slice(extendsPrefix.length + 1)
          const otherMatch: RegExpMatchArray | null = other.match(RE_CLASSNAME)
          if (otherMatch) {
            return `class extends ` + otherMatch[0]
          }
        }
        return originalClassName
      }
    }
  }
  const anyMatch: RegExpMatchArray | null = sourceContent.match(/class\s+extends\s+([A-Za-z\d]+)/)
  if (anyMatch && anyMatch[1]) {
    return `class extends ${anyMatch[1]}`
  }
  return LOCATION_UNKNOWN
}
