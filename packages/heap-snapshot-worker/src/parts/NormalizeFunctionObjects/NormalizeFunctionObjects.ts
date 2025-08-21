export const normalizeFunctionObjects = (functionObjects) => {
  const normalized: any[] = []
  for (const functionObject of functionObjects) {
    const { url, lineIndex, columnIndex, name, sourceMapUrl } = functionObject
    const displayUrl = `${url}:${lineIndex}:${columnIndex}`
    normalized.push({
      url: displayUrl,
      name,
      sourceMapUrl,
    })
  }
  return normalized
}
