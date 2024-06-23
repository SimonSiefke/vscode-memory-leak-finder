import { expect, test } from '@jest/globals'
import * as PlaywrightCdnMirrors from '../src/parts/PlaywrightCdnMirrors/PlaywrightCdnMirrors.js'

test('playwrightCdnMirrors', () => {
  expect(PlaywrightCdnMirrors.playwrightCdnMirrors).toBeInstanceOf(Array)
})
