import type { Dynamic } from '../Types/Types.ts'
export const formatMemory = async (bytes: Dynamic) => {
  const prettyBytes = await import('pretty-bytes')
  const formatted = prettyBytes.default(bytes)
  return formatted
}
