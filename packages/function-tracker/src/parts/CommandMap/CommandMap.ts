import { getFunctionStatistics } from '../GetFunctionStatistics/GetFunctionStatistics.ts'
import { preGenerateWorkbench } from '../PreGenerateWorkbench/PreGenerateWorkbench.ts'
import * as HttpServer from '../SocketServer/SocketServer.ts'
import { writeFunctionStatistics } from '../WriteFunctionStatistics/WriteFunctionStatistics.ts'

export const commandMap = {
  'FunctionTracker.getFunctionStatistics': getFunctionStatistics,
  'FunctionTracker.preGenerateWorkbench': preGenerateWorkbench,
  'FunctionTracker.startServer': HttpServer.startServer,
  'FunctionTracker.stopServer': HttpServer.stopServer,
  'FunctionTracker.writeFunctionStatistics': writeFunctionStatistics,
}
