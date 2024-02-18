export const formatMemory = async (bytes) => {
  const prettyBytes = await import('pretty-bytes')
  const formatted = prettyBytes.default(bytes)
  return formatted
}
