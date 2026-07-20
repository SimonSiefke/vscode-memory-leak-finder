import { expect, jest, test } from '@jest/globals'

const getBinaryPath = jest.fn<
  (
    platform: string,
    arch: string,
    vscodeVersion: string,
    vscodePath: string,
    commit: string,
    insidersCommit: string,
    updateUrl: string,
    buildVscodeMinified: boolean,
  ) => Promise<string>
>(async () => '/tmp/code')
const prepareTrackedVscodeWorker = jest.fn<(binaryPath: string, trackingMode: string) => Promise<string>>(async () => '/tmp/tracked-code')

jest.unstable_mockModule('../src/parts/GetBinaryPath/GetBinaryPath.ts', () => ({
  getBinaryPath,
}))

jest.unstable_mockModule('../src/parts/PrepareTrackedVscode/PrepareTrackedVscode.ts', () => ({
  prepareTrackedVscode: prepareTrackedVscodeWorker,
}))

const { prepareTrackedVscode } = await import('../src/parts/Launch/Launch.ts')

test('prepareTrackedVscode resolves and prepares the binary before tests start', async () => {
  const result = await prepareTrackedVscode({
    arch: 'x64',
    buildVscodeMinified: false,
    commit: '',
    insidersCommit: '',
    measureId: 'tracked-timeouts',
    platform: 'linux',
    updateUrl: '',
    vscodePath: '',
    vscodeVersion: '1.129.0',
  })

  expect(result).toBe('/tmp/tracked-code')
  expect(getBinaryPath).toHaveBeenCalledWith('linux', 'x64', '1.129.0', '', '', '', '', false)
  expect(prepareTrackedVscodeWorker).toHaveBeenCalledWith('/tmp/code', 'timeouts')
})
