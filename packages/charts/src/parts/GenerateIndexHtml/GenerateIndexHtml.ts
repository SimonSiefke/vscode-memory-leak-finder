import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import * as Root from '../Root/Root.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const baseStructure = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>VSCode Memory Leak Finder Charts</title>
    <link rel="stylesheet" href="./styles.css">
  </head>

  <body>
    <header>
      <h1>VSCode Memory Leak Finder Charts</h1>
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

const copyAssetsToFolder = async (folderPath: string): Promise<void> => {
  const cssPath = join(__dirname, 'styles.css')
  const jsPath = join(__dirname, 'script.js')
  const cssContent = await readFile(cssPath, 'utf-8')
  const jsContent = await readFile(jsPath, 'utf-8')
  await writeFile(join(folderPath, 'styles.css'), cssContent)
  await writeFile(join(folderPath, 'script.js'), jsContent)
}

const generateIndexHtmlForFolder = async (folderPath: string, folderName: string): Promise<void> => {
  const outPath = join(folderPath, 'index.html')
  const dirents = await readdir(folderPath)

  // Copy CSS and JS files to this folder
  await copyAssetsToFolder(folderPath)

  // Use single column layout for named-function-count-3
  if (folderName === 'named-function-count-3') {
    const middleHtml = getSingleColumnHtml(dirents)
    const html = baseStructure.replace('CONTENT', middleHtml)
    await writeFile(outPath, html)
  } else {
    const middleHtml = getMiddleHtml(dirents)
    const html = baseStructure.replace('CONTENT', middleHtml)
    await writeFile(outPath, html)
  }
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
  html += '        <main class="ChartsContainer">\n'
  html += '          <ul class="Charts SingleColumn">\n'

  for (const svgFile of svgFiles) {
    const chartName = svgFile.replace('.svg', '')
    html += `            <li class="Chart" id="chart-${chartName}"><img class="ChartImage" src="./${svgFile}" alt="${svgFile}"></li>\n`
  }

  html += '          </ul>\n'
  html += '        </main>\n'
  html += '        <svg class="ArrowOverlay" id="arrowOverlay">\n'
  html += '          <path id="arrowPath" stroke="black" stroke-width="2" fill="none" opacity="0" />\n'
  html += '          <polygon id="arrowHead" points="0,0 12,6 0,12" fill="black" opacity="0" />\n'
  html += '        </svg>\n'
  html += '      </div>'
  return html
}

const generateIndexHtmlRecursively = async (basePath: string, dirents: string[]): Promise<void> => {
  for (const dirent of dirents) {
    const fullPath = join(basePath, dirent)
    const stats = await stat(fullPath)
    if (stats.isDirectory()) {
      const subDirContents = await readdir(fullPath)
      const hasSvgFiles = subDirContents.some((file) => file.endsWith('.svg'))
      if (hasSvgFiles) {
        await generateIndexHtmlForFolder(fullPath, dirent)
      }

      // Recursively process subdirectories
      const subDirs: string[] = []
      for (const item of subDirContents) {
        const itemPath = join(fullPath, item)
        const itemStats = await stat(itemPath)
        if (itemStats.isDirectory()) {
          subDirs.push(item)
        }
      }

      if (subDirs.length > 0) {
        await generateIndexHtmlRecursively(fullPath, subDirs)
      }
    }
  }
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
  await copyAssetsToFolder(svgPath)

  const dirents = await readdir(svgPath)
  const middleHtml = getMiddleHtml(dirents)
  const html = baseStructure.replace('CONTENT', middleHtml)
  await writeFile(outPath, html)

  // Generate index.html for subfolders that contain multiple SVG files
  await generateIndexHtmlRecursively(svgPath, dirents)
}
