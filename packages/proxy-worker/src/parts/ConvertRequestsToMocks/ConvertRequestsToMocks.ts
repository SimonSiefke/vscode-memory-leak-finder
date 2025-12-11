import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { URL } from 'url'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { generateKeyPairSync } from 'crypto'
import * as jwt from 'jsonwebtoken'
import * as Root from '../Root/Root.ts'
import * as GetMockFileName from '../GetMockFileName/GetMockFileName.ts'
import type { MockConfigEntry } from '../MockConfigEntry/MockConfigEntry.ts'

const REQUESTS_DIR = join(Root.root, '.vscode-requests')
const MOCK_REQUESTS_DIR = join(Root.root, '.vscode-mock-requests')

const __dirname = dirname(fileURLToPath(import.meta.url))
const MOCK_CONFIG_PATH = join(__dirname, '..', 'GetMockFileName', 'mock-config.json')

interface RecordedRequest {
  timestamp: number
  method: string
  url: string
  headers: Record<string, string | string[]>
  response: {
    statusCode: number
    statusMessage?: string
    headers: Record<string, string | string[]>
    body: any
    wasCompressed?: boolean
  }
}

const loadMockConfig = async (): Promise<MockConfigEntry[]> => {
  try {
    if (!existsSync(MOCK_CONFIG_PATH)) {
      return []
    }
    const configContent = await readFile(MOCK_CONFIG_PATH, 'utf8')
    return JSON.parse(configContent) as MockConfigEntry[]
  } catch (error) {
    console.error(`Error loading mock config from ${MOCK_CONFIG_PATH}:`, error)
    return []
  }
}

const matchesPattern = (value: string, pattern: string): boolean => {
  if (pattern === '*') {
    return true
  }
  if (pattern.includes('*')) {
    // Simple wildcard matching: convert pattern to regex
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(value)
  }
  return value === pattern
}

const hasConfigEntry = (config: MockConfigEntry[], hostname: string, pathname: string, method: string): boolean => {
  const methodLower = method.toLowerCase()
  for (const entry of config) {
    const hostnameMatch = matchesPattern(hostname, entry.hostname) || hostname.includes(entry.hostname)
    const pathnameMatch = matchesPattern(pathname, entry.pathname)
    const methodMatch = matchesPattern(methodLower, entry.method.toLowerCase())
    if (hostnameMatch && pathnameMatch && methodMatch) {
      return true
    }
  }
  return false
}

// JWT pattern: three base64url-encoded parts separated by dots
const JWT_PATTERN = /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

// Cache for ECDSA key pairs (one per curve)
const ecdsaKeyPairs = new Map<string, { privateKey: string; publicKey: string }>()

// Cache for RSA key pair (one is enough for mock tokens)
let rsaKeyPair: { privateKey: string; publicKey: string } | null = null

const getEcdsaKeyPair = (algorithm: string): { privateKey: string; publicKey: string } => {
  // Map algorithm to curve name
  let curve: string
  if (algorithm === 'ES256') {
    curve = 'prime256v1' // P-256
  } else if (algorithm === 'ES384') {
    curve = 'secp384r1' // P-384
  } else if (algorithm === 'ES512') {
    curve = 'secp521r1' // P-521
  } else {
    curve = 'prime256v1' // Default to P-256
  }

  if (!ecdsaKeyPairs.has(curve)) {
    const { privateKey, publicKey } = generateKeyPairSync('ec', {
      namedCurve: curve,
    })
    ecdsaKeyPairs.set(curve, {
      privateKey: privateKey.export({ type: 'sec1', format: 'pem' }) as string,
      publicKey: publicKey.export({ type: 'spki', format: 'pem' }) as string,
    })
  }

  return ecdsaKeyPairs.get(curve)!
}

const getRsaKeyPair = (): { privateKey: string; publicKey: string } => {
  if (!rsaKeyPair) {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    })
    rsaKeyPair = {
      privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }) as string,
      publicKey: publicKey.export({ type: 'spki', format: 'pem' }) as string,
    }
  }
  return rsaKeyPair
}

