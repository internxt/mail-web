import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { LocalStorageService } from '.'
import type { UserSettings } from '@internxt/sdk/dist/shared/types/userSettings'
import type { UserSubscription } from '@internxt/sdk/dist/drive/payments/types/types'

const localStorageService = LocalStorageService.instance

describe('Local Storage Service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('User persistence', () => {
    test('When storing user data, then it should persist across service calls', () => {
      const user = { name: 'John Doe' }
      localStorageService.setUser(user as UserSettings)
      const savedUser = localStorageService.getUser()
      expect(savedUser).toStrictEqual(user)
    })

    test('When no user is stored, then should return null', () => {
      expect(localStorageService.getUser()).toBeNull()
    })
  })

  describe('Token management', () => {
    test('When storing a token, then it should be retrievable', () => {
      const token = 'token'
      localStorageService.setToken(token)
      const savedToken = localStorageService.getToken()
      expect(savedToken).toBe(token)
    })

    test('When no token is stored, then should return null', () => {
      expect(localStorageService.getToken()).toBeNull()
    })
  })

  describe('Mnemonic storage', () => {
    test('When storing a mnemonic phrase, then it should be retrievable', () => {
      const mnemonic = 'mnemonic'
      localStorageService.setMnemonic(mnemonic)
      const savedMnemonic = localStorageService.getMnemonic()
      expect(savedMnemonic).toBe(mnemonic)
    })

    test('When no mnemonic is stored, then should return null', () => {
      expect(localStorageService.getMnemonic()).toBeNull()
    })
  })

  describe('Subscription data', () => {
    test('When storing subscription info, then it should persist the data', () => {
      const subscription = { plan: 'plan', status: 'status' }
      localStorageService.setSubscription(
        subscription as unknown as UserSubscription,
      )
      const savedSubscription = localStorageService.getSubscription()
      expect(savedSubscription).toStrictEqual(subscription)
    })

    test('When no subscription is stored, then should return null', () => {
      expect(localStorageService.getSubscription()).toBeNull()
    })
  })

  describe('Batch credential operations', () => {
    test('When saving all credentials at once, then all should be stored correctly', () => {
      const user = { name: 'John Doe' }
      const mnemonic = 'mnemonic'
      const token = 'token'
      localStorageService.saveCredentials(user as UserSettings, mnemonic, token)
      const savedUser = localStorageService.getUser()
      const savedMnemonic = localStorageService.getMnemonic()
      const savedToken = localStorageService.getToken()
      expect(savedUser).toStrictEqual(user)
      expect(savedMnemonic).toBe(mnemonic)
      expect(savedToken).toBe(token)
    })
  })

  describe('Credential cleanup', () => {
    test('When clearing credentials, then all sensitive data should be removed', () => {
      const user = { name: 'John Doe' }
      const mnemonic = 'mnemonic'
      const token = 'token'
      localStorageService.saveCredentials(user as UserSettings, mnemonic, token)
      localStorageService.clearCredentials()
      const savedUser = localStorageService.getUser()
      const savedMnemonic = localStorageService.getMnemonic()
      const savedToken = localStorageService.getToken()
      expect(savedUser).toBeNull()
      expect(savedMnemonic).toBeNull()
      expect(savedToken).toBeNull()
    })
  })
})
