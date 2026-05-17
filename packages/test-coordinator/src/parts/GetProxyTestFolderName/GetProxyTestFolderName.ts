import { basename, extname } from 'node:path'

export const getProxyTestFolderName = (absolutePath: string): string => {
  const extension = extname(absolutePath)
  return basename(absolutePath, extension)
}
