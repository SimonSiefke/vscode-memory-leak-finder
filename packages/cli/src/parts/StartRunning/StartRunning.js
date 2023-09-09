import * as AnsiEscapes from '../AnsiEscapes/AnsiEscapes.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as RunTest from '../RunTest/RunTest.js'
import * as Stdout from '../Stdout/Stdout.js'
import * as TestWorkerCommandType from '../TestWorkerCommandType/TestWorkerCommandType.js'

export const startRunning = async (filterValue, headlessMode, color, checkLeaks, recordVideo, runs) => {
  Stdout.write(AnsiEscapes.clear)
  const cwd = process.cwd()
  const worker = await RunTest.prepare()
  JsonRpc.send(worker, TestWorkerCommandType.RunTests, cwd, cwd, filterValue, headlessMode, color, checkLeaks, recordVideo, runs)
}
