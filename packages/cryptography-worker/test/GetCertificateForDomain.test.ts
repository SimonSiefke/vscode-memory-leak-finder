import { expect, test, jest, beforeEach, afterEach } from '@jest/globals'
import forge from 'node-forge'

const mockExistsSync = jest.fn()
const mockReadFile = jest.fn()
const mockWriteFile = jest.fn()
const mockUnlink = jest.fn()
const mockMkdir = jest.fn()

jest.unstable_mockModule('node:fs', () => ({
  existsSync: mockExistsSync,
}))

jest.unstable_mockModule('node:fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  unlink: mockUnlink,
  mkdir: mockMkdir,
}))

let GetCertificateForDomainModule: typeof import('../src/parts/GetCertificateForDomain/GetCertificateForDomain.ts')
let GetOrCreateCAModule: typeof import('../src/parts/GetOrCreateCA/GetOrCreateCA.ts')
let ValidateCertificateKeyPairModule: typeof import('../src/parts/ValidateCertificateKeyPair/ValidateCertificateKeyPair.ts')

beforeEach(async () => {
  jest.clearAllMocks()
  mockMkdir.mockResolvedValue(undefined)
  mockUnlink.mockResolvedValue(undefined)
  mockWriteFile.mockResolvedValue(undefined)
  GetCertificateForDomainModule = await import('../src/parts/GetCertificateForDomain/GetCertificateForDomain.ts')
  GetOrCreateCAModule = await import('../src/parts/GetOrCreateCA/GetOrCreateCA.ts')
  ValidateCertificateKeyPairModule = await import('../src/parts/ValidateCertificateKeyPair/ValidateCertificateKeyPair.ts')
})

afterEach(() => {
  jest.resetModules()
})

test('getCertificateForDomain - generates new certificate when files do not exist', async () => {
  mockExistsSync.mockReturnValue(false)

  const cert = await GetCertificateForDomainModule.getCertificateForDomain('example.com')

  expect(cert).toBeDefined()
  expect(cert.cert).toBeDefined()
  expect(cert.key).toBeDefined()
  expect(mockWriteFile).toHaveBeenCalled()
})

test('getCertificateForDomain - returns existing certificate when files exist and are valid', async () => {
  mockExistsSync.mockImplementation((path: string) => {
    if (path.includes('ca-cert.pem') || path.includes('ca-key.pem')) {
      return false
    }
    if (path.includes('example.com')) {
      return true
    }
    return false
  })

  const ca = await GetOrCreateCAModule.getOrCreateCA()
  const domainCert = await GetCertificateForDomainModule.getCertificateForDomain('example.com')
  const existingCert = domainCert.cert
  const existingKey = domainCert.key

  mockReadFile.mockImplementation((path: string) => {
    if (path.includes('example.com') && path.includes('cert.pem')) {
      return Promise.resolve(existingCert)
    }
    if (path.includes('example.com') && path.includes('key.pem')) {
      return Promise.resolve(existingKey)
    }
    return Promise.reject(new Error('Unexpected path'))
  })

  const result = await GetCertificateForDomainModule.getCertificateForDomain('example.com')

  expect(result.cert).toBe(existingCert)
  expect(result.key).toBe(existingKey)
})

test('getCertificateForDomain - regenerates certificate when validation fails', async () => {
  mockExistsSync.mockImplementation((path: string) => {
    if (path.includes('ca-cert.pem') || path.includes('ca-key.pem')) {
      return false
    }
    if (path.includes('example.com')) {
      return true
    }
    return false
  })

  const mismatchedCert = '-----BEGIN CERTIFICATE-----\nMISMATCHED CERT\n-----END CERTIFICATE-----'
  const mismatchedKey = '-----BEGIN PRIVATE KEY-----\nMISMATCHED KEY\n-----END PRIVATE KEY-----'

  mockReadFile.mockImplementation((path: string) => {
    if (path.includes('example.com') && path.includes('cert.pem')) {
      return Promise.resolve(mismatchedCert)
    }
    if (path.includes('example.com') && path.includes('key.pem')) {
      return Promise.resolve(mismatchedKey)
    }
    return Promise.reject(new Error('Unexpected path'))
  })

  const result = await GetCertificateForDomainModule.getCertificateForDomain('example.com')

  expect(result).toBeDefined()
  expect(result.cert).not.toBe(mismatchedCert)
  expect(result.key).not.toBe(mismatchedKey)
  expect(mockUnlink).toHaveBeenCalledTimes(2)
  expect(mockWriteFile).toHaveBeenCalled()
})

