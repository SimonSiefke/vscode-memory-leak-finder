import { connectDevtools } from '../ConnectDevtools/ConnectDevtools.ts'
import { getFunctionStatistics } from '../GetFunctionStatistics/GetFunctionStatistics.ts'
import * as SocketServer from '../SocketServer/SocketServer.ts'
import { writeFunctionStatistics } from '../WriteFunctionStatistics/WriteFunctionStatistics.ts'

export const commandMap = {
  'FunctionTracker.connectDevtools': connectDevtools,
  'FunctionTracker.getFunctionStatistics': getFunctionStatistics,
  'FunctionTracker.startSocketServer': SocketServer.startSocketServer,
  'FunctionTracker.stopSocketServer': SocketServer.stopSocketServer,
  'FunctionTracker.writeFunctionStatistics': writeFunctionStatistics,
}
