import { VError } from '@lvce-editor/verror'
import { exec } from '../Exec/Exec.ts'
import * as GetNpmPathFromNvmrc from '../GetNpmPathFromNvmrc/GetNpmPathFromNvmrc.ts'
import { dirname } from 'path'

const doInstallDependencies = async (cwd: string, useNice: boolean) => {
  const npmPath = await GetNpmPathFromNvmrc.getNpmPathFromNvmrc(cwd)
  const binDirname = dirname(npmPath)
  const oldPath = process.env.PATH
  const newPath = `${binDirname}:${oldPath}`
  if (useNice) {
    return exec('nice', ['-n', '10', npmPath, 'ci'], {
      cwd,
      env: {
        ...process.env,
        PATH: newPath,
      },
      stdio: 'inherit',
    })
  }
  return exec(npmPath, ['ci'], { cwd, env: { ...process.env, PATH: newPath }, stdio: 'inherit' })
}

export const installDependencies = async (cwd: string, useNice: boolean): Promise<void> => {
  try {
    const child = doInstallDependencies(cwd, useNice)
    await child
  } catch (error) {
    throw new VError(error, `Failed to install dependencies in directory '${cwd}'`)
  }
}
