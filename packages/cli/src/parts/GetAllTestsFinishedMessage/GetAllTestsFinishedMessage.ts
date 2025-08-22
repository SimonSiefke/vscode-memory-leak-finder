import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'

export const getAllTestsFinishedMessage = async (
  passed: number,
  failed: number,
  skipped: number,
  leaked: number,
  total: number,
  duration: number,
  filterValue: string,
  isWatchMode: boolean,
): Promise<string> => {
  return StdoutWorker.invoke(
    'Stdout.getAllTestsFinishedMessage',
    passed,
    failed,
    skipped,
    leaked,
    total,
    duration,
    filterValue,
    isWatchMode,
  )
}
