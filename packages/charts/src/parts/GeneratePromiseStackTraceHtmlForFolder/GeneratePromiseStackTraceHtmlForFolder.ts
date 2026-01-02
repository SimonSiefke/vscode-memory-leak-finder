import { readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'url'
import * as CopyAssetsToFolder from '../CopyAssetsToFolder/CopyAssetsToFolder.ts'
import * as EscapeHtml from '../EscapeHtml/EscapeHtml.ts'
import * as FormatStackTrace from '../FormatStackTrace/FormatStackTrace.ts'
import * as GetCodeFrame from '../GetCodeFrame/GetCodeFrame.ts'
import * as ReadJson from '../ReadJson/ReadJson.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const promiseStackTraceStructure = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Promise Stack Traces</title>
    <link rel="stylesheet" href="./styles.css">
    <link rel="stylesheet" href="./promise-stack-traces.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css">
  </head>

  <body>
    <header>
      <h1>Promise Stack Traces</h1>
    </header>
    <main class="Main">
      <div class="PromiseStackTraces">
        CONTENT
      </div>
    </main>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
    <script src="./script.js"></script>
  </body>

</html>
`

const copyPromiseStackTraceCss = async (folderPath: string): Promise<void> => {
  const cssPath = join(__dirname, 'promise-stack-traces.css')
  const cssContent = await readFile(cssPath, 'utf-8')
  await writeFile(join(folderPath, 'promise-stack-traces.css'), cssContent)
}

const getPromiseTitle = (stackTrace: string | string[]): string => {
  let firstLine: string | undefined
  if (Array.isArray(stackTrace)) {
    firstLine = stackTrace[0]
  } else if (typeof stackTrace === 'string') {
    const lines = stackTrace.split('\n')
    firstLine = lines[0]
  }

  if (!firstLine) {
    return 'Promise'
  }

  // Format: "src/vs/editor/contrib/find/browser/findWidget.ts:381:69"
  const match = firstLine.match(/^(.+):(\d+):(\d+)$/)
  if (match) {
    const [, filePath, line, column] = match
    const fileName = basename(filePath)
    return `${fileName}:${line}:${column}`
  }

  return 'Promise'
}

export const generatePromiseStackTraceHtmlForFolder = async (
  sourceFolderPath: string,
  targetFolderPath: string,
  folderName: string,
): Promise<void> => {
  const dirents = await readdir(sourceFolderPath)
  const jsonFiles = dirents.filter((file) => file.endsWith('.json'))

  if (jsonFiles.length === 0) {
    return
  }

  let content = ''

  for (const jsonFile of jsonFiles) {
    const filePath = join(sourceFolderPath, jsonFile)
    const data = await ReadJson.readJson(filePath)

    // Handle different data structures
    let items: any[] = []
    if (Array.isArray(data)) {
      items = data
    } else if (data && typeof data === 'object') {
      if ('result' in data && Array.isArray(data.result)) {
        items = data.result
      } else if ('promisesWithStackTrace' in data && Array.isArray(data.promisesWithStackTrace)) {
        items = data.promisesWithStackTrace
      } else if ('leaked' in data && Array.isArray(data.leaked)) {
        items = data.leaked
      } else {
        // Try to find any array property that might contain the results
        for (const key in data) {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            const firstItem = data[key][0]
            if (firstItem && (firstItem.stackTrace || firstItem.originalStack)) {
              items = data[key]
              break
            }
          }
        }
      }
    }

    if (items.length === 0) {
      continue
    }

    content += `<h2>${EscapeHtml.escapeHtml(jsonFile.replace('.json', ''))}</h2>\n`

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      // Prefer originalStack (original locations) over stackTrace (minified locations)
      const stackTrace = item.originalStack || item.stackTrace || ''
      const count = item.count || 0
      const delta = item.delta || 0
      const properties = item.properties || {}

      const promiseTitle = getPromiseTitle(stackTrace)

      content += '<div class="PromiseItem">\n'
      content += '  <div class="PromiseItemHeader">\n'
      content += `    <h3>${EscapeHtml.escapeHtml(promiseTitle)}</h3>\n`
      content += '    <div class="PromiseItemMeta">\n'
      content += `      <span>Count: ${count}</span>\n`
      content += `      <span>Delta: ${delta}</span>\n`
      if (Object.keys(properties).length > 0) {
        content += `      <span>Properties: ${Object.keys(properties).length}</span>\n`
      }
      content += '    </div>\n'
      content += '  </div>\n'

      // Add code frame for first stack trace line only
      if (item.originalStack && Array.isArray(item.originalStack) && item.originalStack.length > 0) {
        const firstStackLine = item.originalStack[0]
        const codeFrame = await GetCodeFrame.getCodeFrame(firstStackLine)
        if (codeFrame) {
          content += '  <div class="CodeFrame">\n'
          content += '    <pre class="line-numbers"><code class="language-typescript">'
          content += EscapeHtml.escapeHtml(codeFrame)
          content += '</code></pre>\n'
          content += '  </div>\n'
        }
      }

      // Format stack trace without the first line
      let stackTraceWithoutFirstLine: string | string[] = stackTrace
      if (Array.isArray(stackTrace)) {
        stackTraceWithoutFirstLine = stackTrace.slice(1)
      } else if (typeof stackTrace === 'string') {
        const lines = stackTrace.split('\n')
        stackTraceWithoutFirstLine = lines.slice(1).join('\n')
      }

      const formattedStackTraceWithoutFirstLine = FormatStackTrace.formatStackTrace(stackTraceWithoutFirstLine)
      const escapedStackTraceWithoutFirstLine = formattedStackTraceWithoutFirstLine ? EscapeHtml.escapeHtml(formattedStackTraceWithoutFirstLine) : '(no stack trace)'

      content += '  <div class="CodeBlock">\n'
      content += '    <pre><code class="language-javascript">'
      content += escapedStackTraceWithoutFirstLine
      content += '</code></pre>\n'
      content += '  </div>\n'

      content += '</div>\n'
    }
  }

  if (content) {
    const outPath = join(targetFolderPath, 'index.html')
    const html = promiseStackTraceStructure.replace('CONTENT', content)
    await CopyAssetsToFolder.copyAssetsToFolder(targetFolderPath)
    await copyPromiseStackTraceCss(targetFolderPath)
    await writeFile(outPath, html)
  }
}
