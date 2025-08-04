declare global {
  const test: typeof import('@jest/globals')['test']
  const expect: typeof import('@jest/globals')['expect']
}

export {}

test('main module exports main function', async () => {
  const Main = await import('../src/parts/Main/Main.js')

  expect(typeof Main.main).toBe('function')
})