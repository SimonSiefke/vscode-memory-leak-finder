import { expect, test, jest, beforeEach, afterEach } from '@jest/globals'
import forge from 'node-forge'

const mockExistsSync = jest.fn<(path: string) => boolean>()
const mockReadFile = jest.fn<(path: string) => Promise<string>>()
const mockWriteFile = jest.fn<(path: string, data: string, encoding: string) => Promise<void>>()
const mockUnlink = jest.fn<(path: string) => Promise<void>>()
const mockMkdir = jest.fn<(path: string, options?: { recursive?: boolean }) => Promise<void>>()

jest.unstable_mockModule('node:fs', () => ({
  existsSync: mockExistsSync,
}))

jest.unstable_mockModule('node:fs/promises', () => ({
  mkdir: mockMkdir,
  readFile: mockReadFile,
  unlink: mockUnlink,
  writeFile: mockWriteFile,
}))

let GetCertificateForDomainModule: typeof import('../src/parts/GetCertificateForDomain/GetCertificateForDomain.ts')
let GetOrCreateCAModule: typeof import('../src/parts/GetOrCreateCA/GetOrCreateCA.ts')
let ValidateCertificateKeyPairModule: typeof import('../src/parts/ValidateCertificateKeyPair/ValidateCertificateKeyPair.ts')
let GenerateCertificateForDomainModule: typeof import('../src/parts/GenerateCertificateForDomain/GenerateCertificateForDomain.ts')

beforeEach(async () => {
  jest.clearAllMocks()
  mockMkdir.mockResolvedValue(void 0)
  mockUnlink.mockResolvedValue(void 0)
  mockWriteFile.mockResolvedValue(void 0)
  GetCertificateForDomainModule = await import('../src/parts/GetCertificateForDomain/GetCertificateForDomain.ts')
  GetOrCreateCAModule = await import('../src/parts/GetOrCreateCA/GetOrCreateCA.ts')
  ValidateCertificateKeyPairModule = await import('../src/parts/ValidateCertificateKeyPair/ValidateCertificateKeyPair.ts')
  GenerateCertificateForDomainModule = await import('../src/parts/GenerateCertificateForDomain/GenerateCertificateForDomain.ts')
})

afterEach(() => {
  jest.resetModules()
})

test.skip('getCertificateForDomain - generates new certificate when files do not exist', async () => {
  mockExistsSync.mockReturnValue(false)

  const cert = await GetCertificateForDomainModule.getCertificateForDomain('example.com')

  expect(cert).toBeDefined()
  expect(cert.cert).toBeDefined()
  expect(cert.key).toBeDefined()
  expect(mockWriteFile).toHaveBeenCalled()
})

test.skip('getCertificateForDomain - returns existing certificate when files exist and are valid', async () => {
  const ca = await GetOrCreateCAModule.getOrCreateCA()
  const domainCert = GenerateCertificateForDomainModule.generateCertificateForDomain('example.com', ca.key, ca.cert)
  const existingCert = domainCert.cert
  const existingKey = domainCert.key

  mockExistsSync.mockImplementation((path: string) => {
    if (path.includes('ca-cert.pem') || path.includes('ca-key.pem')) {
      return false
    }
    if (path.includes('example_com')) {
      return true
    }
    return false
  })

  mockReadFile.mockImplementation((path: string) => {
    if (path.includes('example_com') && path.includes('cert.pem')) {
      return Promise.resolve(existingCert)
    }
    if (path.includes('example_com') && path.includes('key.pem')) {
      return Promise.resolve(existingKey)
    }
    return Promise.reject(new Error('Unexpected path'))
  })

  const result = await GetCertificateForDomainModule.getCertificateForDomain('example.com')

  expect(result.cert).toBe(existingCert)
  expect(result.key).toBe(existingKey)
})

