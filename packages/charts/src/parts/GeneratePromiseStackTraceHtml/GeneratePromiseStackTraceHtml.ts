import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { basename, join, relative } from 'node:path'
import * as FindPromiseStackTraceFolders from '../FindPromiseStackTraceFolders/FindPromiseStackTraceFolders.ts'
import * as GeneratePromiseStackTraceHtmlForFolder from '../GeneratePromiseStackTraceHtmlForFolder/GeneratePromiseStackTraceHtmlForFolder.ts'
import * as Root from '../Root/Root.ts'

export const generatePromiseStackTraceHtml = async (): Promise<void> => {
  const resultsPath = join(Root.root, '.vscode-memory-leak-finder-results')
  const chartsPath = join(Root.root, '.vscode-charts')

  if (!existsSync(resultsPath)) {
    return
  }

  if (!existsSync(chartsPath)) {
    await mkdir(chartsPath, { recursive: true })
  }

  const folders = await FindPromiseStackTraceFolders.findPromiseStackTraceFolders(resultsPath)

  for (const folderPath of folders) {
    const folderName = basename(folderPath)
    const relativePath = relative(resultsPath, folderPath)
    const targetFolderPath = join(chartsPath, relativePath)
    await mkdir(targetFolderPath, { recursive: true })
    await GeneratePromiseStackTraceHtmlForFolder.generatePromiseStackTraceHtmlForFolder(folderPath, targetFolderPath, folderName)
  }
}