const isJwtToken = (value: string): boolean => {
  if (typeof value !== 'string') {
    return false
  }
  // Check if it matches JWT pattern (three parts separated by dots)
  const parts = value.split('.')
  if (parts.length !== 3) {
    return false
  }
  // Check if it matches the pattern (starts with eyJ which is base64url for {" header)
  return JWT_PATTERN.test(value)
}

const replaceJwtToken = (token: string): string => {
  try {
    // Decode the JWT without verification to get the payload
    const decoded = jwt.decode(token, { complete: true })
    if (!decoded || typeof decoded === 'string' || !decoded.payload) {
      return token // Return original if decoding fails
    }

    const payload = decoded.payload as Record<string, any>
    const header = decoded.header

    // Update expiration to one month from now
    const oneMonthFromNow = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    const newPayload = {
      ...payload,
      exp: oneMonthFromNow,
      iat: Math.floor(Date.now() / 1000), // Update issued at time
    }

    // Generate new JWT with the same algorithm (default to HS256 if not specified)
    const algorithm = (header.alg || 'HS256') as jwt.Algorithm

    // Determine if algorithm is symmetric or asymmetric
    const symmetricAlgorithms = ['HS256', 'HS384', 'HS512']
    const isSymmetric = symmetricAlgorithms.includes(algorithm)

    let newToken: string

    if (isSymmetric) {
      // Use secret for symmetric algorithms
      const secret = 'mock-secret-key-for-jwt-generation' // Fixed secret for mock tokens
      newToken = jwt.sign(newPayload, secret, {
        algorithm,
      })
    } else {
      // Use key pair for asymmetric algorithms (RS256, RS384, RS512, ES256, ES384, ES512)
      if (algorithm.startsWith('ES')) {
        // ECDSA algorithms
        const { privateKey } = getEcdsaKeyPair(algorithm)
        newToken = jwt.sign(newPayload, privateKey, {
          algorithm,
        })
      } else if (algorithm.startsWith('RS') || algorithm.startsWith('PS')) {
        // RSA algorithms - use cached key pair
        const { privateKey } = getRsaKeyPair()
        newToken = jwt.sign(newPayload, privateKey, {
          algorithm,
        })
      } else {
        // Fallback to HS256 for unknown algorithms
        const secret = 'mock-secret-key-for-jwt-generation'
        newToken = jwt.sign(newPayload, secret, {
          algorithm: 'HS256',
        })
      }
    }

    return newToken
  } catch (error) {
    // If anything fails, return the original token
    console.warn(`Failed to replace JWT token: ${error}`)
    return token
  }
}

const replaceJwtTokensInValue = (value: any): any => {
  if (typeof value === 'string') {
    if (isJwtToken(value)) {
      return replaceJwtToken(value)
    }
    // Check if the string contains a JWT token (e.g., "Bearer eyJ...")
    const jwtMatch = value.match(/(Bearer\s+)?(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/)
    if (jwtMatch) {
      const prefix = jwtMatch[1] || ''
      const token = jwtMatch[2]
      if (isJwtToken(token)) {
        return prefix + replaceJwtToken(token)
      }
    }
    return value
  }

  if (Array.isArray(value)) {
    return value.map(replaceJwtTokensInValue)
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, any> = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = replaceJwtTokensInValue(val)
    }
    return result
  }

  return value
}

