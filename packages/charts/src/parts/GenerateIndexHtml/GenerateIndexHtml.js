import { writeFile } from 'fs/promises'
import { readdir } from 'node:fs/promises'
import { join } from 'path'
import * as Root from '../Root/Root.js'

const baseStructure = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Charts</title>
    <style>
      .Charts {
        margin: 0;
        padding: 0;
        list-style: none;
      }
    </style>
  </head>

  <body>
    CONTENT
  </body>

</html>
`

const getMiddleHtml = (dirents) => {
  let html = '<ul class="Charts">\n'
  for (const dirent of dirents) {
    if (!dirent.endsWith('.svg')) {
      continue
    }
    html += `      <li class="Chart"><img class="ChartImage" src="./${dirent}" alt="${dirent}"></li>\n`
  }
  html += '    </ul>'
  return html
}

export const generateIndexHtml = async () => {
  const outPath = join(Root.root, '.vscode-charts', `index.html`)
  const svgPath = join(Root.root, '.vscode-charts')
  const dirents = await readdir(svgPath)
  const middleHtml = getMiddleHtml(dirents)
  const html = baseStructure.replace('CONTENT', middleHtml)
  await writeFile(outPath, html)
}
