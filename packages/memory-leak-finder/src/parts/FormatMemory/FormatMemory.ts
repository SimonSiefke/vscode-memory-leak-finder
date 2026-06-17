export const formatMemory = async (bytes: number): Promise<string> => {
  const prettyBytes = await import('pretty-bytes')
  const formatted = prettyBytes.default(bytes)
  return formatted
}
