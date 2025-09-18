import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const writeNodeResult = async (nodeProcessId: string, measure: string, testName: string, result: any): Promise<void> => {
  const fileName = testName.replace('.js', '.json').replace('.ts', '.json')
  const resultPath = join(Root.root, '.vscode-memory-leak-finder-results', 'node', nodeProcessId, measure, fileName)
  const dir = dirname(resultPath)
  await mkdir(dir, { recursive: true })
  await writeFile(resultPath, JSON.stringify(result, null, 2) + '\n')
}
