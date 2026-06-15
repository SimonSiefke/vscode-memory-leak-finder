import { createHash, createHmac } from 'node:crypto'

const algorithm = 'AWS4-HMAC-SHA256'
const region = 'auto'
const service = 's3'
const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
const unsignedPayload = 'UNSIGNED-PAYLOAD'

const encodeRfc3986 = (value: string): string => {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => {
    return `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  })
}

const toAmzDate = (value: Date): string => {
  return value.toISOString().replace(/[:-]|\.\d{3}/g, '')
}

const toDateStamp = (value: string): string => {
  return value.slice(0, 8)
}

const sha256Hex = (value: string): string => {
  return createHash('sha256').update(value).digest('hex')
}

const hmac = (key: Buffer | string, value: string): Buffer => {
  return createHmac('sha256', key).update(value).digest()
}

const toCanonicalUri = (key: string): string => {
  const normalizedKey = key.replace(/^\/+/, '')
  if (!normalizedKey) {
    return '/'
  }
  return `/${normalizedKey.split('/').map(encodeRfc3986).join('/')}`
}

const getSigningKey = (secretAccessKey: string, dateStamp: string): Buffer => {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp)
  const regionKey = hmac(dateKey, region)
  const serviceKey = hmac(regionKey, service)
  return hmac(serviceKey, 'aws4_request')
}

export const getR2GetObjectRequest = ({
  accessKeyId,
  accountId,
  bucket,
  key,
  now = new Date(),
  secretAccessKey,
}: {
  accessKeyId: string
  accountId: string
  bucket: string
  key: string
  now?: Date
  secretAccessKey: string
}): {
  readonly headers: Record<string, string>
  readonly url: string
} => {
  const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`
  const amzDate = toAmzDate(now)
  const dateStamp = toDateStamp(amzDate)
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const canonicalUri = toCanonicalUri(key)
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${unsignedPayload}\nx-amz-date:${amzDate}\n`
  const canonicalRequest = ['GET', canonicalUri, '', canonicalHeaders, signedHeaders, unsignedPayload].join('\n')
  const stringToSign = [algorithm, amzDate, credentialScope, sha256Hex(canonicalRequest)].join('\n')
  const signature = createHmac('sha256', getSigningKey(secretAccessKey, dateStamp)).update(stringToSign).digest('hex')
  return {
    headers: {
      authorization: `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      'x-amz-content-sha256': unsignedPayload,
      'x-amz-date': amzDate,
    },
    url: `https://${host}${canonicalUri}`,
  }
}
