import * as StdoutWorker from '../StdoutWorker/StdoutWorker.ts'
import * as StdinDataState from '../StdinDataState/StdinDataState.ts'
import * as ExtractLineAndColumnFromStack from '../ExtractLineAndColumnFromStack/ExtractLineAndColumnFromStack.ts'

<<<<<<< HEAD
export const getHandleTestFailedMessage = async (
  file: string,
  relativeDirName: string,
  relativeFilePath: string,
  fileName: string,
  error: any,
): Promise<string> => {
  const baseMessage: string = await StdoutWorker.invoke(
=======
export const getHandleTestFailedMessage = (file, relativeDirName, relativeFilePath, fileName, error, wasOriginallySkipped) => {
  return StdoutWorker.invoke(
>>>>>>> origin/main
    'Stdout.getHandleTestFailedMessage',
    file,
    relativeDirName,
    relativeFilePath,
    fileName,
    error,
<<<<<<< HEAD
  )

  if (!StdinDataState.isGithubActions()) {
    return baseMessage
  }

  let line: number | undefined
  let col: number | undefined
  if (error && typeof error.stack === 'string' && typeof relativeFilePath === 'string') {
    const pos = ExtractLineAndColumnFromStack.extractLineAndColumnFromStack(error.stack, relativeFilePath)
    if (pos) {
      line = pos.line
      col = pos.col
    }
  }

  const annotation: string = await StdoutWorker.invoke('Stdout.getGitHubFileErrorMessage', error?.message || 'Test failed', {
    file: relativeFilePath,
    line,
    col,
    title: error?.type,
  })

  return `${annotation}${baseMessage}`
=======
    wasOriginallySkipped,
  )
>>>>>>> origin/main
}
