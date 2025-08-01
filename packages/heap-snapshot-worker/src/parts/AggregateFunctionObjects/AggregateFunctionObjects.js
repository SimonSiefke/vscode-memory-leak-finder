export const aggregateFunctionObjects = (functionObjects) => {
  const map = Object.create(null)

  for (const { url } of functionObjects) {
    map[url] ||= 0
    map[url]++
  }

  const seen = Object.create(null)
  const aggregated = []
  for (const { url, sourceMapUrl, name } of functionObjects) {
    if (url in seen) {
      continue
    }
    seen[url] = true
    aggregated.push({
      name,
      url,
      sourceMapUrl,
      count: map[url],
    })
  }
  return aggregated
}
