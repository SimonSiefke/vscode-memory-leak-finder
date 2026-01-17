import { connectDevtools } from '../ConnectDevtools/ConnectDevtools.ts'
import { getFunctionStatistics } from '../GetFunctionStatistics/GetFunctionStatistics.ts'
import { writeFunctionStatistics } from '../WriteFunctionStatistics/WriteFunctionStatistics.ts'

export const commandMap = {
  'FunctionTracker.connectDevtools': connectDevtools,
  'FunctionTracker.getFunctionStatistics': getFunctionStatistics,
  'FunctionTracker.writeFunctionStatistics': writeFunctionStatistics,
}
