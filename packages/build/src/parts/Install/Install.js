import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../../..')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const retryDelayMilliseconds = 1000

/** @typedef {(args: string[]) => number} RunCommand */

/**
 * @param {NodeJS.Platform} platform
 * @returns {number}
 */
export const getMaxAttempts = (platform) => (platform === 'win32' ? 5 : 1)

/**
 * @param {string[]} args
 * @returns {number}
 */
const runNpmCommand = (args) => {
  const result = spawnSync(npmCommand, args, {
    cwd: repositoryRoot,
    stdio: 'inherit',
    windowsHide: true,
  })

  if (result.error) {
    console.error(`Failed to start ${npmCommand}: ${result.error.message}`)
    return 1
  }

  return result.status ?? 1
}

/**
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

/**
 * @param {{ platform?: NodeJS.Platform, runCommand?: RunCommand, sleep?: (milliseconds: number) => Promise<void> }} [options]
 * @returns {Promise<number>}
 */
export const runInstall = async ({ platform = process.platform, runCommand = runNpmCommand, sleep: wait = sleep } = {}) => {
  const maxAttempts = getMaxAttempts(platform)
  let lastExitCode = 1

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ciExitCode = runCommand(['ci', '--ignore-scripts'])
    lastExitCode = ciExitCode === 0 ? runCommand(['run', 'postinstall']) : ciExitCode

    if (lastExitCode === 0) {
      return 0
    }

    if (attempt < maxAttempts) {
      console.warn(
        `Install attempt ${attempt}/${maxAttempts} failed with exit code ${lastExitCode}; retrying in ${retryDelayMilliseconds}ms`,
      )
      await wait(retryDelayMilliseconds)
    }
  }

  return lastExitCode
}

if (resolve(process.argv[1] ?? '') === resolve(fileURLToPath(import.meta.url))) {
  process.exitCode = await runInstall()
}
