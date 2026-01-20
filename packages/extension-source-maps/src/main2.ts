import { join } from 'node:path'
import * as AddOriginalSourcesToData from './parts/AddOriginalSourcesToData/AddOriginalSourcesToData.ts'
import { root } from './parts/Root/Root.ts'

const main2 = async (): Promise<void> => {
  const dataFilePath = join(
    root,
    '.vscode-memory-leak-finder-results',
    'extension-host',
    'named-function-count3',
    'editor-inline-suggestion.json',
  )
  const version = 'v0.36.1'
  const outputFilePath = join(root, '.vscode-memory-leak-finder-results', 'extension-host', 'named-function-count3', 'result.json')

  await AddOriginalSourcesToData.addOriginalSourcesToData(dataFilePath, version, outputFilePath)
}

main2()
