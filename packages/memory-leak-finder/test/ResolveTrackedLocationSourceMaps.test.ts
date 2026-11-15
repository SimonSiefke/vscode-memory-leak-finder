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

test('can resolve source locations without constructor name analysis', async () => {
  const sourceMapUrl = 'file:///bundle.js.map'
  mockGetCleanPositionsMap.mockResolvedValue({
    [sourceMapUrl]: [{ column: 6, line: 42, name: '', source: 'src/owner.ts' }],
  })
  const { resolveTrackedLocationSourceMaps } =
    await import('../src/parts/ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts')
  const result = await resolveTrackedLocationSourceMaps(['7:2:5'], { '7': { url: 'file:///bundle.js', sourceMapUrl } }, false)

  expect(mockGetCleanPositionsMap).toHaveBeenCalledWith({ [sourceMapUrl]: [1, 4] }, false, false)
  expect(result['7:2:5']).toEqual({
    originalColumn: 6,
    originalLine: 42,
    originalLocation: 'src/owner.ts:42:6',
    originalName: '',
    originalSource: 'src/owner.ts',
  })
})
