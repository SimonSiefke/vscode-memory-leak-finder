export const sanitizeFilename = (url: string): string => {
  return url.replaceAll(/[^a-zA-Z0-9]/g, '_').slice(0, 200)
}
