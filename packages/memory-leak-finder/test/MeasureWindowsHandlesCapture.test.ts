import { afterEach, expect, jest, test } from '@jest/globals'

const execFile = jest.fn<any>()
Object.defineProperty(execFile, Symbol.for('nodejs.util.promisify.custom'), {
  value: (...args: any[]) =>
    new Promise((resolve, reject) => {
      execFile(...args, (error: Error | null, stdout: string, stderr: string) => {
        if (error) reject(error)
        else resolve({ stdout, stderr })
      })
    }),
})
jest.unstable_mockModule('node:child_process', () => ({ execFile }))
const measure = await import('../src/parts/MeasureWindowsHandles/MeasureWindowsHandles.ts')
const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')!
afterEach(() => {
  Object.defineProperty(process, 'platform', originalPlatform)
  jest.resetAllMocks()
})

test.each(['start', 'stop'] as const)('%s configures a five-minute kill timeout and propagates query failure', async (method) => {
  Object.defineProperty(process, 'platform', { value: 'win32' })
  execFile.mockImplementation((_file: string, _args: string[], options: any, callback: any) => {
    expect(options.timeout).toBe(300000)
    expect(options.killSignal).toBe('SIGKILL')
    callback(Object.assign(new Error('Command timed out'), { killed: true }), '', '')
  })
  await expect(measure[method]({ rootPid: 100 })).rejects.toThrow('Windows process handle query failed: Command timed out')
})

test('successful capture still parses process handles', async () => {
  Object.defineProperty(process, 'platform', { value: 'win32' })
  execFile.mockImplementation((_file: string, _args: string[], _options: any, callback: any) => {
    callback(null, JSON.stringify([{ pid: 100, parentPid: 1, name: 'Code.exe', handleCount: 12 }]), '')
  })
  await expect(measure.start({ rootPid: 100 })).resolves.toMatchObject({ rootPid: 100, processes: [{ pid: 100, handleCount: 12 }] })
})
