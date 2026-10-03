import { getFunctionStatistics } from '../GetFunctionStatistics/GetFunctionStatistics.ts'
import { preGenerateWorkbench } from '../PreGenerateWorkbench/PreGenerateWorkbench.ts'
import { getPreparedVscodePath } from '../PrepareTrackedVscode/PrepareTrackedVscode.ts'
import { writeFunctionStatistics } from '../WriteFunctionStatistics/WriteFunctionStatistics.ts'

export const commandMap = {
  'FunctionTracker.getFunctionStatistics': getFunctionStatistics,
  'FunctionTracker.preGenerateWorkbench': preGenerateWorkbench,
  'FunctionTracker.getPreparedVscodePath': getPreparedVscodePath,
  'FunctionTracker.writeFunctionStatistics': writeFunctionStatistics,
}
