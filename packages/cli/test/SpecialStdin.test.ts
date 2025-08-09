import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
})

jest.unstable_mockModule('../src/parts/Stdin/Stdin.ts', () => {
  return {
    setRawMode: jest.fn(),
    resume: jest.fn(),
    setEncoding: jest.fn(),
    on: jest.fn(),
    pause: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/Stdout/Stdout.ts', () => {
  return {
    write: jest.fn(),
  }
})

const Stdin = await import('../src/parts/Stdin/Stdin.ts')
const Stdout = await import('../src/parts/Stdout/Stdout.ts')
const SpecialStdin = await import('../src/parts/SpecialStdin/SpecialStdin.ts')
const Character = await import('../src/parts/Character/Character.ts')
const EncodingType = await import('../src/parts/EncodingType/EncodingType.ts')
const HandleStdinData = await import('../src/parts/HandleStdinData/HandleStdinData.ts')

test('start - configures stdin properly', async () => {
  await SpecialStdin.start()

  expect(Stdin.setRawMode).toHaveBeenCalledWith(true)
  expect(Stdin.resume).toHaveBeenCalled()
  expect(Stdin.setEncoding).toHaveBeenCalledWith(EncodingType.Utf8)
  expect(Stdin.on).toHaveBeenCalledWith('data', HandleStdinData.handleStdinData)
})

test('start - sets correct encoding', async () => {
  await SpecialStdin.start()

  expect(Stdin.setEncoding).toHaveBeenCalledWith('utf8')
})

test('start - attaches data event listener', async () => {
  await SpecialStdin.start()

  expect(Stdin.on).toHaveBeenCalledWith('data', HandleStdinData.handleStdinData)
})

test('stop - pauses stdin and writes newline', async () => {
  await SpecialStdin.stop()

  expect(Stdin.pause).toHaveBeenCalled()
  expect(Stdout.write).toHaveBeenCalledWith(Character.NewLine)
})
