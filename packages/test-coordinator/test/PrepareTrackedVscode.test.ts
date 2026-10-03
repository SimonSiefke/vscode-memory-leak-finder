import { expect, jest, test } from '@jest/globals'

const invoke = jest.fn<(method: string, options: unknown) => Promise<string>>(async () => '/tmp/tracked-code')
const dispose = jest.fn(async () => undefined)

jest.unstable_mockModule('../src/parts/LaunchInitializationWorker/LaunchInitializationWorker.ts', () => ({
  launchInitializationWorker: jest.fn(async () => ({
    dispose,
    invoke,
  })),
}))

const { prepareTrackedVscode } = await import('../src/parts/PrepareTrackedVscode/PrepareTrackedVscode.ts')

test('prepareTrackedVscode prepares the tracked binary and disposes the setup worker', async () => {
  const options = {
    arch: 'x64',
    buildVscodeMinified: false,
    commit: '',
    insidersCommit: '',
    measureId: 'tracked-timeouts',
    platform: 'linux',
    updateUrl: '',
    vscodePath: '',
    vscodeVersion: '1.129.0',
  }

  await expect(prepareTrackedVscode(options)).resolves.toBe('/tmp/tracked-code')
  expect(invoke).toHaveBeenCalledWith('Launch.prepareTrackedVscode', options)
  expect(dispose).toHaveBeenCalledTimes(1)
})
