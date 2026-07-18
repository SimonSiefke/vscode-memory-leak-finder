import { existsSync, statSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'

const workbenchRelativePath = join('out', 'vs', 'workbench', 'workbench.desktop.main.js')

const getBinaryDirectory = (vscodeBinaryPath: string): string => {
  try {
    const stats = statSync(vscodeBinaryPath)
    if (stats.isFile()) {
      return resolve(vscodeBinaryPath, '..')
    }
  } catch {
    // Fall through and treat the input as a directory or a known source script path.
  }
  return vscodeBinaryPath
}

const getSourceCheckoutDirectoryFromScript = (vscodeBinaryPath: string): string | undefined => {
  const scriptDirectory = dirname(vscodeBinaryPath)
  if (basename(vscodeBinaryPath) === 'code.sh' && basename(scriptDirectory) === 'scripts') {
    return dirname(scriptDirectory)
  }
  return undefined
}

const unique = (paths: readonly string[]): readonly string[] => {
  return [...new Set(paths)]
}

export const getWorkbenchPathCandidates = (vscodeBinaryPath: string): readonly string[] => {
  const binaryDirectory = getBinaryDirectory(vscodeBinaryPath)
  const sourceCheckoutDirectory = getSourceCheckoutDirectoryFromScript(vscodeBinaryPath)
  return unique([
    join(binaryDirectory, 'resources', 'app', workbenchRelativePath),
    ...(sourceCheckoutDirectory ? [join(sourceCheckoutDirectory, workbenchRelativePath)] : []),
    join(vscodeBinaryPath, workbenchRelativePath),
  ])
}

export const getWorkbenchPath = (vscodeBinaryPath: string): string => {
  const candidates = getWorkbenchPathCandidates(vscodeBinaryPath)
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }
  throw new Error(`Failed to find workbench.desktop.main.js. Tried:\n${candidates.join('\n')}`)
}
