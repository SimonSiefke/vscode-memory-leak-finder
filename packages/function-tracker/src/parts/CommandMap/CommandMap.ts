import { getFunctionStatistics } from '../GetFunctionStatistics/GetFunctionStatistics.ts'
import * as HttpServer from '../SocketServer/SocketServer.ts'
import { preGenerateWorkbench } from '../PreGenerateWorkbench/PreGenerateWorkbench.ts'
import { writeFunctionStatistics } from '../WriteFunctionStatistics/WriteFunctionStatistics.ts'

export const commandMap = {
  'FunctionTracker.getFunctionStatistics': getFunctionStatistics,
  'FunctionTracker.startServer': HttpServer.startServer,
  'FunctionTracker.stopServer': HttpServer.stopServer,
  'FunctionTracker.preGenerateWorkbench': preGenerateWorkbench,
  'FunctionTracker.writeFunctionStatistics': writeFunctionStatistics,
}
