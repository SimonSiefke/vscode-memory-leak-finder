import { beforeEach, expect, jest, test } from '@jest/globals'

const mockGetCleanPositionsMap = jest.fn<(...args: any[]) => Promise<any>>()

jest.unstable_mockModule('../src/parts/GetCleanPositionsMap/GetCleanPositionsMap.ts', () => ({
  getCleanPositionsMap: mockGetCleanPositionsMap,
}))

beforeEach(() => {
  jest.resetModules()
  mockGetCleanPositionsMap.mockReset()
})

test('resolves tracked runtime locations against vscode-file script urls', async () => {
  const sourceMapUrl = 'https://main.vscode-cdn.net/sourcemaps/commit/core/vs/workbench/workbench.desktop.main.js.map'
  mockGetCleanPositionsMap.mockResolvedValue({
    [sourceMapUrl]: [
      {
        column: 17,
        line: 42,
        name: 'EditorService.openEditor',
        source: 'src/vs/workbench/services/editor/common/editorService.ts',
      },
    ],
  })
  const ResolveTrackedLocationSourceMaps = await import('../src/parts/ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts')
  const location = '/tmp/vscode-linux-x64/resources/app/out/vs/workbench/workbench.desktop.main.js:441:2785'
  const scriptMap = {
    '123': {
      sourceMapUrl,
      url: 'vscode-file://vscode-app/tmp/vscode-linux-x64-modified-tracked-allocations/resources/app/out/vs/workbench/workbench.desktop.main.js',
    },
  }

  const result = await ResolveTrackedLocationSourceMaps.resolveTrackedLocationSourceMaps([location], scriptMap)

  expect(mockGetCleanPositionsMap).toHaveBeenCalledWith(
    {
      [sourceMapUrl]: [440, 2784],
    },
    false,
    true,
  )
  expect(result[location]).toEqual({
    originalColumn: 17,
    originalLine: 42,
    originalLocation: 'src/vs/workbench/services/editor/common/editorService.ts:42:17',
    originalName: 'EditorService.openEditor',
    originalSource: 'src/vs/workbench/services/editor/common/editorService.ts',
  })
})
