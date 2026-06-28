import { expect, test } from '@jest/globals'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as Root from '../src/parts/Root/Root.ts'
import * as UtilityScript from '../src/parts/UtilityScript/UtilityScript.ts'

test('getUtilityScript includes source map and source url comments', async () => {
  const utilityScript = await UtilityScript.getUtilityScript()
  const utilityScriptPath = join(Root.root, 'packages', 'injected-code', 'dist', 'injectedCode.js')

  expect(utilityScript).toContain('//# sourceMappingURL=injectedCode.js.map')
  expect(utilityScript).toContain(`//# sourceURL=${pathToFileURL(utilityScriptPath).toString()}`)
})
