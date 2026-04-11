import { VError } from '@lvce-editor/verror'

export const wrapTestStageError = (error: unknown, stage: string, file: string): Error => {
  return new VError(error, `Failed to ${stage} test ${file}`)
}
