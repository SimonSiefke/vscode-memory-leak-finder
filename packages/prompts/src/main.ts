import clipboard from 'clipboardy'
import { readFile } from 'fs/promises'
import { isAbsolute, join } from 'path'
import { getPrompt } from './getPrompt.ts'

const dirname = import.meta.dirname

const root = join(dirname, '..', '..', '..')

const localVscodePath = '/home/simon/.cache/repos/vscode'

<<<<<<< HEAD
const relativePath = `/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-memory-leak-finder-results/named-function-count3/editor.type-many-characters.json`
=======
const relativePath =
  '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-memory-leak-finder-results/named-function-count3/search.workspace-regex-replace.json'
>>>>>>> origin/main

const main = async () => {
  const absolutePath = isAbsolute(relativePath) ? relativePath : join(root, relativePath)
  const content = await readFile(absolutePath, 'utf8')
  const prompt = getPrompt(content, localVscodePath)
  await clipboard.write(prompt)
  process.stdout.write(prompt)
}

main()
