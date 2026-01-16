import fs from 'fs'
import path from 'path'
import { transformCode } from './transform-script.js'

// VS Code installation path
const vscodePath = '/home/simon/.cache/repos/vscode/out/vs/workbench/workbench.desktop.main.js'
const outputPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/packages/function-tracker/workbench.desktop.main.tracked.js'

console.log('Reading VS Code workbench file...')
const originalCode = fs.readFileSync(vscodePath, 'utf8')

console.log('Transforming code with function call tracking...')
const transformedCode = transformCode(originalCode, vscodePath)

console.log('Writing transformed code...')
fs.writeFileSync(outputPath, transformedCode)

console.log(`Transformed code written to: ${outputPath}`)
console.log('Original size:', originalCode.length, 'characters')
console.log('Transformed size:', transformedCode.length, 'characters')
console.log('Size increase:', Math.round(((transformedCode.length - originalCode.length) / originalCode.length) * 100), '%')
