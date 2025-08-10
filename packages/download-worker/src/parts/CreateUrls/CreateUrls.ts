export const createUrls = (cdnUrls: string[], relativePath: string): string[] => {
  const urls: string[] = []
  for (const cdnUrl of cdnUrls) {
    urls.push(`${cdnUrl}/${relativePath}`)
  }
  return urls
}
