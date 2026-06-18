import { join, sep } from 'node:path'
import * as Root from '../Root/Root.ts'

export const ROOT_PATH_PLACEHOLDER = '@@ROOT_PATH@@'
export const WORKSPACE_PATH_PLACEHOLDER = '@@WORKSPACE_PATH@@'
export const CURSOR_WORKSPACE_PATH_PLACEHOLDER = '@@CURSOR_WORKSPACE_PATH@@'

const replacementTargets = [
  {
    actualPath: join(Root.root, '.vscode-test-workspace'),
    placeholder: WORKSPACE_PATH_PLACEHOLDER,
  },
  {
    actualPath: join(Root.root, '.cursor-test-workspace'),
    placeholder: CURSOR_WORKSPACE_PATH_PLACEHOLDER,
  },
  {
    actualPath: Root.root,
    placeholder: ROOT_PATH_PLACEHOLDER,
  },
] as const

const getPathVariants = (value: string): readonly string[] => {
  const variants = new Set<string>([value])
  variants.add(value.replaceAll('\\', '/'))
  return [...variants].sort((first, second) => second.length - first.length)
}

const replaceAll = (value: string, searchValue: string, replacement: string): string => {
  if (!searchValue) {
    return value
  }
  return value.split(searchValue).join(replacement)
}

const escapeRegExp = (value: string): string => {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const normalizePlaceholderPathSeparators = (value: string, placeholder: string, separator: string): string => {
  const pattern = new RegExp(`${escapeRegExp(placeholder)}[^\\s"'<>]*`, 'g')
  return value.replace(pattern, (match) => match.replaceAll(/[\\/]/g, separator))
}

export const replaceAbsolutePathsWithPlaceholdersInText = (value: string): string => {
  let result = value
  for (const target of replacementTargets) {
    for (const variant of getPathVariants(target.actualPath)) {
      result = replaceAll(result, variant, target.placeholder)
    }
    result = normalizePlaceholderPathSeparators(result, target.placeholder, '/')
  }
  return result
}

export const restoreAbsolutePathsFromPlaceholdersInText = (value: string): string => {
  let result = value
  for (const target of replacementTargets) {
    result = normalizePlaceholderPathSeparators(result, target.placeholder, sep)
    result = replaceAll(result, target.placeholder, target.actualPath)
  }
  return result
}

const mapValue = (value: unknown, mapper: (item: string) => string): unknown => {
  if (typeof value === 'string') {
    return mapper(value)
  }
  if (Array.isArray(value)) {
    return value.map((item) => mapValue(item, mapper))
  }
  if (!value || typeof value !== 'object') {
    return value
  }

  const result: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    result[key] = mapValue(item, mapper)
  }
  return result
}

export const replaceAbsolutePathsWithPlaceholdersInValue = (value: unknown): unknown => {
  return mapValue(value, replaceAbsolutePathsWithPlaceholdersInText)
}

export const restoreAbsolutePathsFromPlaceholdersInValue = (value: unknown): unknown => {
  return mapValue(value, restoreAbsolutePathsFromPlaceholdersInText)
}

export const restoreAbsolutePathsFromPlaceholdersInBuffer = (value: Buffer): Buffer => {
  return Buffer.from(restoreAbsolutePathsFromPlaceholdersInText(value.toString('utf8')), 'utf8')
}
