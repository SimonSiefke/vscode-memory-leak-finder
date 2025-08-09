import { join as nodeJoin } from 'node:path'

/**
 * Joins path segments using the platform-specific separator
 * @param {...string} pathSegments - Path segments to join
 * @returns {string} - Joined path
 */
export const join = (...pathSegments) => {
  return nodeJoin(...pathSegments)
}
