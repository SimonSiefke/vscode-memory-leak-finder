import { expect, test } from '@jest/globals'
import { getR2GetObjectRequest } from '../src/parts/GetR2GetObjectRequest/GetR2GetObjectRequest.ts'

test('getR2GetObjectRequest returns a signed private R2 get request', () => {
  const result = getR2GetObjectRequest({
    accessKeyId: 'ACCESSKEY123',
    accountId: '1234567890abcdef1234567890abcdef',
    bucket: 'vscode-memory-leak-finder',
    key: '.vscode-user-data-dir.zip',
    now: new Date('2026-05-20T12:34:56.000Z'),
    secretAccessKey: 'SECRETKEY123',
  })

  expect(result.url).toBe(
    'https://vscode-memory-leak-finder.1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com/.vscode-user-data-dir.zip',
  )
  expect(result.headers['x-amz-content-sha256']).toBe('UNSIGNED-PAYLOAD')
  expect(result.headers['x-amz-date']).toBe('20260520T123456Z')
  expect(result.headers.authorization).toContain('AWS4-HMAC-SHA256 Credential=ACCESSKEY123/20260520/auto/s3/aws4_request')
  expect(result.headers.authorization).toContain('SignedHeaders=host;x-amz-content-sha256;x-amz-date')
  expect(result.headers.authorization).toMatch(/Signature=[a-f0-9]{64}$/)
})

test('getR2GetObjectRequest encodes object key path segments', () => {
  const result = getR2GetObjectRequest({
    accessKeyId: 'ACCESSKEY123',
    accountId: '1234567890abcdef1234567890abcdef',
    bucket: 'vscode-memory-leak-finder',
    key: 'snapshots/user data dir.zip',
    now: new Date('2026-05-20T12:34:56.000Z'),
    secretAccessKey: 'SECRETKEY123',
  })

  expect(new URL(result.url).pathname).toBe('/snapshots/user%20data%20dir.zip')
})
