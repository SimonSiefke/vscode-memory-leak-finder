import * as Path from '../Path/Path.js'

/**
 * @typedef {Object} CopyOperation
 * @property {'copy'} type
 * @property {string} from
 * @property {string} to
 */

/**
 * @typedef {Object} MkdirOperation
 * @property {'mkdir'} type
 * @property {string} path
 */

/**
 * @typedef {CopyOperation | MkdirOperation} FileOperation
 */

/**
 * @param {string} repoPath - File path of the repository
 * @param {string} cacheKey
 * @param {string} cacheDir - File path of the cache directory
 * @param {string} cachedNodeModulesPath - File path of the cached node_modules path
 * @param {string[]} nodeModulesPaths - Relative paths within the repo
 * @returns {Promise<FileOperation[]>}
 */
export const getCacheFileOperations = async (repoPath, cacheKey, cacheDir, cachedNodeModulesPath, nodeModulesPaths) => {
  const fileOperations = []
  fileOperations.push(
    {
      type: /** @type {'mkdir'} */ ('mkdir'),
      path: cacheDir,
    },
    {
      type: /** @type {'mkdir'} */ ('mkdir'),
      path: cachedNodeModulesPath,
    },
  )
  const absoluteNodeModulesPaths = nodeModulesPaths.map((path) => Path.join(repoPath, path))
  for (const nodeModulesPath of absoluteNodeModulesPaths) {
    const relativePath = nodeModulesPath.replace(repoPath, '').replace(/^\/+/, '')
    const cacheTargetPath = Path.join(cachedNodeModulesPath, relativePath)
    const parentDir = Path.join(cacheTargetPath, '..')
    fileOperations.push(
      {
        type: /** @type {'mkdir'} */ ('mkdir'),
        path: parentDir,
      },
      {
        type: /** @type {'copy'} */ ('copy'),
        from: nodeModulesPath,
        to: cacheTargetPath,
      },
    )
  }

  return fileOperations
}
