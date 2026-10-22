import * as NodeChildProcess from 'node:child_process'

export const getVscodeVersionFromPath = (vscodePath: string): string => {
  const result = NodeChildProcess.spawnSync(vscodePath, ['--version'], {
    encoding: 'utf8',
  })
  if (result.status !== 0 || typeof result.stdout !== 'string') {
    return ''
  }
  const version = result.stdout.trim().split(/\r?\n/)[0]
  if (typeof version === 'string') {
    return version.trim()
  }
  return ''
}