test.skip('getCertificateForDomain - regenerates certificate when validation fails', async () => {
  mockExistsSync.mockImplementation((path: string) => {
    if (path.includes('ca-cert.pem') || path.includes('ca-key.pem')) {
      return false
    }
    if (path.includes('example_com')) {
      return true
    }
    return false
  })

  const mismatchedCert = '-----BEGIN CERTIFICATE-----\nMISMATCHED CERT\n-----END CERTIFICATE-----'
  const mismatchedKey = '-----BEGIN PRIVATE KEY-----\nMISMATCHED KEY\n-----END PRIVATE KEY-----'

  mockReadFile.mockImplementation((path: string) => {
    if (path.includes('example_com') && path.includes('cert.pem')) {
      return Promise.resolve(mismatchedCert)
    }
    if (path.includes('example_com') && path.includes('key.pem')) {
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

test.skip('getCertificateForDomain - sanitizes domain name in file paths', async () => {
  mockExistsSync.mockReturnValue(false)

  await GetCertificateForDomainModule.getCertificateForDomain('example.com')

  const writeCalls = mockWriteFile.mock.calls as Array<[string, string, string]>
  expect(writeCalls.some((call) => call[0].includes('example_com'))).toBe(true)
})

test.skip('getCertificateForDomain - sanitizes special characters in domain', async () => {
  mockExistsSync.mockReturnValue(false)

  await GetCertificateForDomainModule.getCertificateForDomain('test.example.com')

  const writeCalls = mockWriteFile.mock.calls as Array<[string, string, string]>
  expect(writeCalls.some((call) => call[0].includes('test_example_com'))).toBe(true)
})

test.skip('getCertificateForDomain - handles domain with hyphens', async () => {
  mockExistsSync.mockReturnValue(false)

  await GetCertificateForDomainModule.getCertificateForDomain('test-example.com')

  const writeCalls = mockWriteFile.mock.calls as Array<[string, string, string]>
  expect(writeCalls.some((call) => call[0].includes('test_example_com'))).toBe(true)
})

test.skip('getCertificateForDomain - generates certificate with correct domain', async () => {
  mockExistsSync.mockReturnValue(false)

  const cert = await GetCertificateForDomainModule.getCertificateForDomain('test.example.com')

  const certificate = forge.pki.certificateFromPem(cert.cert)
  expect(certificate.subject.getField('CN')?.value).toBe('test.example.com')
})

test.skip('getCertificateForDomain - handles IPv4 address', async () => {
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

test.skip('getCertificateForDomain - handles IPv6 address', async () => {
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

test.skip('getCertificateForDomain - deletes mismatched files even if unlink fails', async () => {
  mockExistsSync.mockImplementation((path: string) => {
    if (path.includes('ca-cert.pem') || path.includes('ca-key.pem')) {
      return false
    }
    if (path.includes('example_com')) {
      return true
    }
    return false
  })

  const mismatchedCert = '-----BEGIN CERTIFICATE-----\nMISMATCHED CERT\n-----END CERTIFICATE-----'
  const mismatchedKey = '-----BEGIN PRIVATE KEY-----\nMISMATCHED KEY\n-----END PRIVATE KEY-----'

  mockReadFile.mockImplementation((path: string) => {
    if (path.includes('example_com') && path.includes('cert.pem')) {
      return Promise.resolve(mismatchedCert)
    }
    if (path.includes('example_com') && path.includes('key.pem')) {
      return Promise.resolve(mismatchedKey)
    }
    return Promise.reject(new Error('Unexpected path'))
  })
  mockUnlink.mockRejectedValue(new Error('File not found') as never)

  const result = await GetCertificateForDomainModule.getCertificateForDomain('example.com')

  expect(result).toBeDefined()
  expect(mockUnlink).toHaveBeenCalledTimes(2)
})

test.skip('getCertificateForDomain - checks for both cert and key files', async () => {
  mockExistsSync.mockImplementation((path: string) => {
    if (path.includes('ca-cert.pem') || path.includes('ca-key.pem')) {
      return false
    }
    return false
  })

  await GetCertificateForDomainModule.getCertificateForDomain('example.com')

  const calls = mockExistsSync.mock.calls as unknown as Array<[string]>
  const domainCertCalls = calls.filter((call) => call[0].includes('example_com'))
  expect(domainCertCalls.length).toBeGreaterThanOrEqual(2)
  expect(domainCertCalls.some((call) => call[0].includes('cert.pem'))).toBe(true)
  expect(domainCertCalls.some((call) => call[0].includes('key.pem'))).toBe(true)
})

test.skip('getCertificateForDomain - returns valid certificate-key pair', async () => {
  mockExistsSync.mockReturnValue(false)

  const cert = await GetCertificateForDomainModule.getCertificateForDomain('example.com')

  expect(ValidateCertificateKeyPairModule.validateCertificateKeyPair(cert.cert, cert.key)).toBe(true)
})
