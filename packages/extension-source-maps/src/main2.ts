import { join } from 'node:path'
import * as AddOriginalSourcesToData from './parts/AddOriginalSourcesToData/AddOriginalSourcesToData.ts'
import { root } from './parts/Root/Root.ts'

const main2 = async (): Promise<void> => {
  const dataFilePath = join(
    root,
    '.vscode-memory-leak-finder-results',
    'extension-host',
    'named-function-count3',
    'chat-editor-add-numbers.json',
  )
  const version = 'v0.35.3'
  const outputFilePath = join(root, '.vscode-memory-leak-finder-results', 'extension-host', 'named-function-count3', 'result.json')

  await AddOriginalSourcesToData.addOriginalSourcesToData(dataFilePath, version, outputFilePath)
}

main2()
