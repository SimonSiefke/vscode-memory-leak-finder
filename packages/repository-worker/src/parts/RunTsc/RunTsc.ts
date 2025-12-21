import { VError } from '@lvce-editor/verror'
import { exec } from '../Exec/Exec.ts'

export interface TscResult {
  readonly exitCode: number
  readonly stderr: string
  readonly stdout: string
}

export const runTsc = async (cwd: string): Promise<TscResult> => {
  try {
    const result = await exec('npx', ['-y', 'tsc', '-p', '.'], { cwd, reject: false })
    return result
  } catch (error) {
    throw new VError(error, `Failed to run tsc in '${cwd}'`)
  }
}
