import { connectDevtools } from '../ConnectDevtools/ConnectDevtools.ts'
import { getFunctionStatistics } from '../GetFunctionStatistics/GetFunctionStatistics.ts'

export const commandMap = {
  'FunctionTracker.connectDevtools': connectDevtools,
  'FunctionTracker.getFunctionStatistics': getFunctionStatistics,
}
