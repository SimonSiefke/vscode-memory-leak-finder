import { generateCA } from '../GenerateCA/GenerateCA.ts'
import { generateCertificateForDomain } from '../GenerateCertificateForDomain/GenerateCertificateForDomain.ts'
import { getCertificateForDomain } from '../GetCertificateForDomain/GetCertificateForDomain.ts'
import { getEcdsaKeyPair } from '../GetEcdsaKeyPair/GetEcdsaKeyPair.ts'
import { getRsaKeyPair } from '../GetRsaKeyPair/GetRsaKeyPair.ts'
import { replaceJwtToken } from '../ReplaceJwtToken/ReplaceJwtToken.ts'

export const commandMap = {
  'Cryptography.generateCA': generateCA,
  'Cryptography.generateCertificateForDomain': generateCertificateForDomain,
  'Cryptography.getCertificateForDomain': getCertificateForDomain,
  'Cryptography.getEcdsaKeyPair': getEcdsaKeyPair,
  'Cryptography.getRsaKeyPair': getRsaKeyPair,
  'Cryptography.replaceJwtToken': replaceJwtToken,
}
