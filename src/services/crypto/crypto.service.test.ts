import { describe, test, expect, beforeEach, vi } from 'vitest'
import { CryptoService } from './crypto.service'
import { KeysService } from './keys.service'
import { ConfigService } from '../config'

vi.mock('openpgp', () => ({
    default: {
        readKey: vi.fn(),
        readPrivateKey: vi.fn(),
        readMessage: vi.fn(),
        encrypt: vi.fn(),
        decrypt: vi.fn(),
        generateKey: vi.fn(),
    },
    readKey: vi.fn(),
    readPrivateKey: vi.fn(),
    readMessage: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
    generateKey: vi.fn(),
}));

describe('Crypto Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.spyOn(ConfigService.instance, 'getVariable').mockReturnValue(
      'test-secret',
    )
  })

  describe('Password hashing', () => {
    test('When hashing a password without salt, then a new salt is generated', () => {
      const password = 'test-password'
      const result = CryptoService.instance.passToHash({ password })

      expect(result.salt).toBeDefined()
      expect(result.hash).toBeDefined()
      expect(result.salt.length).toBe(32) // 128/8 = 16 bytes = 32 hex chars
      expect(result.hash.length).toBe(64) // 256/8 = 32 bytes = 64 hex chars
    })

    test('When hashing a password with provided salt, then that salt is used', () => {
      const password = 'test-password'
      // Valid hex string (32 chars = 16 bytes)
      const salt = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'
      const result = CryptoService.instance.passToHash({ password, salt })

      expect(result.salt).toBe(salt)
      expect(result.hash).toBeDefined()
      expect(result.hash.length).toBe(64)
    })
  })

  describe('Text encryption and decryption', () => {
    test('When encrypting and decrypting text, then original text is recovered', () => {
      const originalText = 'test-text'
      const encrypted = CryptoService.instance.encryptText(originalText)
      const decrypted = CryptoService.instance.decryptText(encrypted)

      expect(encrypted).not.toBe(originalText)
      expect(decrypted).toBe(originalText)
    })

    test('When encrypting with a custom key, then it can be decrypted with the same key', () => {
      const originalText = 'test-text'
      const key = 'test-key'
      const encrypted = CryptoService.instance.encryptTextWithKey(
        originalText,
        key,
      )
      const decrypted = CryptoService.instance.decryptTextWithKey(
        encrypted,
        key,
      )

      expect(encrypted).not.toBe(originalText)
      expect(decrypted).toBe(originalText)
    })
  })

  describe('Crypto provider', () => {
    test('When generating keys, then it returns the expected structure with ECC keys', async () => {
      const mockKeys = {
        privateKeyArmored: 'private',
        privateKeyArmoredEncrypted: 'encrypted-private',
        publicKeyArmored: 'public',
        revocationCertificate: 'revocation',
      }

      vi.spyOn(
        KeysService.instance,
        'generateNewKeysWithEncrypted',
      ).mockResolvedValue(mockKeys)

      const password = 'test-password'
      const keys = await CryptoService.cryptoProvider.generateKeys(password)

      expect(keys).toEqual({
        privateKeyEncrypted: mockKeys.privateKeyArmoredEncrypted,
        publicKey: mockKeys.publicKeyArmored,
        revocationCertificate: mockKeys.revocationCertificate,
        ecc: {
          publicKey: mockKeys.publicKeyArmored,
          privateKeyEncrypted: mockKeys.privateKeyArmoredEncrypted,
        },
        kyber: {
          publicKey: null,
          privateKeyEncrypted: null,
        },
      })
    })

    test('When encrypting password hash, then it decrypts salt, hashes password, and encrypts result', () => {
      const password = 'test-password'
      const encryptedSalt = 'encrypted-salt'
      const decryptedSalt = 'decrypted-salt'
      const hash = 'test-hash'

      vi.spyOn(CryptoService.instance, 'decryptText').mockReturnValue(
        decryptedSalt,
      )
      vi.spyOn(CryptoService.instance, 'passToHash').mockReturnValue({
        salt: decryptedSalt,
        hash,
      })
      vi.spyOn(CryptoService.instance, 'encryptText').mockReturnValue(
        'encrypted-hash',
      )

      const result = CryptoService.cryptoProvider.encryptPasswordHash(
        password,
        encryptedSalt,
      )

      expect(CryptoService.instance.decryptText).toHaveBeenCalledWith(
        encryptedSalt,
      )
      expect(CryptoService.instance.passToHash).toHaveBeenCalledWith({
        password,
        salt: decryptedSalt,
      })
      expect(CryptoService.instance.encryptText).toHaveBeenCalledWith(hash)
      expect(result).toBe('encrypted-hash')
    })
  })
})
