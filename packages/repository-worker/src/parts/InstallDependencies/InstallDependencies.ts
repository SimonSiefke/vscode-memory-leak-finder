import { VError } from '@lvce-editor/verror'
import { exec } from '../Exec/Exec.ts'

const doInstallDependencies = async (cwd, useNice) => {
  if (useNice) {
    return exec('nice', ['-n', '10', 'npm', 'ci'], { cwd, env: process.env })
  }
  return exec('npm', ['ci'], { cwd, env: process.env })
}

export const installDependencies = async (cwd, useNice) => {
  try {
    const child = doInstallDependencies(cwd, useNice)
    await child
  } catch (error) {
    throw new VError(error, `Failed to install dependencies in directory '${cwd}'`)
  }
}
