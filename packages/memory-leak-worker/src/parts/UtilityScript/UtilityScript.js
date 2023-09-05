import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as Root from '../Root/Root.js'
import * as EncodingType from '../EncodingType/EncodingType.js'

const injectedCode = readFileSync(join(Root.root, 'packages', 'injected-code', 'dist', 'injectedCode.js'), EncodingType.Utf8)

export const utilityScript = injectedCode
