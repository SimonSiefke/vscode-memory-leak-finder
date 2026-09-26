import { readFile, realpath, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { isAbsolute, join } from 'node:path'

export const wrap = async (command: string, args: readonly string[], cgroupPath: string, platform: string = process.platform) => {
  if (platform !== 'linux') throw new Error('LINUX_CGROUP_PATH requires Linux')
  if (!isAbsolute(cgroupPath)) throw new Error('LINUX_CGROUP_PATH must be an absolute cgroup v2 directory')
  const path = await realpath(cgroupPath)
  await readFile(join(path, 'memory.current'), 'utf8')
  const procs = join(path, 'cgroup.procs')
  const events = await readFile(join(path, 'cgroup.events'), 'utf8')
  if (!/^populated 0$/m.test(events) || (await readFile(procs, 'utf8')).trim())
    throw new Error('LINUX_CGROUP_PATH must be empty before launching the application')
  await access(procs, constants.W_OK)
  // Positional arguments keep paths and application arguments out of shell source.
  // exec preserves the PID and joins before Electron can allocate or fork children.
  return {
    command: '/bin/sh',
    args: ['-c', 'printf "%s\\n" "$$" > "$1" || exit 1; shift; exec "$@"', 'linux-cgroup', procs, command, ...args],
  }
}
