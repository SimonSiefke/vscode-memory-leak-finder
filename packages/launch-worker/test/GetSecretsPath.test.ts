import { expect, test } from '@jest/globals'
import { join } from 'node:path'
import { getSecretsPath } from '../src/parts/Launch/Launch.ts'
import * as Root from '../src/parts/Root/Root.ts'

test('getSecretsPath', () => {
  expect(getSecretsPath()).toBe(join(Root.root, '.vscode-user-data-dir', 'secrets', 'secrets.json'))
})
