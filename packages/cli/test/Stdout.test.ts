import { expect, jest, test } from '@jest/globals'
import * as Stdout from '../src/parts/Stdout/Stdout.ts'

test('write preserves styled output when color is enabled', async () => {
  const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
  Stdout.setColorEnabled(true)

  await Stdout.write('\u001B[31mred\u001B[39m')

  expect(write).toHaveBeenCalledWith('\u001B[31mred\u001B[39m')
  write.mockRestore()
})

test('write strips style escapes and preserves cursor controls when color is disabled', async () => {
  const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
  Stdout.setColorEnabled(false)

  await Stdout.write('\u001B[31mred\u001B[39m\u001B[2K\u001B[1A')

  expect(write).toHaveBeenCalledWith('red\u001B[2K\u001B[1A')
  write.mockRestore()
  Stdout.setColorEnabled(true)
})
