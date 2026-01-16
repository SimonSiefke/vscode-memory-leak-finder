import fs from 'fs'
import { transformCode } from '../src/parts/TransformScript/TransformScript.ts'

// VS Code installation path
const vscodePath: string =
  '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-test/vscode-linux-x64-1.108.0/resources/app/out/vs/workbench/workbench.desktop.main.js'
const outputPath: string = '/home/simon/.cache/repos/vscode-memory-leak-finder/packages/function-tracker/workbench.desktop.main.tracked.js'

console.log('Reading VS Code workbench file...')
const originalCode: string = fs.readFileSync(vscodePath, 'utf8')

console.log('Transforming code with function call tracking...')
const transformedCode: string = await transformCode(originalCode, vscodePath)

console.log('Writing transformed code...')
fs.writeFileSync(outputPath, transformedCode)

console.log(`Transformed code written to: ${outputPath}`)
console.log('Original size:', originalCode.length, 'characters')
console.log('Transformed size:', transformedCode.length, 'characters')
console.log('Size increase:', Math.round(((transformedCode.length - originalCode.length) / originalCode.length) * 100), '%')
