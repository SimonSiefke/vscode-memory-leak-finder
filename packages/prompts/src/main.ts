import clipboard from 'clipboardy'
import { readFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import { getPrompt } from './getPrompt.ts'

const { dirname } = import.meta

const root = join(dirname, '..', '..', '..')

const localVscodePath = '/home/simon/.cache/repos/vscode'

const relativePath = `/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-memory-leak-finder-results/node/named-function-count3/window-open-new.json`

const main = async () => {
  const absolutePath = isAbsolute(relativePath) ? relativePath : join(root, relativePath)
  const content = await readFile(absolutePath, 'utf8')
  const prompt = getPrompt(content, localVscodePath)
  await clipboard.write(prompt)
  process.stdout.write(prompt)
}

main()
