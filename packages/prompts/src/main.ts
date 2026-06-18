import clipboard from 'clipboardy'
import { readFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import { getPrompt } from './getPrompt.ts'

const { dirname } = import.meta

const root = join(dirname, '..', '..', '..')

const localVscodePath = '/home/simon/.cache/repos/vscode'

const relativePath = `/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-memory-leak-finder-results/extension-host/named-function-count3/chat-editor-fix-node-built-in-test.0.json`
const ourPath = `/home/simon/.cache/repos/vscode-memory-leak-finder`
const only = 'chat-editor-fix-node-built-in-test'
const runs = 17
const measure = 'named-function-count3'
const extraArgs = ''

const main = async () => {
  const absolutePath = isAbsolute(relativePath) ? relativePath : join(root, relativePath)
  const content = await readFile(absolutePath, 'utf8')
  const prompt = getPrompt({
    content,
    extraArgs,
    localVscodePath,
    measure,
    only,
    ourPath,
    runs,
  })
  await clipboard.write(prompt)
  process.stdout.write(prompt)
}

main()
