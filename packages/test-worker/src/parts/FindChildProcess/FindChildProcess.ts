export interface ProcessInfo {
  readonly command: string
  readonly pid: number
  readonly ppid: number
}

export const findChildProcess = (processes: readonly ProcessInfo[], rootPid: number, name: string): ProcessInfo | undefined => {
  const byPid = new Map(processes.map((process) => [process.pid, process]))
  const matches = processes.filter((process) => {
    if (!process.command.includes(name) || process.pid === rootPid) {
      return false
    }
    const seen = new Set<number>()
    let parent = process.ppid
    while (parent && !seen.has(parent)) {
      if (parent === rootPid) {
        return true
      }
      seen.add(parent)
      parent = byPid.get(parent)?.ppid ?? 0
    }
    return false
  })
  if (matches.length > 1) {
    throw new Error(`Multiple descendants of ${rootPid} match ${JSON.stringify(name)}: ${matches.map((process) => process.pid).join(', ')}`)
  }
  return matches[0]
}
