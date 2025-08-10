import * as TestPrefix from '../TestPrefix/TestPrefix.ts'

export const getHandleTestSetupMessage = async (): Promise<string> => {
  return `\n${TestPrefix.Setup}\n`
}
