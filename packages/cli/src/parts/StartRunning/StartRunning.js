import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as HandleTestStderrData from '../HandleTestStderrData/HandleTestStderrData.js'
import * as HandleTestStdoutData from '../HandleTestStdoutData/HandleTestStdoutData.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as RunTest from '../RunTest/RunTest.js'
import * as RunTestWatcher from '../RunTestWatcher/RunTestWatcher.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const startRunning = async (filterValue, headlessMode, color) => {
  Stdout.write(AnsiEscapes.clear)
  const cwd = process.cwd()
  const worker = await RunTest.prepare()
  HandleIpc.handleIpc(worker)
  worker.stdout.on('data', HandleTestStdoutData.handleStdoutData)
  worker.stderr.on('data', HandleTestStderrData.handleStderrData)
  JsonRpc.send(worker, TestWorkerCommandType.RunTests, cwd, filterValue, headlessMode, color)
  await RunTestWatcher.prepare(cwd)
}
