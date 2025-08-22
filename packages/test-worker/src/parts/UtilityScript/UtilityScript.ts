import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as EncodingType from '../EncodingType/EncodingType.ts'
import * as Root from '../Root/Root.ts'

const injectedCode = readFileSync(join(Root.root, 'packages', 'injected-code', 'dist', 'injectedCode.js'), EncodingType.Utf8)

export const utilityScript = injectedCode
