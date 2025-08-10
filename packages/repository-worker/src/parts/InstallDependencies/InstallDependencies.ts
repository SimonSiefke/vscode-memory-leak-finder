import { exec } from '../Exec/Exec.ts'
import { VError } from '@lvce-editor/verror'

export const installDependencies = async (cwd, useNice) => {
  try {
    if (useNice) {
      await exec('nice', ['-n', '10', 'npm', 'ci'], { cwd })
    } else {
      await exec('npm', ['ci'], { cwd })
    }
  } catch (error) {
    throw new VError(error, `Failed to install dependencies in directory '${cwd}'`)
  }
}
