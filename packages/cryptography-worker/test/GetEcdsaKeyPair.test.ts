import { expect, test } from '@jest/globals'
import { createPublicKey, createPrivateKey } from 'node:crypto'
import { getEcdsaKeyPair } from '../src/parts/GetEcdsaKeyPair/GetEcdsaKeyPair.ts'

test.skip('getEcdsaKeyPair - returns key pair for ES256', () => {
  const keyPair = getEcdsaKeyPair('ES256')
  expect(keyPair).toBeDefined()
  expect(keyPair.privateKey).toBeDefined()
  expect(keyPair.publicKey).toBeDefined()
  expect(typeof keyPair.privateKey).toBe('string')
  expect(typeof keyPair.publicKey).toBe('string')
})

test.skip('getEcdsaKeyPair - returns key pair for ES384', () => {
  const keyPair = getEcdsaKeyPair('ES384')
  expect(keyPair).toBeDefined()
  expect(keyPair.privateKey).toBeDefined()
  expect(keyPair.publicKey).toBeDefined()
})

test.skip('getEcdsaKeyPair - returns key pair for ES512', () => {
  const keyPair = getEcdsaKeyPair('ES512')
  expect(keyPair).toBeDefined()
  expect(keyPair.privateKey).toBeDefined()
  expect(keyPair.publicKey).toBeDefined()
})

test.skip('getEcdsaKeyPair - returns same key pair for same algorithm (cached)', () => {
  const keyPair1 = getEcdsaKeyPair('ES256')
  const keyPair2 = getEcdsaKeyPair('ES256')
  expect(keyPair1.privateKey).toBe(keyPair2.privateKey)
  expect(keyPair1.publicKey).toBe(keyPair2.publicKey)
})

test.skip('getEcdsaKeyPair - returns different key pairs for different algorithms', () => {
  const keyPair256 = getEcdsaKeyPair('ES256')
  const keyPair384 = getEcdsaKeyPair('ES384')
  const keyPair512 = getEcdsaKeyPair('ES512')
  expect(keyPair256.privateKey).not.toBe(keyPair384.privateKey)
  expect(keyPair256.privateKey).not.toBe(keyPair512.privateKey)
  expect(keyPair384.privateKey).not.toBe(keyPair512.privateKey)
})

test.skip('getEcdsaKeyPair - defaults to ES256 for unknown algorithm', () => {
  const keyPairDefault = getEcdsaKeyPair('UNKNOWN')
  const keyPair256 = getEcdsaKeyPair('ES256')
  expect(keyPairDefault.privateKey).toBe(keyPair256.privateKey)
  expect(keyPairDefault.publicKey).toBe(keyPair256.publicKey)
})

test.skip('getEcdsaKeyPair - returns valid PEM format keys', () => {
  const keyPair = getEcdsaKeyPair('ES256')
  expect(keyPair.privateKey).toContain('BEGIN EC PRIVATE KEY')
  expect(keyPair.privateKey).toContain('END EC PRIVATE KEY')
  expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY')
  expect(keyPair.publicKey).toContain('END PUBLIC KEY')
})

test.skip('getEcdsaKeyPair - private key can be used to create crypto key object', () => {
  const keyPair = getEcdsaKeyPair('ES256')
  const privateKey = createPrivateKey(keyPair.privateKey)
  expect(privateKey).toBeDefined()
  expect(privateKey.asymmetricKeyType).toBe('ec')
})

test.skip('getEcdsaKeyPair - public key can be used to create crypto key object', () => {
  const keyPair = getEcdsaKeyPair('ES256')
  const publicKey = createPublicKey(keyPair.publicKey)
  expect(publicKey).toBeDefined()
  expect(publicKey.asymmetricKeyType).toBe('ec')
})

test.skip('getEcdsaKeyPair - public key matches private key', () => {
  const keyPair = getEcdsaKeyPair('ES256')
  const privateKey = createPrivateKey(keyPair.privateKey)
  const exportedPublicKey = privateKey.export({ format: 'pem', type: 'spki' })
  expect(exportedPublicKey.toString()).toBe(keyPair.publicKey)
})
