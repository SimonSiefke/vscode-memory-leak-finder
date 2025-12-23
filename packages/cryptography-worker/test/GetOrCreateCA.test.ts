import { expect, test, jest, beforeEach, afterEach } from '@jest/globals'

const mockExistsSync = jest.fn()
const mockReadFile = jest.fn()
const mockWriteFile = jest.fn()
const mockMkdir = jest.fn()

jest.unstable_mockModule('node:fs', () => ({
  existsSync: mockExistsSync,
}))

jest.unstable_mockModule('node:fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
}))

let GetOrCreateCAModule: typeof import('../src/parts/GetOrCreateCA/GetOrCreateCA.ts')

beforeEach(async () => {
  jest.clearAllMocks()
  GetOrCreateCAModule = await import('../src/parts/GetOrCreateCA/GetOrCreateCA.ts')
  mockMkdir.mockResolvedValue(undefined)
})

afterEach(() => {
  jest.resetModules()
})

test('getOrCreateCA - creates CA when files do not exist', async () => {
  mockExistsSync.mockReturnValue(false)
  mockWriteFile.mockResolvedValue(undefined)

  const ca = await GetOrCreateCAModule.getOrCreateCA()

  expect(ca).toBeDefined()
  expect(ca.cert).toBeDefined()
  expect(ca.key).toBeDefined()
  expect(typeof ca.cert).toBe('string')
  expect(typeof ca.key).toBe('string')
  expect(mockMkdir).toHaveBeenCalled()
  expect(mockWriteFile).toHaveBeenCalledTimes(2)
})

test('getOrCreateCA - returns existing CA when files exist', async () => {
  const existingCert = '-----BEGIN CERTIFICATE-----\nEXISTING CERT\n-----END CERTIFICATE-----'
  const existingKey = '-----BEGIN PRIVATE KEY-----\nEXISTING KEY\n-----END PRIVATE KEY-----'

  mockExistsSync.mockReturnValue(true)
  mockReadFile.mockImplementation((path: string) => {
    if (path.includes('ca-cert.pem')) {
      return Promise.resolve(existingCert)
    }
    if (path.includes('ca-key.pem')) {
      return Promise.resolve(existingKey)
    }
    return Promise.reject(new Error('Unexpected path'))
  })

  const ca = await GetOrCreateCAModule.getOrCreateCA()

  expect(ca.cert).toBe(existingCert)
  expect(ca.key).toBe(existingKey)
  expect(mockReadFile).toHaveBeenCalledTimes(2)
  expect(mockWriteFile).not.toHaveBeenCalled()
})

test('getOrCreateCA - creates directory recursively', async () => {
  mockExistsSync.mockReturnValue(false)
  mockWriteFile.mockResolvedValue(undefined)

  await GetOrCreateCAModule.getOrCreateCA()

  expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('.vscode-proxy-certs'), {
    recursive: true,
  })
})

test('getOrCreateCA - reads both CA files in parallel when they exist', async () => {
  const existingCert = '-----BEGIN CERTIFICATE-----\nEXISTING CERT\n-----END CERTIFICATE-----'
  const existingKey = '-----BEGIN PRIVATE KEY-----\nEXISTING KEY\n-----END PRIVATE KEY-----'

  mockExistsSync.mockReturnValue(true)
  mockReadFile.mockImplementation((path: string) => {
    if (path.includes('ca-cert.pem')) {
      return Promise.resolve(existingCert)
    }
    if (path.includes('ca-key.pem')) {
      return Promise.resolve(existingKey)
    }
    return Promise.reject(new Error('Unexpected path'))
  })

  await GetOrCreateCAModule.getOrCreateCA()

  expect(mockReadFile).toHaveBeenCalledTimes(2)
  const calls = mockReadFile.mock.calls
  expect(calls.some((call) => call[0].includes('ca-cert.pem'))).toBe(true)
  expect(calls.some((call) => call[0].includes('ca-key.pem'))).toBe(true)
})

test('getOrCreateCA - writes both CA files in parallel when creating', async () => {
  mockExistsSync.mockReturnValue(false)
  mockWriteFile.mockResolvedValue(undefined)

  await GetOrCreateCAModule.getOrCreateCA()

  expect(mockWriteFile).toHaveBeenCalledTimes(2)
  const calls = mockWriteFile.mock.calls
  expect(calls.some((call) => call[0].includes('ca-cert.pem'))).toBe(true)
  expect(calls.some((call) => call[0].includes('ca-key.pem'))).toBe(true)
})

test('getOrCreateCA - checks for both key and cert files', async () => {
  mockExistsSync.mockImplementation((path: string) => {
    if (path.includes('ca-cert.pem')) {
      return false
    }
    if (path.includes('ca-key.pem')) {
      return false
    }
    return false
  })
  mockWriteFile.mockResolvedValue(undefined)

  await GetOrCreateCAModule.getOrCreateCA()

  const calls = mockExistsSync.mock.calls
  expect(calls.some((call) => call[0].includes('ca-cert.pem'))).toBe(true)
  expect(calls.some((call) => call[0].includes('ca-key.pem'))).toBe(true)
})

test('getOrCreateCA - returns valid certificate pair when creating new CA', async () => {
  mockExistsSync.mockReturnValue(false)
  mockWriteFile.mockResolvedValue(undefined)

  const ca = await GetOrCreateCAModule.getOrCreateCA()

  expect(ca.cert).toContain('BEGIN CERTIFICATE')
  expect(ca.cert).toContain('END CERTIFICATE')
  expect(ca.key).toContain('BEGIN')
  expect(ca.key).toContain('PRIVATE KEY')
  expect(ca.key).toContain('END')
})
