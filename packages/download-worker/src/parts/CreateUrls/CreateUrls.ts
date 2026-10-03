export const createUrls = (cdnUrls: string[], relativePath: string): string[] => {
  const urls: string[] = Array.from(cdnUrls, (cdnUrl) => `${cdnUrl}/${relativePath}`)
  return urls
}
