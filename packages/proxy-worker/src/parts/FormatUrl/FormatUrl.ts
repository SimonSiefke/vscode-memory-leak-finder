export const formatUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol === 'https:' && parsedUrl.port === '443') {
      return `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
    }
    return parsedUrl.toString()
  } catch {
    // If URL parsing fails, use original URL
    return url
  }
}
