const RE_CLASSNAME = /^[a-zA-Z\d]+/
const classPrefix = 'class '

export const getOriginalClassName = (sourceContent, originalLine, originalColumn) => {
  const lines = sourceContent.split('\n')
  for (let i = originalLine; i >= 0; i--) {
    const line = lines[i]
    const classIndex = line.indexOf(classPrefix)
    if (classIndex !== -1) {
      const rest = line.slice(classIndex + classPrefix.length)
      const match = rest.match(RE_CLASSNAME)
      if (match) {
        const originalClassName = match[0]
        return originalClassName
      }
    }
  }
  return 'unknown'
}
