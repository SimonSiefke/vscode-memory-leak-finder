import { applyFileOperations } from '../ApplyFileOperations/ApplyFileOperations.ts'
import { exec } from '../Exec/Exec.ts'
import { findFiles, pathExists, readFileContent } from '../Filesystem/Filesystem.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'FileSystem.applyFileOperations': applyFileOperations,
  'FileSystem.findFiles': findFiles,
  'FileSystem.exits': pathExists,
  'FileSystem.readFileContent': readFileContent,
  'FileSystem.exec': exec,
}
