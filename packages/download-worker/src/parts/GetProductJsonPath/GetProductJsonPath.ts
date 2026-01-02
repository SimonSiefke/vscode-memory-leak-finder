import { resolve } from 'node:path'

export const getProductJsonPath = (platform: string, path: string, commit?: string): string => {
  if (platform === 'darwin') {
    return resolve(path, '..', '..', 'Resources', 'app', 'product.json')
  }
  if (platform === 'win32' && commit) {
    const commitPrefix = commit.substring(0, 10)
    return resolve(path, '..', commitPrefix, 'resources', 'app', 'product.json')
  }
  return resolve(path, '..', 'resources', 'app', 'product.json')
}
