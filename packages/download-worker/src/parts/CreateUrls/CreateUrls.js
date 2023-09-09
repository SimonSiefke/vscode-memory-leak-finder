export const createUrls = (cdnUrls, relativePath) => {
  const urls = []
  for (const cdnUrl of cdnUrls) {
    urls.push(`${cdnUrl}/${relativePath}`)
  }
  return urls
}
