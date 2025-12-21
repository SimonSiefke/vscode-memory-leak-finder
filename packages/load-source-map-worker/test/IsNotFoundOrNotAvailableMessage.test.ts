import { expect, test } from '@jest/globals'
import { isNotFoundOrNotAvailableMessage } from '../src/parts/IsNotFoundOrNotAvailableMessage/IsNotFoundOrNotAvailableMessage.ts'

test('isNotFoundOrNotAvailableMessage - Response code 409', () => {
  const input =
    'Failed to load source map for https://ticino.blob.core.windows.net/sourcemaps/5437499feb04f7a586f677b155b039bc2b3669eb/core/vs/workbench/workbench.desktop.main.js.map: HTTPError: Response code 409 (Public access is not permitted on this storage account.'
  expect(isNotFoundOrNotAvailableMessage(input)).toBe(true)
})

test('isNotFoundOrNotAvailableMessage - Response code 404', () => {
  const input =
    'Failed to load source map for https://ticino.blob.core.windows.net/sourcemaps/5437499feb04f7a586f677b155b039bc2b3669eb/core/vs/workbench/workbench.desktop.main.js.map: HTTPError: Response code 404'

  expect(isNotFoundOrNotAvailableMessage(input)).toBe(true)
})

test('isNotFoundOrNotAvailableMessage - status code 404', () => {
  const input =
    'Failed to load source map for https://ticino.blob.core.windows.net/sourcemaps/5437499feb04f7a586f677b155b039bc2b3669eb/core/vs/workbench/workbench.desktop.main.js.map: status code 404'

  expect(isNotFoundOrNotAvailableMessage(input)).toBe(true)
})

test('isNotFoundOrNotAvailableMessage - status code 500', () => {
  const input =
    'Failed to load source map for https://ticino.blob.core.windows.net/sourcemaps/5437499feb04f7a586f677b155b039bc2b3669eb/core/vs/workbench/workbench.desktop.main.js.map: Internal server error 500'

  expect(isNotFoundOrNotAvailableMessage(input)).toBe(false)
})
