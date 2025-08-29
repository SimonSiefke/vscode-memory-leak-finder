const RE_CLASSNAME: RegExp = /^[a-zA-Z\d]+/
const classPrefix: string = 'class '
const extendsPrefix: string = 'extends'

export const getOriginalClassName = (sourceContent: string, originalLine: number, originalColumn: number): string => {
  if (!sourceContent) {
    return 'unknown'
  }
  const lines: string[] = sourceContent.split('\n')
  for (let i = originalLine; i >= 0; i--) {
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
  return 'unknown'
}
