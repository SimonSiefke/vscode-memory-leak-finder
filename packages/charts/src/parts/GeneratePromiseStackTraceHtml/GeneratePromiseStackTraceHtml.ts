import { basename, join } from 'node:path'
import { existsSync } from 'node:fs'
import * as Root from '../Root/Root.ts'
import * as FindPromiseStackTraceFolders from '../FindPromiseStackTraceFolders/FindPromiseStackTraceFolders.ts'
import * as GeneratePromiseStackTraceHtmlForFolder from '../GeneratePromiseStackTraceHtmlForFolder/GeneratePromiseStackTraceHtmlForFolder.ts'

export const generatePromiseStackTraceHtml = async (): Promise<void> => {
  const resultsPath = join(Root.root, '.vscode-memory-leak-finder-results')
  if (!existsSync(resultsPath)) {
    return
  }

  const folders = await FindPromiseStackTraceFolders.findPromiseStackTraceFolders(resultsPath)

  for (const folderPath of folders) {
    const folderName = basename(folderPath)
    await GeneratePromiseStackTraceHtmlForFolder.generatePromiseStackTraceHtmlForFolder(folderPath, folderName)
  }
}

