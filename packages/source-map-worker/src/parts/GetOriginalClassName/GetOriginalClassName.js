const RE_CLASSNAME = /^[a-zA-Z\d]+/
const classPrefix = 'class '
const extendsPrefix = 'extends'

export const getOriginalClassName = (sourceContent, originalLine, originalColumn) => {
  if (!sourceContent) {
    return 'unknown'
  }
  const lines = sourceContent.split('\n')
  for (let i = originalLine; i >= 0; i--) {
    const line = lines[i]
    const classIndex = line.indexOf(classPrefix)
    if (classIndex !== -1) {
      const rest = line.slice(classIndex + classPrefix.length)
      const match = rest.match(RE_CLASSNAME)
      if (match) {
        const originalClassName = match[0]
        if (originalClassName === extendsPrefix) {
          const other = rest.slice(extendsPrefix.length + 1)
          const otherMatch = other.match(RE_CLASSNAME)
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
