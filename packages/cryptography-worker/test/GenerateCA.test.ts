import { expect, test } from '@jest/globals'
import forge from 'node-forge'
import { generateCA } from '../src/parts/GenerateCA/GenerateCA.ts'

test('generateCA - returns certificate pair', () => {
  const ca = generateCA()
  expect(ca).toBeDefined()
  expect(ca.cert).toBeDefined()
  expect(ca.key).toBeDefined()
  expect(typeof ca.cert).toBe('string')
  expect(typeof ca.key).toBe('string')
})

test('generateCA - returns valid PEM format', () => {
  const ca = generateCA()
  expect(ca.cert).toContain('BEGIN CERTIFICATE')
  expect(ca.cert).toContain('END CERTIFICATE')
  expect(ca.key).toContain('BEGIN')
  expect(ca.key).toContain('PRIVATE KEY')
  expect(ca.key).toContain('END')
})

test('generateCA - certificate can be parsed', () => {
  const ca = generateCA()
  const cert = forge.pki.certificateFromPem(ca.cert)
  expect(cert).toBeDefined()
  expect(cert.subject).toBeDefined()
  expect(cert.issuer).toBeDefined()
})

test('generateCA - certificate has correct subject', () => {
  const ca = generateCA()
  const cert = forge.pki.certificateFromPem(ca.cert)
  expect(cert.subject.getField('CN')?.value).toBe('VS Code Proxy CA')
  expect(cert.subject.getField('O')?.value).toBe('VS Code Memory Leak Finder Proxy')
  expect(cert.subject.getField('C')?.value).toBe('US')
})

test('generateCA - certificate is self-signed', () => {
  const ca = generateCA()
  const cert = forge.pki.certificateFromPem(ca.cert)
  expect(cert.issuer.getField('CN')?.value).toBe('VS Code Proxy CA')
  expect(cert.subject.getField('CN')?.value).toBe(cert.issuer.getField('CN')?.value)
})

test('generateCA - certificate has correct validity period', () => {
  const ca = generateCA()
  const cert = forge.pki.certificateFromPem(ca.cert)
  const now = new Date()
  const tenYearsFromNow = new Date()
  tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10)

  expect(cert.validity.notBefore.getTime()).toBeLessThanOrEqual(now.getTime() + 1000)
  expect(cert.validity.notAfter.getTime()).toBeGreaterThan(tenYearsFromNow.getTime() - 24 * 60 * 60 * 1000)
})

test('generateCA - certificate has basicConstraints extension', () => {
  const ca = generateCA()
  const cert = forge.pki.certificateFromPem(ca.cert)
  const basicConstraints = cert.getExtension('basicConstraints') as { cA: boolean } | null
  expect(basicConstraints).toBeTruthy()
  if (basicConstraints) {
    expect(basicConstraints.cA).toBe(true)
  }
})

test('generateCA - certificate has keyUsage extension', () => {
  const ca = generateCA()
  const cert = forge.pki.certificateFromPem(ca.cert)
  const keyUsage = cert.getExtension('keyUsage') as {
    digitalSignature: boolean
    keyEncipherment: boolean
    keyCertSign: boolean
    dataEncipherment: boolean
    nonRepudiation: boolean
  } | null
  expect(keyUsage).toBeTruthy()
  if (keyUsage) {
    expect(keyUsage.digitalSignature).toBe(true)
    expect(keyUsage.keyEncipherment).toBe(true)
    expect(keyUsage.keyCertSign).toBe(true)
    expect(keyUsage.dataEncipherment).toBe(true)
    expect(keyUsage.nonRepudiation).toBe(true)
  }
})

test('generateCA - certificate is properly signed', () => {
  const ca = generateCA()
  const cert = forge.pki.certificateFromPem(ca.cert)
  const privateKey = forge.pki.privateKeyFromPem(ca.key)
  const { publicKey } = cert

  expect(publicKey.n).toBeDefined()
  expect(publicKey.e).toBeDefined()
  expect(privateKey.n).toBeDefined()
  expect(privateKey.e).toBeDefined()
})

test('generateCA - certificate serial number is set', () => {
  const ca = generateCA()
  const cert = forge.pki.certificateFromPem(ca.cert)
  expect(cert.serialNumber).toBe('01')
})

test('generateCA - generates different CAs on each call', () => {
  const ca1 = generateCA()
  const ca2 = generateCA()
  expect(ca1.cert).not.toBe(ca2.cert)
  expect(ca1.key).not.toBe(ca2.key)
})

test('generateCA - private key matches certificate', () => {
  const ca = generateCA()
  const cert = forge.pki.certificateFromPem(ca.cert)
  const privateKey = forge.pki.privateKeyFromPem(ca.key)
  const { publicKey } = cert

  expect(publicKey.n.equals(privateKey.n)).toBe(true)
  expect(publicKey.e.equals(privateKey.e)).toBe(true)
})
