import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/IsGithubActions/IsGithubActions.js', () => {
  return {
    isGithubActions: false,
  }
})

jest.unstable_mockModule('../src/parts/Stdout/Stdout.js', () => {
  return {
    write: jest.fn(),
  }
})

const Stdout = await import('../src/parts/Stdout/Stdout.js')
const HandleTestSetup = await import('../src/parts/HandleTestSetup/HandleTestSetup.js')

test('handleTestSetup - should write setup message when not in GitHub Actions', () => {
  HandleTestSetup.handleTestSetup()
  expect(Stdout.write).toHaveBeenCalledTimes(1)
  expect(Stdout.write).toHaveBeenCalledWith('\n\u001b[0m\u001b[7m\u001b[33m SETUP \u001b[39m\u001b[27m\u001b[0m\n')
})

test('handleTestSetup - should not write anything when in GitHub Actions', async () => {
  jest.resetModules()

  jest.unstable_mockModule('../src/parts/IsGithubActions/IsGithubActions.js', () => {
    return {
      isGithubActions: true,
    }
  })

  jest.unstable_mockModule('../src/parts/Stdout/Stdout.js', () => {
    return {
      write: jest.fn(),
    }
  })

  const StdoutGH = await import('../src/parts/Stdout/Stdout.js')
  const HandleTestSetupGH = await import('../src/parts/HandleTestSetup/HandleTestSetup.js')

  HandleTestSetupGH.handleTestSetup()
  expect(StdoutGH.write).toHaveBeenCalledTimes(0)
})
