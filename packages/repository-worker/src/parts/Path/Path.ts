import { join as nodeJoin } from 'node:path'

/**
 * Joins path segments and normalizes separators for RPC-facing paths.
 */
export const join = (...pathSegments: string[]): string => {
  return nodeJoin(...pathSegments).replaceAll('\\', '/')
}
