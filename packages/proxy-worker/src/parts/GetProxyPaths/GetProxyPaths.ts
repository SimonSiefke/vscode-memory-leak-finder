import { join } from 'node:path'
import * as ProxyState from '../ProxyState/ProxyState.ts'
import * as Root from '../Root/Root.ts'

const getScopedDir = (baseName: string): string => {
  const testFolderName = ProxyState.getTestFolderName()
  if (testFolderName) {
    return join(Root.root, baseName, testFolderName)
  }
  return join(Root.root, baseName)
}

export const getRequestsDir = (): string => {
  return getScopedDir('.vscode-requests')
}

export const getMockRequestsDir = (): string => {
  return getScopedDir('.vscode-mock-requests')
}

export const getSharedMockRequestsDir = (): string => {
  return join(Root.root, '.vscode-mock-requests')
}

export const getZipDataDir = (): string => {
  return getScopedDir('.vscode-zip-data')
}

export const getImageDataDir = (): string => {
  return getScopedDir('.vscode-image-data')
}

export const getSseDataDir = (): string => {
  return getScopedDir('.vscode-sse-data')
}

export const getMockConfigPath = (): string => {
  return join(getMockRequestsDir(), 'mock-config.json')
}
