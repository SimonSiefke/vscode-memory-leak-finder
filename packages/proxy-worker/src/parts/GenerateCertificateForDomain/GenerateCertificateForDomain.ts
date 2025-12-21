import forge from 'node-forge'
import type { CertificatePair } from '../CertificatePair/CertificatePair.ts'

const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/

export const generateCertificateForDomain = (domain: string, caKey: string, caCert: string): CertificatePair => {
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
  if (ipv4Regex.test(domain) || ipv6Regex.test(domain)) {
    altNames.push({
      ip: domain,
      type: 7, // IP
    })
  }

  cert.setExtensions([
    {
      cA: false,
      name: 'basicConstraints',
    },
    {
      digitalSignature: true,
      keyEncipherment: true,
      name: 'keyUsage',
    },
    {
      altNames,
      name: 'subjectAltName',
    },
  ])

  cert.sign(caPrivateKey, forge.md.sha256.create())

  return {
    cert: forge.pki.certificateToPem(cert),
    key: forge.pki.privateKeyToPem(keys.privateKey),
  }
}
