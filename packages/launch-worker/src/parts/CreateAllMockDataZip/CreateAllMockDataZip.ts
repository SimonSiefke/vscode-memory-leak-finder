import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import JSZip from 'jszip'
import * as Root from '../Root/Root.ts'

const allMockDataDirectories = [
  '.vscode-user-data-dir',
  '.vscode-mock-requests',
  '.vscode-proxy-certs',
  '.vscode-sse-data',
  '.vscode-requests',
]

const outputDirectoryName = '.all-mock-data-zip'
const outputFileName = 'all-mock-data.zip'

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

const addDirectoryToZip = async (zip: JSZip, rootDirectory: string, sourceDirectory: string): Promise<void> => {
  const entries = await readdir(sourceDirectory, { withFileTypes: true })
  for (const entry of entries) {
    const entryPath = join(sourceDirectory, entry.name)
    if (entry.isDirectory()) {
      await addDirectoryToZip(zip, rootDirectory, entryPath)
      continue
    }
    if (!entry.isFile()) {
      continue
    }
    const relativePath = relative(rootDirectory, entryPath).split('\\').join('/')
    zip.file(relativePath, await readFile(entryPath))
  }
}

export const createAllMockDataZip = async (
  rootDirectory: string = Root.root,
): Promise<{ readonly outputDirectory: string; readonly outputFilePath: string; readonly includedDirectories: readonly string[] }> => {
  const outputDirectory = join(rootDirectory, outputDirectoryName)
  const outputFilePath = join(outputDirectory, outputFileName)
  await rm(outputDirectory, { force: true, recursive: true })
  await mkdir(outputDirectory, { recursive: true })

  const zip = new JSZip()
  const includedDirectories: string[] = []

  for (const directoryName of allMockDataDirectories) {
    const sourceDirectory = join(rootDirectory, directoryName)
    if (!(await pathExists(sourceDirectory))) {
      continue
    }
    includedDirectories.push(directoryName)
    await addDirectoryToZip(zip, rootDirectory, sourceDirectory)
  }

  const zipContent = await zip.generateAsync({
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
    type: 'nodebuffer',
  })
  await writeFile(outputFilePath, zipContent)
  return {
    outputDirectory,
    outputFilePath,
    includedDirectories,
  }
}
