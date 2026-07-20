import { basename } from 'node:path'

const stripQueryAndHash = (value: string): string => {
  const queryIndex = value.search(/[?#]/)
  return queryIndex === -1 ? value : value.slice(0, queryIndex)
}

const decodeFileUrl = (value: string): string => {
  if (!value.startsWith('file://')) {
    return value
  }
  try {
    return decodeURIComponent(new URL(value).pathname)
  } catch {
    return value.slice('file://'.length)
  }
}

const stripLoaderPrefix = (value: string): string => {
  const separatorIndex = value.lastIndexOf('!')
  return separatorIndex === -1 ? value : value.slice(separatorIndex + 1)
}

const stripKnownPrefix = (value: string): string => {
  const normalized = value.replaceAll('\\', '/')
  const vscodeSourceIndex = normalized.lastIndexOf('/src/vs/')
  if (vscodeSourceIndex !== -1) {
    return normalized.slice(vscodeSourceIndex + 1)
  }
  const extensionsIndex = normalized.lastIndexOf('/extensions/')
  if (extensionsIndex !== -1) {
    return normalized.slice(extensionsIndex + 1)
  }
  const nodeModulesIndex = normalized.lastIndexOf('/node_modules/')
  if (nodeModulesIndex !== -1) {
    return `external/node_modules/${normalized.slice(nodeModulesIndex + '/node_modules/'.length)}`
  }
  return normalized
}

export const canonicalizeMemoryCityPath = (value: string): string => {
  if (!value) {
    return 'runtime/unattributed/unknown'
  }
  let normalized = stripQueryAndHash(stripLoaderPrefix(decodeFileUrl(value.trim())))
  normalized = normalized.replace(/^webpack:\/\/\/?/, '').replace(/^webpack:\/\//, '')
  normalized = normalized.replace(/^vscode-file:\/\//, '')
  normalized = stripKnownPrefix(normalized)
  normalized = normalized
    .replaceAll('\\', '/')
    .replace(/^([A-Za-z]:)?\/+/, '')
    .replace(/^(\.\.\/)+/, '')
  normalized = normalized
    .split('/')
    .filter((part) => part && part !== '.')
    .join('/')
  if (!normalized || normalized === '(unknown)') {
    return 'runtime/unattributed/unknown'
  }
  if (!normalized.includes('/')) {
    return `external/${basename(normalized)}`
  }
  return normalized
}
