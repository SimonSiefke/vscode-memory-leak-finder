import { applyFileOperations } from '../ApplyFileOperations/ApplyFileOperations.js'
import { exec } from '../Exec/Exec.js'
import { findFiles, pathExists, readFileContent } from '../Filesystem/Filesystem.js'

export const commandMap = {
  'FileSystem.applyFileOperations': applyFileOperations,
  'FileSystem.findFiles': findFiles,
  'FileSystem.exits': pathExists,
  'FileSystem.readFileContent': readFileContent,
  'FileSystem.exec': exec,
}
