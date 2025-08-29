import * as OriginalNameWorker from '../OriginalNameWorker/OriginalNameWorker.ts'

export const getOriginalClassName = async (sourceContent: string, originalLine: number, originalColumn: number): Promise<string> => {
  return OriginalNameWorker.invoke('OriginalName.getOriginalName', sourceContent, originalLine, originalColumn)
}
