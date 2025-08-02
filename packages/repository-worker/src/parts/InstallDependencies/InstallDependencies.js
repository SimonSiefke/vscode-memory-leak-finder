import { exec } from '../Exec/Exec.js'
import { VError } from '@lvce-editor/verror'

export const installDependencies = async (cwd, useNice) => {
  try {
    if (useNice) {
      console.log(`Using nice to reduce system resource usage...`)
      await exec('nice', ['-n', '10', 'npm', 'ci'], { cwd })
    } else {
      await exec('npm', ['ci'], { cwd })
    }
  } catch (error) {
    throw new VError(error, `Failed to install dependencies in directory '${cwd}'`)
  }
}
