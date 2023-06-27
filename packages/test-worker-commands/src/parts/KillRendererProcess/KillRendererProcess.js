import * as ListProcessesWithMemoryUsage from '../ListProcessesWithMemoryUsage/ListProcessesWithMemoryUsage.js'
import * as Process from '../Process/Process.js'

const getRendererProcessPid = (processes) => {
  for (const process of processes) {
    if (process.name === 'renderer') {
      return process.pid
    }
  }
  return -1
}

export const killRendererProcess = async (pid) => {
  const processes = await ListProcessesWithMemoryUsage.listProcessesWithMemoryUsage(pid)
  const rendererProcessPid = getRendererProcessPid(processes)
  if (rendererProcessPid === -1) {
    throw new Error(`no renderer process found`)
  }
  await Process.kill(rendererProcessPid)
}
