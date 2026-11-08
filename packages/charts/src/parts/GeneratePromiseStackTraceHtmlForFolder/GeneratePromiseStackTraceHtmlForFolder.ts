import { readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'url'
import * as CopyAssetsToFolder from '../CopyAssetsToFolder/CopyAssetsToFolder.ts'
import * as EscapeHtml from '../EscapeHtml/EscapeHtml.ts'
import * as FormatStackTrace from '../FormatStackTrace/FormatStackTrace.ts'
import * as GetChartConfig from '../GetChartConfig/GetChartConfig.ts'
import * as GetCodeFrame from '../GetCodeFrame/GetCodeFrame.ts'
import { launchChartWorker } from '../LaunchChartWorker/LaunchChartWorker.ts'
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
    <script src="./script.js"></script>
  </body>

</html>
`

const copyPromiseStackTraceCss = async (folderPath: string): Promise<void> => {
  const cssPath = join(__dirname, 'promise-stack-traces.css')
  const cssContent = await readFile(cssPath, 'utf-8')
  await writeFile(join(folderPath, 'promise-stack-traces.css'), cssContent)
}

const getStackLines = (stackTrace: string | string[]): string[] =>
  (Array.isArray(stackTrace) ? stackTrace : stackTrace.split('\n')).filter((line) => line.trim())

const getPromiseStack = (item: any): string[] => {
  const originalStack = getStackLines(item.originalStack || '')
  return originalStack.length > 0 ? originalStack : getStackLines(item.stackTrace || '')
}

const getPromiseTitle = (stackTrace: string | string[]): string => {
  const firstLine = getStackLines(stackTrace)[0]
    ?.trim()
    .replace(/^at\s+/, '')
    .replace(/^.*\((.*)\)$/, '$1')

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

  await using rpc = await launchChartWorker()
  const config = GetChartConfig.getChartConfig()
  let content = ''
  let hasResults = false

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

    hasResults = true
    const scenario = jsonFile.replace(/\.json$/, '')
    const chartFile = `${scenario}.svg`
    const svg = await rpc.invoke(
      'Chart.create',
      items.map((item) => ({ count: item.count || 0, delta: item.delta || 0, name: getPromiseTitle(getPromiseStack(item)) })),
      { type: 'dual-bar-chart', fontSize: 12, marginLeft: 400, marginRight: 100, width: 1400, compress: config.compress },
    )
    await writeFile(join(targetFolderPath, chartFile), svg)
    content += `<section class="PromiseScenario">\n<h2>${EscapeHtml.escapeHtml(scenario)}</h2>\n`
    content += `<div class="PromiseChartScroll"><img class="PromiseChart" src="./${EscapeHtml.escapeHtml(encodeURIComponent(chartFile))}" alt="Promise counts and increases for ${EscapeHtml.escapeHtml(scenario)}"></div>\n`

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      // Prefer originalStack (original locations) over stackTrace (minified locations)
      const stackTrace = getPromiseStack(item)
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

      const codeFrame = stackTrace[0] ? await GetCodeFrame.getCodeFrame(stackTrace[0], item.sourcesHash) : null
      if (codeFrame) {
        content += '  <div class="CodeFrame"><h4>Source</h4>\n'
        content += `    <pre><code>${EscapeHtml.escapeHtml(codeFrame)}</code></pre>\n`
        content += '  </div>\n'
      } else {
        content += '  <p class="CodeFrameUnavailable">Source code unavailable for this location.</p>\n'
      }

      const formattedStackTrace = FormatStackTrace.formatStackTrace(stackTrace)
      const escapedStackTrace = EscapeHtml.escapeHtml(formattedStackTrace || '(no stack trace)')

      content += '  <div class="CodeBlock">\n'
      content += '    <h4>Stack trace</h4><pre><code>'
      content += escapedStackTrace
      content += '</code></pre>\n'
      content += '  </div>\n'

      content += '</div>\n'
    }
    content += '</section>\n'
  }

  if (hasResults) {
    const outPath = join(targetFolderPath, 'index.html')
    const html = promiseStackTraceStructure.replace('CONTENT', content)
    await CopyAssetsToFolder.copyAssetsToFolder(targetFolderPath)
    await copyPromiseStackTraceCss(targetFolderPath)
    await writeFile(outPath, html)
  }
}
