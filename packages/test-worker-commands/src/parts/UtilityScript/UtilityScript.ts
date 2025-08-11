import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'
import * as EncodingType from '../EncodingType/EncodingType.ts'

const injectedCode = readFileSync(join(Root.root, 'packages', 'injected-code', 'dist', 'injectedCode.ts'), EncodingType.Utf8)

export const utilityScript = injectedCode
