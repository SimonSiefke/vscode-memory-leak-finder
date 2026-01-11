import { join as nodeJoin } from 'node:path'

/**
 * Joins path segments using the platform-specific separator
 */
export const join = (...pathSegments: string[]): string => {
  return nodeJoin(...pathSegments)
}
