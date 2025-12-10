import { expect, test } from '@jest/globals'
import forge from 'node-forge'
import { generateCertificateForDomain } from '../src/parts/GenerateCertificateForDomain/GenerateCertificateForDomain.ts'
import { generateCA } from '../src/parts/GenerateCA/GenerateCA.ts'

test('generateCertificateForDomain - generates certificate for regular domain', () => {
  const ca = generateCA()
  const result = generateCertificateForDomain('example.com', ca.key, ca.cert)

  expect(result.key).toBeTruthy()
  expect(result.cert).toBeTruthy()
  expect(typeof result.key).toBe('string')
  expect(typeof result.cert).toBe('string')

  const cert = forge.pki.certificateFromPem(result.cert)
  expect(cert.subject.getField('CN')?.value).toBe('example.com')
  expect(cert.issuer.getField('CN')?.value).toBe('VS Code Proxy CA')
})

test('generateCertificateForDomain - generates certificate for IPv4 address', () => {
  const ca = generateCA()
  const result = generateCertificateForDomain('192.168.1.1', ca.key, ca.cert)

  expect(result.key).toBeTruthy()
  expect(result.cert).toBeTruthy()

  const cert = forge.pki.certificateFromPem(result.cert)
  const altNames = cert.getExtension('subjectAltName') as { altNames: Array<{ type: number; value?: string; ip?: string }> } | null
  expect(altNames).toBeTruthy()
  if (altNames) {
    const hasIP = altNames.altNames.some((altName: { type: number; value?: string; ip?: string }) => altName.type === 7 && altName.ip === '192.168.1.1')
    expect(hasIP).toBe(true)
  }
})

test('generateCertificateForDomain - generates certificate for IPv6 address', () => {
  const ca = generateCA()
  const result = generateCertificateForDomain('::1', ca.key, ca.cert)

  expect(result.key).toBeTruthy()
  expect(result.cert).toBeTruthy()

  const cert = forge.pki.certificateFromPem(result.cert)
  const altNames = cert.getExtension('subjectAltName') as { altNames: Array<{ type: number; value?: string; ip?: string }> } | null
  expect(altNames).toBeTruthy()
  if (altNames) {
    const hasIP = altNames.altNames.some((altName: { type: number; value?: string; ip?: string }) => altName.type === 7 && altName.ip === '::1')
    expect(hasIP).toBe(true)
  }
})

test('generateCertificateForDomain - certificate is properly signed by CA', () => {
  const ca = generateCA()
  const caCert = forge.pki.certificateFromPem(ca.cert)
  const result = generateCertificateForDomain('test.example.com', ca.key, ca.cert)

  const cert = forge.pki.certificateFromPem(result.cert)

  expect(cert.issuer.getField('CN')?.value).toBe('VS Code Proxy CA')
  expect(cert.issuer.getField('CN')?.value).toBe(caCert.subject.getField('CN')?.value)
})

test('generateCertificateForDomain - certificate has correct validity period', () => {
  const ca = generateCA()
  const result = generateCertificateForDomain('example.com', ca.key, ca.cert)

  const cert = forge.pki.certificateFromPem(result.cert)
  const now = new Date()
  const oneYearFromNow = new Date()
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

  expect(cert.validity.notBefore.getTime()).toBeLessThanOrEqual(now.getTime() + 1000)
  const validityDuration = cert.validity.notAfter.getTime() - cert.validity.notBefore.getTime()
  const expectedDuration = 365 * 24 * 60 * 60 * 1000
  expect(validityDuration).toBeGreaterThanOrEqual(expectedDuration - 24 * 60 * 60 * 1000)
  expect(validityDuration).toBeLessThanOrEqual(expectedDuration + 24 * 60 * 60 * 1000)
})

test('generateCertificateForDomain - certificate has correct extensions', () => {
  const ca = generateCA()
  const result = generateCertificateForDomain('example.com', ca.key, ca.cert)

  const cert = forge.pki.certificateFromPem(result.cert)

  const basicConstraints = cert.getExtension('basicConstraints') as { cA: boolean } | null
  expect(basicConstraints).toBeTruthy()
  if (basicConstraints) {
    expect(basicConstraints.cA).toBe(false)
  }

  const keyUsage = cert.getExtension('keyUsage') as { keyEncipherment: boolean; digitalSignature: boolean } | null
  expect(keyUsage).toBeTruthy()
  if (keyUsage) {
    expect(keyUsage.keyEncipherment).toBe(true)
    expect(keyUsage.digitalSignature).toBe(true)
  }

  const subjectAltName = cert.getExtension('subjectAltName') as { altNames: Array<{ type: number; value?: string; ip?: string }> } | null
  expect(subjectAltName).toBeTruthy()
  if (subjectAltName) {
    const hasDNS = subjectAltName.altNames.some((altName: { type: number; value?: string; ip?: string }) => altName.type === 2 && altName.value === 'example.com')
    expect(hasDNS).toBe(true)
  }
})

test('generateCertificateForDomain - certificate key can be used to create private key', () => {
  const ca = generateCA()
  const result = generateCertificateForDomain('example.com', ca.key, ca.cert)

  const privateKey = forge.pki.privateKeyFromPem(result.key)
  expect(privateKey).toBeTruthy()
  expect(privateKey.n).toBeTruthy()
})
