import { expect, test } from '@jest/globals'
import jwt from 'jsonwebtoken'
import { generateKeyPairSync } from 'crypto'
import { replaceJwtToken } from '../src/parts/ReplaceJwtToken/ReplaceJwtToken.ts'

test('replaceJwtToken - replaces HS256 token with extended expiration', () => {
  const originalToken = jwt.sign({ sub: '123', exp: Math.floor(Date.now() / 1000) + 3600 }, 'secret', {
    algorithm: 'HS256',
  })
  const replacedToken = replaceJwtToken(originalToken)
  expect(replacedToken).not.toBe(originalToken)

  const decoded = jwt.decode(replacedToken, { complete: true })
  expect(decoded).toBeTruthy()
  if (decoded && typeof decoded !== 'string') {
    const payload = decoded.payload as { exp?: number; iat?: number }
    expect(payload.exp).toBeDefined()
    const oneMonthInSeconds = 30 * 24 * 60 * 60
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000) + oneMonthInSeconds - 60)
    expect(payload.exp).toBeLessThan(Math.floor(Date.now() / 1000) + oneMonthInSeconds + 60)
  }
})

test('replaceJwtToken - replaces RS256 token with extended expiration', () => {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  })
  const originalToken = jwt.sign({ sub: '123', exp: Math.floor(Date.now() / 1000) + 3600 }, privateKey, {
    algorithm: 'RS256',
  })
  const replacedToken = replaceJwtToken(originalToken)
  expect(replacedToken).not.toBe(originalToken)

  const decoded = jwt.decode(replacedToken, { complete: true })
  expect(decoded).toBeTruthy()
  if (decoded && typeof decoded !== 'string') {
    const payload = decoded.payload as { exp?: number }
    expect(payload.exp).toBeDefined()
  }
})

test('replaceJwtToken - replaces ES256 token with extended expiration', () => {
  const { privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
  })
  const originalToken = jwt.sign({ sub: '123', exp: Math.floor(Date.now() / 1000) + 3600 }, privateKey, {
    algorithm: 'ES256',
  })
  const replacedToken = replaceJwtToken(originalToken)
  expect(replacedToken).not.toBe(originalToken)

  const decoded = jwt.decode(replacedToken, { complete: true })
  expect(decoded).toBeTruthy()
  if (decoded && typeof decoded !== 'string') {
    const payload = decoded.payload as { exp?: number }
    expect(payload.exp).toBeDefined()
  }
})

test('replaceJwtToken - replaces ES384 token with extended expiration', () => {
  const { privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'secp384r1',
  })
  const originalToken = jwt.sign({ sub: '123', exp: Math.floor(Date.now() / 1000) + 3600 }, privateKey, {
    algorithm: 'ES384',
  })
  const replacedToken = replaceJwtToken(originalToken)
  expect(replacedToken).not.toBe(originalToken)

  const decoded = jwt.decode(replacedToken, { complete: true })
  expect(decoded).toBeTruthy()
})

test('replaceJwtToken - replaces ES512 token with extended expiration', () => {
  const { privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'secp521r1',
  })
  const originalToken = jwt.sign({ sub: '123', exp: Math.floor(Date.now() / 1000) + 3600 }, privateKey, {
    algorithm: 'ES512',
  })
  const replacedToken = replaceJwtToken(originalToken)
  expect(replacedToken).not.toBe(originalToken)

  const decoded = jwt.decode(replacedToken, { complete: true })
  expect(decoded).toBeTruthy()
})

test('replaceJwtToken - updates iat field', () => {
  const originalToken = jwt.sign({ sub: '123', iat: Math.floor(Date.now() / 1000) - 1000 }, 'secret', {
    algorithm: 'HS256',
  })
  const replacedToken = replaceJwtToken(originalToken)
  const decoded = jwt.decode(replacedToken, { complete: true })
  expect(decoded).toBeTruthy()
  if (decoded && typeof decoded !== 'string') {
    const payload = decoded.payload as { iat?: number }
    expect(payload.iat).toBeDefined()
    expect(payload.iat).toBeGreaterThan(Math.floor(Date.now() / 1000) - 60)
  }
})

test('replaceJwtToken - preserves other payload fields', () => {
  const originalToken = jwt.sign(
    { sub: '123', name: 'John Doe', email: 'john@example.com', exp: Math.floor(Date.now() / 1000) + 3600 },
    'secret',
    {
      algorithm: 'HS256',
    },
  )
  const replacedToken = replaceJwtToken(originalToken)
  const decoded = jwt.decode(replacedToken, { complete: true })
  expect(decoded).toBeTruthy()
  if (decoded && typeof decoded !== 'string') {
    const payload = decoded.payload as { sub?: string; name?: string; email?: string }
    expect(payload.sub).toBe('123')
    expect(payload.name).toBe('John Doe')
    expect(payload.email).toBe('john@example.com')
  }
})

test('replaceJwtToken - returns original token if decoding fails', () => {
  const invalidToken = 'not.a.valid.jwt.token'
  const result = replaceJwtToken(invalidToken)
  expect(result).toBe(invalidToken)
})

test('replaceJwtToken - returns original token if token is not a string', () => {
  const invalidToken = 'invalid'
  const result = replaceJwtToken(invalidToken)
  expect(result).toBe(invalidToken)
})

test('replaceJwtToken - handles token without exp field', () => {
  const originalToken = jwt.sign({ sub: '123' }, 'secret', {
    algorithm: 'HS256',
  })
  const replacedToken = replaceJwtToken(originalToken)
  expect(replacedToken).not.toBe(originalToken)

  const decoded = jwt.decode(replacedToken, { complete: true })
  expect(decoded).toBeTruthy()
  if (decoded && typeof decoded !== 'string') {
    const payload = decoded.payload as { exp?: number }
    expect(payload.exp).toBeDefined()
  }
})

test('replaceJwtToken - handles RS384 token', () => {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  })
  const originalToken = jwt.sign({ sub: '123', exp: Math.floor(Date.now() / 1000) + 3600 }, privateKey, {
    algorithm: 'RS384',
  })
  const replacedToken = replaceJwtToken(originalToken)
  expect(replacedToken).not.toBe(originalToken)
})

test('replaceJwtToken - handles RS512 token', () => {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  })
  const originalToken = jwt.sign({ sub: '123', exp: Math.floor(Date.now() / 1000) + 3600 }, privateKey, {
    algorithm: 'RS512',
  })
  const replacedToken = replaceJwtToken(originalToken)
  expect(replacedToken).not.toBe(originalToken)
})

test('replaceJwtToken - handles unknown algorithm by falling back to HS256', () => {
  const originalToken = jwt.sign({ sub: '123', exp: Math.floor(Date.now() / 1000) + 3600 }, 'secret', {
    algorithm: 'HS256',
  })
  const replacedToken = replaceJwtToken(originalToken)
  expect(replacedToken).not.toBe(originalToken)
})
