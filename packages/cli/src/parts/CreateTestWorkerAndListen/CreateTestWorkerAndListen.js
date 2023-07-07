import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as HandleTestStderrData from '../HandleTestStderrData/HandleTestStderrData.js'
import * as HandleTestStdoutData from '../HandleTestStdoutData/HandleTestStdoutData.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'
import * as TestWorker from '../TestWorker/TestWorker.js'

export const createTestWorkerAndListen = async () => {
  const worker = await TestWorker.listen(IpcParentType.NodeWorkerThread)
  HandleIpc.handleIpc(worker)
  worker.stdout.on('data', HandleTestStdoutData.handleStdoutData)
  worker.stderr.on('data', HandleTestStderrData.handleStderrData)
  return worker
}
