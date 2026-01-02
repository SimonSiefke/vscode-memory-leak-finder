import { readFile } from 'fs/promises'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const copyAssetsToFolder = async (folderPath: string): Promise<void> => {
  const cssPath = join(__dirname, '..', 'GenerateIndexHtml', 'styles.css')
  const jsPath = join(__dirname, '..', 'GenerateIndexHtml', 'script.js')
  const cssContent = await readFile(cssPath, 'utf-8')
  const jsContent = await readFile(jsPath, 'utf-8')
  await writeFile(join(folderPath, 'styles.css'), cssContent)
  await writeFile(join(folderPath, 'script.js'), jsContent)
}

