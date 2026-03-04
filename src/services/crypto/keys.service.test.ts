/* eslint-disable @typescript-eslint/no-explicit-any */
import { aes } from '@internxt/lib'
import type { DecryptMessageResult, WebStream } from 'openpgp'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { KeysService } from './keys.service'
import {
  BadEncodedPrivateKeyError,
  CorruptedEncryptedPrivateKeyError,
  KeysDoNotMatchError,
  WrongIterationsToEncryptPrivateKeyError,
} from './errors/keys.errors'
import * as pgpService from './pgp.service'

const MOCK_AES_INIT = { iv: 'test-iv', salt: 'test-salt' }
const MOCK_PASSWORD = 'test-password'

vi.mock('@internxt/lib', () => ({
  aes: {
    encrypt: vi.fn((data: string) => `encrypted-${data}`),
    decrypt: vi.fn((data: string, _password: string, iterations?: number) => {
      if (iterations === 9999) {
        throw new Error('Wrong iterations')
      }
      if (data.startsWith('corrupted')) {
        throw new Error('Decryption failed')
      }
      if (data.startsWith('encrypted-')) {
        return data.replace('encrypted-', '')
      }
      return data
    }),
  },
}))

vi.mock('./pgp.service', () => ({
  generateNewKeys: vi.fn().mockResolvedValue({
    privateKeyArmored: 'pgp-private-key',
    publicKeyArmored: 'pgp-public-key',
    revocationCertificate: 'revocation-cert',
    publicKyberKeyBase64: 'kyber-public-key',
    privateKyberKeyBase64: 'kyber-private-key',
  }),
  getOpenpgp: vi.fn().mockResolvedValue({
    readKey: vi.fn().mockResolvedValue('mocked-public-key-object'),
    readPrivateKey: vi.fn().mockResolvedValue('mocked-private-key-object'),
    createMessage: vi.fn().mockResolvedValue('mocked-message-object'),
    readMessage: vi.fn().mockResolvedValue('mocked-encrypted-message'),
    encrypt: vi.fn().mockResolvedValue('mocked-encrypted-data'),
    decrypt: vi.fn().mockResolvedValue({
      data: 'validate-keys',
    }),
  }),
}))

vi.mock('openpgp', () => ({
  readKey: vi.fn().mockImplementation(async ({ armoredKey }) => {
    if (armoredKey === 'invalid-format-key') {
      throw new Error('Invalid key')
    }
    return { isValid: true }
  }),
}))

vi.mock('../config', () => ({
  ConfigService: {
    instance: {
      getVariable: vi.fn((key: string) => {
        if (key === 'MAGIC_IV') return MOCK_AES_INIT.iv
        if (key === 'MAGIC_SALT') return MOCK_AES_INIT.salt
        return ''
      }),
    },
  },
}))

