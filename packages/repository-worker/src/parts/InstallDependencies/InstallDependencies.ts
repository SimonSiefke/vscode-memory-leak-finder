import { VError } from '@lvce-editor/verror'
import { exec } from '../Exec/Exec.ts'
import { join } from 'node:path'
import { rm } from 'node:fs/promises'

const doInstallDependencies = async (cwd: string, useNice: boolean) => {
  if (useNice) {
    return exec('nice', ['-n', '10', 'npm', 'ci'], { cwd, env: process.env })
  }
  return exec('npm', ['ci'], { cwd, env: process.env })
}


const removePotentiallyConflictingFiles=async (cwd:string):Promise<void>=>{
  const toRemove=[
    '/test/mcp/node_modules/npm-run-all/node_modules/which/bin'
  ]
  const absolutePaths=toRemove.map(item=>{
    return join(cwd, item )
  })
  for(const item of absolutePaths){
    await rm(item, {recursive:true,force:true })
  }
}

export const installDependencies = async (cwd: string, useNice: boolean): Promise<void> => {
  try {
    const child = doInstallDependencies(cwd, useNice)
    await removePotentiallyConflictingFiles(cwd)
    await child
  } catch (error) {
    throw new VError(error, `Failed to install dependencies in directory '${cwd}'`)
  }
}
