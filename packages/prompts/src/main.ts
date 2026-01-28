import clipboard from 'clipboardy'
import { readFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import { getPrompt } from './getPrompt.ts'

const { dirname } = import.meta

const root = join(dirname, '..', '..', '..')

const localVscodePath = '/home/simon/.cache/repos/vscode'

const relativePath = `/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-memory-leak-finder-results/detached-dom-nodes-with-stack-traces/settings-side-by-side.json`
const ourPath = `/home/simon/.cache/repos/vscode-memory-leak-finder`
const only = 'settings-side'
const runs = 97
const measure = 'detached-dom-nodes-with-stack-traces'

const main = async () => {
  const absolutePath = isAbsolute(relativePath) ? relativePath : join(root, relativePath)
  const content = await readFile(absolutePath, 'utf8')
  const prompt = getPrompt({
    content,
    localVscodePath,
    only,
    runs,
    ourPath,
    measure,
  })
  await clipboard.write(prompt)
  process.stdout.write(prompt)
}

main()
