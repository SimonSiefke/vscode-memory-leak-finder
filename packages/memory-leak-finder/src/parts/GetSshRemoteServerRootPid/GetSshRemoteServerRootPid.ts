import { readdir, readFile } from 'node:fs/promises'
import { platform } from 'node:os'

type Dependencies = {
  readonly getPlatform: () => NodeJS.Platform
  readonly listProcessIds: () => Promise<readonly number[]>
  readonly readCommandLine: (pid: number) => Promise<string>
}

const isShellBootstrapCommand = (commandLine: string): boolean => {
  return commandLine.includes('vscode-server') && (commandLine.includes('server.sh') || commandLine.includes('code-server.sh'))
}

const isServerNodeCommand = (commandLine: string): boolean => {
  return commandLine.includes('vscode-server') && commandLine.includes('/server/node')
}

const listProcessIds = async (): Promise<readonly number[]> => {
  const entries = await readdir('/proc', { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => Number.parseInt(entry.name, 10))
    .filter((pid) => !Number.isNaN(pid))
}

const readCommandLine = async (pid: number): Promise<string> => {
  const contents = await readFile(`/proc/${pid}/cmdline`, 'utf8')
  return contents.replaceAll('\u0000', ' ').trim()
}

export const createGetSshRemoteServerRootPid = (dependencies: Dependencies) => {
  return async (): Promise<number | undefined> => {
    if (dependencies.getPlatform() !== 'linux') {
      return undefined
    }
    const processIds = await dependencies.listProcessIds()
    const sortedProcessIds = [...processIds].toSorted((left, right) => right - left)
    let nodeCandidate: number | undefined
    for (const pid of sortedProcessIds) {
      try {
        const commandLine = await dependencies.readCommandLine(pid)
        if (!commandLine) {
          continue
        }
        if (isShellBootstrapCommand(commandLine)) {
          return pid
        }
        if (nodeCandidate === undefined && isServerNodeCommand(commandLine)) {
          nodeCandidate = pid
        }
      } catch {
        // ignore processes that exited while scanning /proc
      }
    }
    return nodeCandidate
  }
}

export const getSshRemoteServerRootPid = createGetSshRemoteServerRootPid({
  getPlatform: platform,
  listProcessIds,
  readCommandLine,
})