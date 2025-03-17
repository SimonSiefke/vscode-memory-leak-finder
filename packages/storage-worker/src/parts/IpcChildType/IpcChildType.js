export const NodeForkedProcess = 1
export const NodeWorkerThread = 2

export const Auto = () => {
  if (process.argv.includes('--ipc-type=worker-thread')) {
    return NodeWorkerThread
  }
  if (process.argv.includes('--ipc-type=forked-process')) {
    return NodeForkedProcess
  }
  throw new Error(`unknown ipc type`)
}
