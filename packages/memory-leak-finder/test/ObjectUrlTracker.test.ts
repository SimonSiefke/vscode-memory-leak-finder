import { afterEach, expect, jest, test } from '@jest/globals'

const evaluate = jest.fn(async (_session: unknown, options: { readonly expression: string }) => {
  return new Function(`return ${options.expression}`)()
})

jest.unstable_mockModule('../src/parts/DevtoolsProtocol/DevtoolsProtocol.ts', () => ({
  DevtoolsProtocolRuntime: { evaluate },
}))

const ObjectUrlTracker = await import('../src/parts/ObjectUrlTracker/ObjectUrlTracker.ts')

const session = {} as any

afterEach(async () => {
  await ObjectUrlTracker.cleanup(session)
  jest.clearAllMocks()
})

test('counts created, revoked, and unreleased object URLs', async () => {
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL
  await ObjectUrlTracker.start(session)

  const revokedUrl = URL.createObjectURL(new Blob(['revoked']))
  const unreleasedUrl = URL.createObjectURL(new Blob(['unreleased']))
  URL.revokeObjectURL(revokedUrl)

  await expect(ObjectUrlTracker.getCounts(session)).resolves.toEqual({
    created: 2,
    revoked: 1,
    unreleased: 1,
  })

  await ObjectUrlTracker.cleanup(session)
  expect(URL.createObjectURL).toBe(originalCreateObjectURL)
  expect(URL.revokeObjectURL).toBe(originalRevokeObjectURL)
  URL.revokeObjectURL(unreleasedUrl)
})

test('does not count revocation of an object URL created before tracking as an unreleased URL', async () => {
  const objectUrl = URL.createObjectURL(new Blob(['created before tracking']))
  await ObjectUrlTracker.start(session)

  URL.revokeObjectURL(objectUrl)

  await expect(ObjectUrlTracker.getCounts(session)).resolves.toEqual({
    created: 0,
    revoked: 1,
    unreleased: 0,
  })
})

test('restarting tracking restores the previous spy before installing a new one', async () => {
  const originalCreateObjectURL = URL.createObjectURL
  await ObjectUrlTracker.start(session)
  const firstSpy = URL.createObjectURL

  await ObjectUrlTracker.start(session)

  expect(URL.createObjectURL).not.toBe(firstSpy)
  await ObjectUrlTracker.cleanup(session)
  expect(URL.createObjectURL).toBe(originalCreateObjectURL)
})
