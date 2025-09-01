import { VError } from '@lvce-editor/verror'
import { exec } from '../Exec/Exec.ts'

export interface TscResult {
  readonly stdout: string
  readonly stderr: string
  readonly exitCode: number
}

export const runTsc = async (cwd: string): Promise<TscResult> => {
  try {
    const result = await exec('npx', ['-y', 'tsc', '-p', '.'], { cwd })
    return result
  } catch (error) {
    throw new VError(error, `Failed to run tsc in '${cwd}'`)
  }
}