test('getCertificateForDomain - sanitizes domain name in file paths', async () => {
  mockExistsSync.mockReturnValue(false)

  await GetCertificateForDomainModule.getCertificateForDomain('example.com')

  const writeCalls = mockWriteFile.mock.calls
  expect(writeCalls.some((call) => call[0].includes('example_com'))).toBe(true)
})

test('getCertificateForDomain - sanitizes special characters in domain', async () => {
  mockExistsSync.mockReturnValue(false)

  await GetCertificateForDomainModule.getCertificateForDomain('test.example.com')

  const writeCalls = mockWriteFile.mock.calls
  expect(writeCalls.some((call) => call[0].includes('test_example_com'))).toBe(true)
})

test('getCertificateForDomain - handles domain with hyphens', async () => {
  mockExistsSync.mockReturnValue(false)

  await GetCertificateForDomainModule.getCertificateForDomain('test-example.com')

  const writeCalls = mockWriteFile.mock.calls
  expect(writeCalls.some((call) => call[0].includes('test_example_com'))).toBe(true)
})

test('getCertificateForDomain - generates certificate with correct domain', async () => {
  mockExistsSync.mockReturnValue(false)

  const cert = await GetCertificateForDomainModule.getCertificateForDomain('test.example.com')

  const certificate = forge.pki.certificateFromPem(cert.cert)
  expect(certificate.subject.getField('CN')?.value).toBe('test.example.com')
})

test('getCertificateForDomain - handles IPv4 address', async () => {
  mockExistsSync.mockReturnValue(false)

  const cert = await GetCertificateForDomainModule.getCertificateForDomain('192.168.1.1')

  expect(cert).toBeDefined()
  const certificate = forge.pki.certificateFromPem(cert.cert)
  const altNames = certificate.getExtension('subjectAltName') as {
    altNames: Array<{ type: number; value?: string; ip?: string }>
  } | null
  expect(altNames).toBeTruthy()
  if (altNames) {
    const hasIP = altNames.altNames.some((altName) => altName.type === 7 && altName.ip === '192.168.1.1')
    expect(hasIP).toBe(true)
  }
})

test('getCertificateForDomain - handles IPv6 address', async () => {
  mockExistsSync.mockReturnValue(false)

  const cert = await GetCertificateForDomainModule.getCertificateForDomain('::1')

  expect(cert).toBeDefined()
  const certificate = forge.pki.certificateFromPem(cert.cert)
  const altNames = certificate.getExtension('subjectAltName') as {
    altNames: Array<{ type: number; value?: string; ip?: string }>
  } | null
  expect(altNames).toBeTruthy()
  if (altNames) {
    const hasIP = altNames.altNames.some((altName) => altName.type === 7 && altName.ip === '::1')
    expect(hasIP).toBe(true)
  }
})

test('getCertificateForDomain - deletes mismatched files even if unlink fails', async () => {
  mockExistsSync.mockImplementation((path: string) => {
    if (path.includes('ca-cert.pem') || path.includes('ca-key.pem')) {
      return false
    }
    if (path.includes('example.com')) {
      return true
    }
    return false
  })

  const mismatchedCert = '-----BEGIN CERTIFICATE-----\nMISMATCHED CERT\n-----END CERTIFICATE-----'
  const mismatchedKey = '-----BEGIN PRIVATE KEY-----\nMISMATCHED KEY\n-----END PRIVATE KEY-----'

  mockReadFile.mockImplementation((path: string) => {
    if (path.includes('example.com') && path.includes('cert.pem')) {
      return Promise.resolve(mismatchedCert)
    }
    if (path.includes('example.com') && path.includes('key.pem')) {
      return Promise.resolve(mismatchedKey)
    }
    return Promise.reject(new Error('Unexpected path'))
  })
  mockUnlink.mockRejectedValue(new Error('File not found'))

  const result = await GetCertificateForDomainModule.getCertificateForDomain('example.com')

  expect(result).toBeDefined()
  expect(mockUnlink).toHaveBeenCalledTimes(2)
})

test('getCertificateForDomain - checks for both cert and key files', async () => {
  mockExistsSync.mockReturnValue(false)

  await GetCertificateForDomainModule.getCertificateForDomain('example.com')

  expect(mockExistsSync).toHaveBeenCalledTimes(2)
  const calls = mockExistsSync.mock.calls
  expect(calls.some((call) => call[0].includes('cert.pem'))).toBe(true)
  expect(calls.some((call) => call[0].includes('key.pem'))).toBe(true)
})

test('getCertificateForDomain - returns valid certificate-key pair', async () => {
  mockExistsSync.mockReturnValue(false)

  const cert = await GetCertificateForDomainModule.getCertificateForDomain('example.com')

  expect(ValidateCertificateKeyPairModule.validateCertificateKeyPair(cert.cert, cert.key)).toBe(true)
})

