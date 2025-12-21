import { applyFileOperations } from '../ApplyFileOperations/ApplyFileOperations.ts'
import { exec } from '../Exec/Exec.ts'
import { findFiles, pathExists, readFileContent, makeDirectory, writeFileContent } from '../Filesystem/Filesystem.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'FileSystem.applyFileOperations': applyFileOperations,
  'FileSystem.exec': exec,
  'FileSystem.exists': pathExists,
  'FileSystem.findFiles': findFiles,
  'FileSystem.makeDirectory': makeDirectory,
  'FileSystem.readFileContent': readFileContent,
  'FileSystem.writeFileContent': writeFileContent,
}
