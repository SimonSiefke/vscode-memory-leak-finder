import { expect, test } from '@jest/globals'
import { generateCA } from '../src/parts/GenerateCA/GenerateCA.ts'
import { generateCertificateForDomain } from '../src/parts/GenerateCertificateForDomain/GenerateCertificateForDomain.ts'
import { validateCertificateKeyPair } from '../src/parts/ValidateCertificateKeyPair/ValidateCertificateKeyPair.ts'

test('validateCertificateKeyPair - returns true for matching certificate and key', () => {
  const ca = generateCA()
  const domainCert = generateCertificateForDomain('example.com', ca.key, ca.cert)
  expect(validateCertificateKeyPair(domainCert.cert, domainCert.key)).toBe(true)
})

test('validateCertificateKeyPair - returns true for CA certificate and key', () => {
  const ca = generateCA()
  expect(validateCertificateKeyPair(ca.cert, ca.key)).toBe(true)
})

test('validateCertificateKeyPair - returns false for mismatched certificate and key', () => {
  const ca1 = generateCA()
  const ca2 = generateCA()
  expect(validateCertificateKeyPair(ca1.cert, ca2.key)).toBe(false)
})

test('validateCertificateKeyPair - returns false for invalid certificate PEM', () => {
  const ca = generateCA()
  expect(validateCertificateKeyPair('invalid cert', ca.key)).toBe(false)
})

test('validateCertificateKeyPair - returns false for invalid key PEM', () => {
  const ca = generateCA()
  expect(validateCertificateKeyPair(ca.cert, 'invalid key')).toBe(false)
})

test('validateCertificateKeyPair - returns false for empty strings', () => {
  expect(validateCertificateKeyPair('', '')).toBe(false)
})

test('validateCertificateKeyPair - returns false when certificate and key are swapped', () => {
  const ca = generateCA()
  expect(validateCertificateKeyPair(ca.key, ca.cert)).toBe(false)
})

test('validateCertificateKeyPair - validates multiple domain certificates', () => {
  const ca = generateCA()
  const cert1 = generateCertificateForDomain('example.com', ca.key, ca.cert)
  const cert2 = generateCertificateForDomain('test.com', ca.key, ca.cert)
  const cert3 = generateCertificateForDomain('localhost', ca.key, ca.cert)

  expect(validateCertificateKeyPair(cert1.cert, cert1.key)).toBe(true)
  expect(validateCertificateKeyPair(cert2.cert, cert2.key)).toBe(true)
  expect(validateCertificateKeyPair(cert3.cert, cert3.key)).toBe(true)
})

test('validateCertificateKeyPair - returns false for certificate with different key', () => {
  const ca = generateCA()
  const cert1 = generateCertificateForDomain('example.com', ca.key, ca.cert)
  const cert2 = generateCertificateForDomain('test.com', ca.key, ca.cert)
  expect(validateCertificateKeyPair(cert1.cert, cert2.key)).toBe(false)
})
