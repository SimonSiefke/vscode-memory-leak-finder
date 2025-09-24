import * as OriginalNameWorker from '../OriginalNameWorker/OriginalNameWorker.ts'

export const getOriginalClassNameFromFile = async (originalPath: string, originalLine: number, originalColumn: number): Promise<string> => {
  return OriginalNameWorker.invoke('OriginalName.getOriginalNameFromFile', originalPath, originalLine, originalColumn)
}