const convertRequestsToMocks = async (): Promise<void> => {
  try {
    // Check if requests directory exists
    if (!existsSync(REQUESTS_DIR)) {
      console.log(`Requests directory does not exist: ${REQUESTS_DIR}`)
      console.log('No requests to convert.')
      return
    }

    // Ensure mock directory exists
    await mkdir(MOCK_REQUESTS_DIR, { recursive: true })

    // Read all files from requests directory
    const files = await readdir(REQUESTS_DIR)
    const jsonFiles = files.filter((file) => file.endsWith('.json'))

    console.log(`Found ${jsonFiles.length} request files to process`)

    // Map to store latest request for each URL+method combination
    const latestRequests = new Map<string, RecordedRequest>()

    // Process each file
    for (const file of jsonFiles) {
      try {
        const filePath = join(REQUESTS_DIR, file)
        const content = await readFile(filePath, 'utf8')
        const request: RecordedRequest = JSON.parse(content)

        // Create a key from URL and method
        const key = `${request.method}:${request.url}`

        // Check if we already have a request for this key
        const existing = latestRequests.get(key)
        if (!existing || request.timestamp > existing.timestamp) {
          // Keep the latest one
          latestRequests.set(key, request)
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error)
        // Continue with other files
      }
    }

    console.log(`Found ${latestRequests.size} unique request/response pairs`)

    // Load existing mock config
    const mockConfig = await loadMockConfig()

    // Convert each request to mock format and save
    let savedCount = 0
    let skippedCount = 0
    let configAddedCount = 0

    for (const request of latestRequests.values()) {
      try {
        // Skip requests without a response or without required fields
        if (!request.response || typeof request.response.statusCode === 'undefined') {
          console.log(`Skipping request ${request.method} ${request.url} - no response data or missing statusCode`)
          skippedCount++
          continue
        }

        // Parse URL to get hostname and pathname
        const parsedUrl = new URL(request.url)
        const hostname = parsedUrl.hostname
        const pathname = parsedUrl.pathname

        // Generate mock filename using the same logic as GetMockFileName
        const mockFileName = await GetMockFileName.getMockFileName(hostname, pathname, request.method)
        const mockFilePath = join(MOCK_REQUESTS_DIR, mockFileName)

        // Replace JWT tokens in request headers, response headers, and response body
        const sanitizedRequestHeaders = replaceJwtTokensInValue(request.headers || {})
        const sanitizedResponseHeaders = replaceJwtTokensInValue(request.response.headers || {})
        const sanitizedResponseBody = replaceJwtTokensInValue(request.response.body)

        // Create mock data structure matching what GetMockResponse expects
        const mockData = {
          response: {
            statusCode: request.response.statusCode,
            statusMessage: request.response.statusMessage,
            headers: sanitizedResponseHeaders,
            body: sanitizedResponseBody,
            wasCompressed: request.response.wasCompressed,
          },
        }

        // Save mock file
        await writeFile(mockFilePath, JSON.stringify(mockData, null, 2), 'utf8')
        savedCount++

        // Check if we need to add this to mock-config.json
        if (!hasConfigEntry(mockConfig, hostname, pathname, request.method)) {
          const newEntry: MockConfigEntry = {
            hostname,
            pathname,
            method: request.method,
            filename: mockFileName,
          }
          mockConfig.push(newEntry)
          configAddedCount++
        }
      } catch (error) {
        console.error(`Error converting request ${request.method} ${request.url}:`, error)
        skippedCount++
      }
    }

    // Save updated mock config
    if (configAddedCount > 0) {
      // Sort config entries for consistency
      mockConfig.sort((a, b) => {
        if (a.hostname !== b.hostname) {
          return a.hostname.localeCompare(b.hostname)
        }
        if (a.pathname !== b.pathname) {
          return a.pathname.localeCompare(b.pathname)
        }
        return a.method.localeCompare(b.method)
      })
      await writeFile(MOCK_CONFIG_PATH, JSON.stringify(mockConfig, null, 2), 'utf8')
      console.log(`Added ${configAddedCount} entries to mock-config.json`)
    }

    console.log(`Successfully converted ${savedCount} requests to mocks`)
    if (skippedCount > 0) {
      console.log(`Skipped ${skippedCount} requests due to errors`)
    }
  } catch (error) {
    console.error('Error converting requests to mocks:', error)
    throw error
  }
}

export const convertRequestsToMocksMain = async (): Promise<void> => {
  await convertRequestsToMocks()
}
