import { expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('../src/parts/StdoutWorker/StdoutWorker.ts', () => {
  return {
    invoke: (method: string, ...args: any[]) => {
      if (method === 'Stdout.getHandleTestFailedMessage') {
        return 'BASE\n'
      }
      if (method === 'Stdout.getGitHubFileErrorMessage') {
        const [_message, options] = args
        const parts: string[] = ['::error']
        const annotations: string[] = []
        if (options.file) annotations.push(`file=${options.file}`)
        if (options.line) annotations.push(`line=${options.line}`)
        if (options.col) annotations.push(`col=${options.col}`)
        const prefix = annotations.length ? ` ${annotations.join(',')}` : ''
        return `::error${prefix}::${_message}\n`
      }
      throw new Error('unexpected method ' + method)
    },
  }
})

jest.unstable_mockModule('../src/parts/StdinDataState/StdinDataState.ts', () => ({
  isGithubActions: () => true,
}))

const Mod = await import('../src/parts/GetHandleTestFailedMessage/GetHandleTestFailedMessage.ts')

test('getHandleTestFailedMessage - includes annotation when in GitHub Actions', async () => {
  const message = await Mod.getHandleTestFailedMessage(
    '/repo/src/sample.test.js',
    'src',
    'src/sample.test.js',
    'sample.test.js',
    {
      type: 'Error',
      message: 'boom',
      stack: '    at Module.test (/repo/src/sample.test.js:15:29)',
      codeFrame: '',
    },
  )
  expect(message).toContain('::error file=src/sample.test.js,line=15,col=29::boom')
  expect(message).toMatch(/BASE\n$/)
})


