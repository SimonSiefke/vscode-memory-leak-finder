export const convertLocationKeyToUrl = (
  locationKey: string,
  scriptMap: Record<number, { readonly url?: string; readonly sourceMapUrl?: string }>,
): string => {
  const parts = locationKey.split(':')
  if (parts.length !== 3) {
    return locationKey
  }
  const scriptId = Number.parseInt(parts[0], 10)
  const line = parts[1]
  const column = parts[2]
  const script = scriptMap[scriptId]
  if (script?.url) {
    return `${script.url}:${line}:${column}`
  }
  return locationKey
}