describe('Keys Service', () => {
  let keysService: KeysService

  beforeEach(() => {
    vi.clearAllMocks()
    keysService = new KeysService()
  })

  describe('Get keys', () => {
    test('When generating keys, then it returns encrypted ECC and Kyber keys', async () => {
      const result = await keysService.getKeys(MOCK_PASSWORD)

      expect(pgpService.generateNewKeys).toHaveBeenCalled()
      expect(aes.encrypt).toHaveBeenCalledWith(
        'pgp-private-key',
        MOCK_PASSWORD,
        MOCK_AES_INIT,
      )
      expect(aes.encrypt).toHaveBeenCalledWith(
        'kyber-private-key',
        MOCK_PASSWORD,
        MOCK_AES_INIT,
      )

      expect(result).toEqual({
        privateKeyEncrypted: 'encrypted-pgp-private-key',
        publicKey: 'pgp-public-key',
        revocationCertificate: 'revocation-cert',
        ecc: {
          privateKeyEncrypted: 'encrypted-pgp-private-key',
          publicKey: 'pgp-public-key',
        },
        kyber: {
          publicKey: 'kyber-public-key',
          privateKeyEncrypted: 'encrypted-kyber-private-key',
        },
      })
    })
  })

  describe('Parse and decrypt keys', () => {
    test('When user has both ECC and Kyber keys, then it decrypts and returns both', () => {
      vi.spyOn(keysService, 'decryptPrivateKey')
        .mockReturnValueOnce('decrypted-ecc-key')
        .mockReturnValueOnce('decrypted-kyber-key')

      const mockUserSettings = {
        privateKey: 'encrypted-ecc-private-key',
        publicKey: 'legacy-public-key',
        keys: {
          ecc: {
            publicKey: 'ecc-public-key',
            privateKey: 'encrypted-ecc-private-key',
          },
          kyber: {
            publicKey: 'kyber-public-key',
            privateKey: 'encrypted-kyber-private-key',
          },
        },
      } as any

      const result = keysService.parseAndDecryptUserKeys(
        mockUserSettings,
        MOCK_PASSWORD,
      )

      expect(result).toEqual({
        publicKey: 'ecc-public-key',
        privateKey: Buffer.from('decrypted-ecc-key').toString('base64'),
        publicKyberKey: 'kyber-public-key',
        privateKyberKey: 'decrypted-kyber-key',
      })
    })

    test('When user has only ECC keys, then it returns empty Kyber keys', () => {
      vi.spyOn(keysService, 'decryptPrivateKey').mockReturnValueOnce(
        'decrypted-ecc-key',
      )

      const mockUserSettings = {
        privateKey: 'encrypted-private-key',
        publicKey: 'public-key',
        keys: {
          ecc: {
            publicKey: 'ecc-public-key',
            privateKey: 'encrypted-ecc-private-key',
          },
        },
      } as any

      const result = keysService.parseAndDecryptUserKeys(
        mockUserSettings,
        MOCK_PASSWORD,
      )

      expect(result).toEqual({
        publicKey: 'ecc-public-key',
        privateKey: Buffer.from('decrypted-ecc-key').toString('base64'),
        publicKyberKey: '',
        privateKyberKey: '',
      })
    })

    test('When user has only legacy keys format, then it parses them correctly', () => {
      vi.spyOn(keysService, 'decryptPrivateKey').mockReturnValueOnce(
        'decrypted-private-key',
      )

      const mockUserSettings = {
        privateKey: 'encrypted-private-key',
        publicKey: 'legacy-public-key',
      } as any

      const result = keysService.parseAndDecryptUserKeys(
        mockUserSettings,
        MOCK_PASSWORD,
      )

      expect(result).toEqual({
        publicKey: 'legacy-public-key',
        privateKey: Buffer.from('decrypted-private-key').toString('base64'),
        publicKyberKey: '',
        privateKyberKey: '',
      })
    })

    test('When user has no private key, then it returns empty private key', () => {
      const mockUserSettings = {
        privateKey: '',
        publicKey: 'public-key',
      } as any

      const result = keysService.parseAndDecryptUserKeys(
        mockUserSettings,
        MOCK_PASSWORD,
      )

      expect(result.privateKey).toBe('')
    })
  })

  describe('Decrypt private key', () => {
    test('When key is shorter than minimum length, then it returns empty string', () => {
      const shortKey = 'x'.repeat(keysService.MINIMAL_ENCRYPTED_KEY_LEN)

      const result = keysService.decryptPrivateKey(shortKey, MOCK_PASSWORD)

      expect(result).toBe('')
      expect(aes.decrypt).not.toHaveBeenCalled()
    })

    test('When decrypting a valid encrypted key, then it returns the decrypted value', () => {
      const validKey = 'encrypted-valid-key'.padEnd(150, 'x')

      const result = keysService.decryptPrivateKey(validKey, MOCK_PASSWORD)

      expect(aes.decrypt).toHaveBeenCalledWith(validKey, MOCK_PASSWORD)
      expect(result).toBe(
        'valid-key' + 'x'.repeat(150 - 'encrypted-valid-key'.length),
      )
    })

    test('When decryption fails, then an error indicating so is thrown', () => {
      const corruptedKey = 'corrupted-key'.padEnd(150, 'x')

      expect(() =>
        keysService.decryptPrivateKey(corruptedKey, MOCK_PASSWORD),
      ).toThrow(CorruptedEncryptedPrivateKeyError)
    })
  })

  describe('Check if the private key is valid', () => {
    test('When key was encrypted with wrong iterations, then an error indicating so is thrown', async () => {
      vi.mocked(aes.decrypt).mockImplementationOnce(() => 'should-not-work')

      await expect(
        keysService.assertPrivateKeyIsValid('some-key', MOCK_PASSWORD),
      ).rejects.toThrow(WrongIterationsToEncryptPrivateKeyError)

      expect(aes.decrypt).toHaveBeenCalledWith('some-key', MOCK_PASSWORD, 9999)
    })

    test('When decryption fails, then an error indicating so is thrown', async () => {
      vi.mocked(aes.decrypt).mockImplementationOnce(
        (_data, _password, iterations) => {
          if (iterations === 9999) throw new Error('Expected error')
          return 'should-not-reach'
        },
      )

      vi.spyOn(keysService, 'decryptPrivateKey').mockImplementationOnce(() => {
        throw new CorruptedEncryptedPrivateKeyError()
      })

      await expect(
        keysService.assertPrivateKeyIsValid('corrupted-key', MOCK_PASSWORD),
      ).rejects.toThrow(CorruptedEncryptedPrivateKeyError)
    })

    test('When decrypted key has invalid format, then an error indicating so is thrown', async () => {
      vi.mocked(aes.decrypt).mockImplementationOnce(
        (_data, _password, iterations) => {
          if (iterations === 9999) throw new Error('Expected error')
          return 'invalid-format-key'
        },
      )

      vi.spyOn(keysService, 'isValidKey').mockResolvedValueOnce(false)

      await expect(
        keysService.assertPrivateKeyIsValid(
          'encrypted-invalid-format',
          MOCK_PASSWORD,
        ),
      ).rejects.toThrow(BadEncodedPrivateKeyError)
    })
  })

  describe('Validating keys', () => {
    test('When decrypted message does not match the original, then an error indicating so is thrown', async () => {
      const mockOpenpgp = await pgpService.getOpenpgp()
      vi.mocked(mockOpenpgp.decrypt).mockResolvedValueOnce({
        data: 'wrong-message',
      } as unknown as DecryptMessageResult & { data: WebStream<string> })

      await expect(
        keysService.assertValidateKeys('private-key', 'public-key'),
      ).rejects.toThrow(KeysDoNotMatchError)
    })
  })
})
