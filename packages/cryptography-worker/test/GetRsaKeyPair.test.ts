import { expect, test } from '@jest/globals'
import { createPublicKey, createPrivateKey } from 'node:crypto'
import { getRsaKeyPair } from '../src/parts/GetRsaKeyPair/GetRsaKeyPair.ts'

test.skip('getRsaKeyPair - returns key pair with privateKey and publicKey', () => {
  const keyPair = getRsaKeyPair()
  expect(keyPair).toBeDefined()
  expect(keyPair.privateKey).toBeDefined()
  expect(keyPair.publicKey).toBeDefined()
  expect(typeof keyPair.privateKey).toBe('string')
  expect(typeof keyPair.publicKey).toBe('string')
})

test.skip('getRsaKeyPair - returns valid PEM format keys', () => {
  const keyPair = getRsaKeyPair()
  expect(keyPair.privateKey).toContain('BEGIN PRIVATE KEY')
  expect(keyPair.privateKey).toContain('END PRIVATE KEY')
  expect(keyPair.publicKey).toContain('BEGIN PUBLIC KEY')
  expect(keyPair.publicKey).toContain('END PUBLIC KEY')
})

test.skip('getRsaKeyPair - returns same key pair on multiple calls (cached)', () => {
  const keyPair1 = getRsaKeyPair()
  const keyPair2 = getRsaKeyPair()
  expect(keyPair1.privateKey).toBe(keyPair2.privateKey)
  expect(keyPair1.publicKey).toBe(keyPair2.publicKey)
})

test.skip('getRsaKeyPair - private key can be used to create crypto key object', () => {
  const keyPair = getRsaKeyPair()
  const privateKey = createPrivateKey(keyPair.privateKey)
  expect(privateKey).toBeDefined()
  expect(privateKey.asymmetricKeyType).toBe('rsa')
})

test.skip('getRsaKeyPair - public key can be used to create crypto key object', () => {
  const keyPair = getRsaKeyPair()
  const publicKey = createPublicKey(keyPair.publicKey)
  expect(publicKey).toBeDefined()
  expect(publicKey.asymmetricKeyType).toBe('rsa')
})

test.skip('getRsaKeyPair - public key matches private key', () => {
  const keyPair = getRsaKeyPair()
  const privateKey = createPrivateKey(keyPair.privateKey)
  const exportedPublicKey = privateKey.export({ format: 'pem', type: 'spki' })
  expect(exportedPublicKey.toString()).toBe(keyPair.publicKey)
})
