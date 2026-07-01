import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const assertCommandAvailable = async (command: string): Promise<void> => {
  try {
    await execFileAsync('sh', ['-c', `command -v ${command}`])
  } catch (error) {
    throw new Error(`Callgrind profiling requires ${command} to be installed and available on PATH`)
  }
}

export const assertCallgrindAvailable = async (platform: string): Promise<void> => {
  if (platform !== 'linux') {
    throw new Error(`Callgrind profiling is only supported on Linux`)
  }
  await assertCommandAvailable('valgrind')
  await assertCommandAvailable('callgrind_control')
}
