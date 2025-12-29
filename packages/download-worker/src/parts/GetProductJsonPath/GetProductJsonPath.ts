import { resolve } from 'node:path'

export const getProductJsonPath = (platform: string, path: string): string => {
  if (platform === 'darwin') {
    return resolve(path, '..', '..', 'Resources', 'app', 'product.json')
  }
  return resolve(path, '..', 'resources', 'app', 'product.json')
}

