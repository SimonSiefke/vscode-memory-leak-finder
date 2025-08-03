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
  expect(Stdout.write).toHaveBeenCalledWith(
    '\n\u001B[0m\u001B[7m\u001B[33m SETUP \u001B[39m\u001B[27m\u001B[0m \u001B[2mLaunching IDE and connecting to devtools...\u001B[22m\n',
  )
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
