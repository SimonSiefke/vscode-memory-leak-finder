import { existsSync } from 'node:fs'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { escapeHtml } from '../EscapeHtml/EscapeHtml.ts'
import * as CopyAssetsToFolder from '../CopyAssetsToFolder/CopyAssetsToFolder.ts'
import * as GeneratePromiseStackTraceHtml from '../GeneratePromiseStackTraceHtml/GeneratePromiseStackTraceHtml.ts'
import * as Root from '../Root/Root.ts'

const getBaseStructure = (title: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <link rel="stylesheet" href="./styles.css">
  </head>

  <body>
    <header>
      <h1>${title}</h1>
    </header>
    <main class="Main">
      CONTENT
    </main>
    <script src="./script.js"></script>
  </body>

</html>
`

const getMiddleHtml = (dirents: string[]) => {
  let html = '<ul class="Charts">\n'
  for (const dirent of dirents) {
    if (!dirent.endsWith('.svg')) {
      continue
    }
    html += `        <li class="Chart"><img class="ChartImage" src="./${dirent}" alt="${dirent}"></li>\n`
  }
  html += '      </ul>'
  return html
}

const getLabeledChartsHtml = (dirents: string[]): string => {
  let html = '<ul class="Charts SingleColumn">\n'
  for (const dirent of dirents) {
    if (!dirent.endsWith('.svg')) {
      continue
    }
    const chartName = escapeHtml(dirent.slice(0, -4))
    const src = escapeHtml(encodeURIComponent(dirent))
    html += `        <li class="Chart"><h2 class="ChartTitle">${chartName}</h2><img class="ChartImage" src="./${src}" alt="${chartName}"></li>\n`
  }
  html += '      </ul>'
  return html
}

const singleColumnFolders = new Set([
  'compiled-code-size-by-file',
  'compiled-code-size-by-function',
  'cpu-profile',
  'file-descriptor-count',
  'named-function-count-3',
  'paint-events',
  'tracked-allocation-leaks',
  'tracked-allocation-performance',
  'tracked-allocations-by-file',
])

export const getFolderContentHtml = (folderName: string, dirents: string[]): string => {
  if (folderName === 'cpu-performance-counters') {
    return getLabeledChartsHtml(dirents)
  }
  if (singleColumnFolders.has(folderName)) {
    return getSingleColumnHtml(dirents)
  }
  return getMiddleHtml(dirents)
}

const generateIndexHtmlForFolder = async (folderPath: string, folderName: string): Promise<void> => {
  const outPath = join(folderPath, 'index.html')
  const dirents = await readdir(folderPath)

  // Copy CSS and JS files to this folder
  await CopyAssetsToFolder.copyAssetsToFolder(folderPath)

  const middleHtml = getFolderContentHtml(folderName, dirents)
  const html = getBaseStructure('VSCode Memory Leak Finder Charts').replace('CONTENT', middleHtml)
  await writeFile(outPath, html)
}

const getSingleColumnHtml = (dirents: string[]): string => {
  const svgFiles = dirents.filter((dirent) => dirent.endsWith('.svg'))

  let html = '<div class="Layout">\n'
  html += '        <nav class="Navigation">\n'
  html += '          <h3>Charts</h3>\n'
  html += '          <ul class="ChartList">\n'

  for (const svgFile of svgFiles) {
    const chartName = svgFile.replace('.svg', '')
    html += `            <li><a href="#chart-${chartName}" class="ChartLink">${chartName}</a></li>\n`
  }

  html += '          </ul>\n'
  html += '        </nav>\n'
  html += '        <div class="ChartsContainer">\n'
  html += '          <ul class="Charts SingleColumn">\n'

  for (const svgFile of svgFiles) {
    const chartName = svgFile.replace('.svg', '')
    html += `            <li class="Chart" id="chart-${chartName}"><img class="ChartImage" src="./${svgFile}" alt="${svgFile}"></li>\n`
  }

  html += '          </ul>\n'
  html += '        </div>\n'
  html += '        <svg class="ArrowOverlay" id="arrowOverlay">\n'
  html += '          <path id="arrowPath" stroke="black" stroke-width="2" fill="none" opacity="0" />\n'
  html += '          <polygon id="arrowHead" points="0,0 12,6 0,12" fill="black" opacity="0" />\n'
  html += '        </svg>\n'
  html += '      </div>'
  return html
}

const generateIndexHtmlRecursively = async (basePath: string): Promise<void> => {
  const foldersWithSvg = new Set<string>()

  const processDirectory = async (dirPath: string, relativePath: string = ''): Promise<void> => {
    const dirents = await readdir(dirPath, { withFileTypes: true })

    for (const dirent of dirents) {
      if (dirent.isFile() && dirent.name.endsWith('.svg')) {
        // This file is in the current directory
        foldersWithSvg.add(dirPath)
      } else if (dirent.isDirectory()) {
        // Recursively process subdirectories
        const subDirPath = join(dirPath, dirent.name)
        await processDirectory(subDirPath)
      }
    }
  }

  await processDirectory(basePath)

  // Generate index.html for each folder that has SVG files
  for (const folderPath of foldersWithSvg) {
    const folderName = folderPath.split('/').pop() || folderPath.split('\\').pop() || ''
    await generateIndexHtmlForFolder(folderPath, folderName)
  }
}

export const getExtensionHostOverviewHtml = (charts: readonly { folder: string; files: readonly string[] }[]): string => {
  const sections = charts
    .map(({ folder, files }) => {
      const images = files
        .map((file) => {
          const src = `./${encodeURIComponent(folder)}/${encodeURIComponent(file)}`
          const alt = escapeHtml(file)
          return `<li class="Chart"><img class="ChartImage" src="${src}" alt="${alt}"></li>`
        })
        .join('\n')
      return `<section><h2><a href="./${encodeURIComponent(folder)}/index.html">${escapeHtml(folder)}</a></h2><ul class="Charts">\n${images}\n</ul></section>`
    })
    .join('\n')
  return getBaseStructure('VS Code Extension Host Memory Charts').replace(
    'CONTENT',
    `<p><a href="../index.html">All process charts</a></p>${sections}`,
  )
}

const generateExtensionHostOverview = async (chartsPath: string): Promise<boolean> => {
  const extensionHostPath = join(chartsPath, 'extension-host')
  if (!existsSync(extensionHostPath)) {
    return false
  }
  const entries = await readdir(extensionHostPath, { withFileTypes: true })
  const charts: { folder: string; files: string[] }[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue
    }
    const chartFolderPath = join(extensionHostPath, entry.name)
    const chartFiles = await readdir(chartFolderPath)
    const svgFiles = chartFiles.filter((file) => file.endsWith('.svg'))
    if (svgFiles.length > 0) {
      charts.push({ folder: entry.name, files: svgFiles })
    }
  }
  if (charts.length === 0) {
    return false
  }
  await CopyAssetsToFolder.copyAssetsToFolder(extensionHostPath)
  await writeFile(join(extensionHostPath, 'index.html'), getExtensionHostOverviewHtml(charts))
  return true
}

export const generateIndexHtml = async (): Promise<void> => {
  const outPath = join(Root.root, '.vscode-charts', `index.html`)
  const svgPath = join(Root.root, '.vscode-charts')

  // Check if the directory exists before trying to read it
  if (!existsSync(svgPath)) {
    // Create the directory if it doesn't exist
    await mkdir(svgPath, { recursive: true })
  }

  // Copy CSS and JS files to root .vscode-charts directory
  await CopyAssetsToFolder.copyAssetsToFolder(svgPath)

  const dirents = await readdir(svgPath)
  let middleHtml = getMiddleHtml(dirents)
  if (await generateExtensionHostOverview(svgPath)) {
    middleHtml += '\n<p><a href="./extension-host/index.html">Extension host charts</a></p>'
  }
  const html = getBaseStructure('VSCode Memory Leak Finder Charts').replace('CONTENT', middleHtml)
  await writeFile(outPath, html)

  // Generate index.html for subfolders that contain multiple SVG files
  await generateIndexHtmlRecursively(svgPath)

  // Generate HTML for promise stack traces
  await GeneratePromiseStackTraceHtml.generatePromiseStackTraceHtml()
}
