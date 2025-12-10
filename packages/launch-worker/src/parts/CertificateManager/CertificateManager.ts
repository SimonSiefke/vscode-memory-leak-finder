import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import * as Root from '../Root/Root.ts'
import forge from 'node-forge'

const CERT_DIR = join(Root.root, '.vscode-proxy-certs')
const CA_KEY_PATH = join(CERT_DIR, 'ca-key.pem')
const CA_CERT_PATH = join(CERT_DIR, 'ca-cert.pem')

interface CertificatePair {
  key: string
  cert: string
}

const generateCA = (): CertificatePair => {
  const keys = forge.pki.rsa.generateKeyPair(2048)
  const cert = forge.pki.createCertificate()

  cert.publicKey = keys.publicKey
  cert.serialNumber = '01'
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 10)

  const attrs = [
    { name: 'countryName', value: 'US' },
    { name: 'organizationName', value: 'VS Code Memory Leak Finder Proxy' },
    { name: 'commonName', value: 'VS Code Proxy CA' },
  ]

  cert.setSubject(attrs)
  cert.setIssuer(attrs)
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: true,
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
  ])

  cert.sign(keys.privateKey, forge.md.sha256.create())

  return {
    key: forge.pki.privateKeyToPem(keys.privateKey),
    cert: forge.pki.certificateToPem(cert),
  }
}

const generateCertificateForDomain = (domain: string, caKey: string, caCert: string): CertificatePair => {
  const caPrivateKey = forge.pki.privateKeyFromPem(caKey)
  const caCertificate = forge.pki.certificateFromPem(caCert)

  const keys = forge.pki.rsa.generateKeyPair(2048)
  const cert = forge.pki.createCertificate()

  cert.publicKey = keys.publicKey
  cert.serialNumber = '02'
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1)

  cert.setSubject([
    { name: 'countryName', value: 'US' },
    { name: 'organizationName', value: 'VS Code Memory Leak Finder Proxy' },
    { name: 'commonName', value: domain },
  ])

  cert.setIssuer(caCertificate.subject.attributes)

  // Build altNames array - only add IP if domain is actually an IP address
  const altNames: Array<{ type: number; value?: string; ip?: string }> = [
    {
      type: 2, // DNS
      value: domain,
    },
  ]

  // Check if domain is an IP address (IPv4 or IPv6)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/
  if (ipv4Regex.test(domain) || ipv6Regex.test(domain)) {
    altNames.push({
      type: 7, // IP
      ip: domain,
    })
  }

  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: false,
    },
    {
      name: 'keyUsage',
      keyEncipherment: true,
      digitalSignature: true,
    },
    {
      name: 'subjectAltName',
      altNames,
    },
  ])

  cert.sign(caPrivateKey, forge.md.sha256.create())

  return {
    key: forge.pki.privateKeyToPem(keys.privateKey),
    cert: forge.pki.certificateToPem(cert),
  }
}

export const getOrCreateCA = async (): Promise<CertificatePair> => {
  await mkdir(CERT_DIR, { recursive: true })

  if (existsSync(CA_KEY_PATH) && existsSync(CA_CERT_PATH)) {
    const key = await readFile(CA_KEY_PATH, 'utf8')
    const cert = await readFile(CA_CERT_PATH, 'utf8')
    return { key, cert }
  }

  const ca = generateCA()
  await writeFile(CA_KEY_PATH, ca.key, 'utf8')
  await writeFile(CA_CERT_PATH, ca.cert, 'utf8')
  console.log(`[CertificateManager] Generated CA certificate at ${CA_CERT_PATH}`)
  console.log(`[CertificateManager] To trust this CA, set NODE_EXTRA_CA_CERTS=${CA_CERT_PATH}`)
  return ca
}

export const getCertificateForDomain = async (domain: string): Promise<CertificatePair> => {
  const ca = await getOrCreateCA()
  const certPath = join(CERT_DIR, `${domain.replace(/[^a-zA-Z0-9]/g, '_')}-cert.pem`)
  const keyPath = join(CERT_DIR, `${domain.replace(/[^a-zA-Z0-9]/g, '_')}-key.pem`)

  if (existsSync(certPath) && existsSync(keyPath)) {
    const cert = await readFile(certPath, 'utf8')
    const key = await readFile(keyPath, 'utf8')
    return { cert, key }
  }

  const domainCert = generateCertificateForDomain(domain, ca.key, ca.cert)
  await writeFile(certPath, domainCert.cert, 'utf8')
  await writeFile(keyPath, domainCert.key, 'utf8')
  return domainCert
}

export const getCACertPath = (): string => {
  return CA_CERT_PATH
}
