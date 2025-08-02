import { execa } from 'execa'
import { VError } from '@lvce-editor/verror'

export const installDependencies = async (cwd, useNice) => {
  try {
    if (useNice) {
      console.log(`Using nice to reduce system resource usage...`)
      await execa('nice', ['-n', '10', 'npm', 'ci'], { cwd })
    } else {
      await execa('npm', ['ci'], { cwd })
    }
  } catch (error) {
    throw new VError(error, `Failed to install dependencies in directory '${cwd}'`)
  }
}
