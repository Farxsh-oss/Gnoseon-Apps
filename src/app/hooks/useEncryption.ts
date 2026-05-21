import { useState, useEffect } from 'react';
import { handleEncryptionError } from '../../utils/errorHandler';

export interface EncryptionKey {
  id: string;
  publicKey: string;
  privateKey: string;
}

export interface EncryptedMessage {
  encryptedData: string;
  iv: string;
  algorithm: string;
}

// Web Crypto API implementation for proper encryption
class CryptoService {
  private static instance: CryptoService;
  
  private constructor() {}
  
  static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }
  
  // Generate RSA-OAEP key pair for asymmetric encryption
  async generateRSAKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      
      const publicKey = this.arrayBufferToBase64(publicKeyBuffer);
      const privateKey = this.arrayBufferToBase64(privateKeyBuffer);
      
      return { publicKey, privateKey };
    } catch (error) {
      handleEncryptionError('Failed to generate RSA key pair', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Key generation failed');
    }
  }
  
  // Generate AES-GCM key for symmetric encryption
  async generateAESKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
  
  // Encrypt message with AES-GCM (symmetric)
  async encryptMessageAES(message: string, key: CryptoKey): Promise<EncryptedMessage> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        data
      );
      
      return {
        encryptedData: this.arrayBufferToBase64(encryptedData),
        iv: this.arrayBufferToBase64(iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength)),
        algorithm: 'AES-GCM-256',
      };
    } catch (error) {
      handleEncryptionError('AES encryption failed', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Message encryption failed');
    }
  }
  
  // Decrypt message with AES-GCM
  async decryptMessageAES(encryptedMessage: EncryptedMessage, key: CryptoKey): Promise<string> {
    try {
      const encryptedData = this.base64ToArrayBuffer(encryptedMessage.encryptedData);
      const iv = this.base64ToArrayBuffer(encryptedMessage.iv);
      
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encryptedData
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      handleEncryptionError('AES decryption failed', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Message decryption failed');
    }
  }
  
  // Encrypt AES key with RSA public key (for key exchange)
  async encryptKeyWithRSA(aesKey: CryptoKey, publicKeyBase64: string): Promise<string> {
    try {
      const publicKeyBuffer = this.base64ToArrayBuffer(publicKeyBase64);
      const publicKey = await window.crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['encrypt']
      );
      
      const aesKeyBuffer = await window.crypto.subtle.exportKey('raw', aesKey);
      const encryptedKey = await window.crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
        },
        publicKey,
        aesKeyBuffer
      );
      
      return this.arrayBufferToBase64(encryptedKey);
    } catch (error) {
      handleEncryptionError('RSA key encryption failed', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Key encryption failed');
    }
  }
  
  // Decrypt AES key with RSA private key
  async decryptKeyWithRSA(encryptedKeyBase64: string, privateKeyBase64: string): Promise<CryptoKey> {
    try {
      const privateKeyBuffer = this.base64ToArrayBuffer(privateKeyBase64);
      const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['decrypt']
      );
      
      const encryptedKey = this.base64ToArrayBuffer(encryptedKeyBase64);
      const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP',
        },
        privateKey,
        encryptedKey
      );
      
      return await window.crypto.subtle.importKey(
        'raw',
        decryptedKeyBuffer,
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      handleEncryptionError('RSA key decryption failed', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Key decryption failed');
    }
  }
  
  // Generate cryptographic random key ID
  generateKeyId(): string {
    const array = new Uint32Array(2);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(36)).join('');
  }
  
  // Utility: ArrayBuffer to Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  // Utility: Base64 to ArrayBuffer
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const useEncryption = () => {
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [encryptionKeys, setEncryptionKeys] = useState<Map<string, EncryptionKey>>(new Map());
  const cryptoService = CryptoService.getInstance();

  // Generate RSA key pair for user using Web Crypto API
  const generateKeyPair = async (): Promise<EncryptionKey> => {
    try {
      const keyId = cryptoService.generateKeyId();
      const { publicKey, privateKey } = await cryptoService.generateRSAKeyPair();
      
      return { id: keyId, publicKey, privateKey };
    } catch (error) {
      handleEncryptionError('Failed to generate key pair', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  // Encrypt message using hybrid encryption (RSA + AES)
  const encryptMessage = async (message: string, recipientPublicKey?: string): Promise<string> => {
    if (!encryptionEnabled || !recipientPublicKey) {
      return message;
    }

    try {
      // Generate ephemeral AES key for this message
      const aesKey = await cryptoService.generateAESKey();
      
      // Encrypt the message with AES
      const encryptedMessage = await cryptoService.encryptMessageAES(message, aesKey);
      
      // Encrypt the AES key with recipient's RSA public key
      const encryptedKey = await cryptoService.encryptKeyWithRSA(aesKey, recipientPublicKey);
      
      // Combine encrypted key and encrypted message
      const combined = {
        key: encryptedKey,
        message: encryptedMessage,
      };
      
      return btoa(JSON.stringify(combined));
    } catch (error) {
      handleEncryptionError('Message encryption failed', error instanceof Error ? error : new Error(String(error)));
      return message;
    }
  };

  // Decrypt message using hybrid encryption
  const decryptMessage = async (encryptedMessage: string, privateKey: string): Promise<string> => {
    if (!encryptionEnabled) {
      return encryptedMessage;
    }

    try {
      const combined = JSON.parse(atob(encryptedMessage));
      const encryptedKey = combined.key;
      const encryptedMsg = combined.message;
      
      // Decrypt the AES key with our RSA private key
      const aesKey = await cryptoService.decryptKeyWithRSA(encryptedKey, privateKey);
      
      // Decrypt the message with AES
      return await cryptoService.decryptMessageAES(encryptedMsg, aesKey);
    } catch (error) {
      handleEncryptionError('Message decryption failed', error instanceof Error ? error : new Error(String(error)));
      return encryptedMessage;
    }
  };

  // Toggle encryption
  const toggleEncryption = () => {
    setEncryptionEnabled(!encryptionEnabled);
  };

  // Store encryption key for user (with encrypted storage)
  const storeUserKey = async (userId: string, key: EncryptionKey) => {
    const newKeys = new Map(encryptionKeys);
    newKeys.set(userId, key);
    setEncryptionKeys(newKeys);
    
    // Encrypt keys before storing in localStorage
    try {
      const keysObj = Object.fromEntries(newKeys);
      const keysString = JSON.stringify(keysObj);
      
      // Use a simple encryption for localStorage (in production, use proper key derivation)
      const encoder = new TextEncoder();
      const data = encoder.encode(keysString);
      const hash = await window.crypto.subtle.digest('SHA-256', encoder.encode('gnoseon-key-encryption'));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        hash.slice(0, 32),
        'AES-GCM',
        false,
        ['encrypt']
      );
      
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        data
      );
      
      const combined = {
        data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        iv: btoa(String.fromCharCode(...iv)),
      };
      
      localStorage.setItem('encryptionKeys', JSON.stringify(combined));
    } catch (error) {
      handleEncryptionError('Failed to encrypt keys for storage', error instanceof Error ? error : new Error(String(error)));
      // Fallback to unencrypted storage if encryption fails
      const keysObj = Object.fromEntries(newKeys);
      localStorage.setItem('encryptionKeys', JSON.stringify(keysObj));
    }
  };

  // Get encryption key for user
  const getUserKey = (userId: string): EncryptionKey | undefined => {
    return encryptionKeys.get(userId);
  };

  // Load keys from localStorage on mount
  useEffect(() => {
    const loadKeys = async () => {
      const storedKeys = localStorage.getItem('encryptionKeys');
      if (storedKeys) {
        try {
          const parsed = JSON.parse(storedKeys);
          
          // Try to decrypt if it's encrypted format
          if (parsed.data && parsed.iv) {
            const encryptedData = Uint8Array.from(atob(parsed.data), (c) => c.charCodeAt(0));
            const iv = Uint8Array.from(atob(parsed.iv), (c) => c.charCodeAt(0));
            
            const encoder = new TextEncoder();
            const hash = await window.crypto.subtle.digest('SHA-256', encoder.encode('gnoseon-key-encryption'));
            
            const cryptoKey = await window.crypto.subtle.importKey(
              'raw',
              hash.slice(0, 32),
              'AES-GCM',
              false,
              ['decrypt']
            );
            
            const decrypted = await window.crypto.subtle.decrypt(
              { name: 'AES-GCM', iv },
              cryptoKey,
              encryptedData
            );
            
            const decoder = new TextDecoder();
            const keysString = decoder.decode(decrypted);
            const keysObj = JSON.parse(keysString);
            const keysMap = new Map(Object.entries(keysObj)) as Map<string, EncryptionKey>;
            setEncryptionKeys(keysMap);
          } else {
            // Legacy unencrypted format
            const keysMap = new Map(Object.entries(parsed)) as Map<string, EncryptionKey>;
            setEncryptionKeys(keysMap);
          }
        } catch (error) {
          handleEncryptionError('Failed to load encryption keys', error instanceof Error ? error : new Error(String(error)));
        }
      }

      // Check if encryption was previously enabled
      const encryptionSetting = localStorage.getItem('encryptionEnabled');
      if (encryptionSetting === 'true') {
        setEncryptionEnabled(true);
      }
    };
    
    loadKeys();
  }, []);

  // Save encryption setting to localStorage
  useEffect(() => {
    localStorage.setItem('encryptionEnabled', encryptionEnabled.toString());
  }, [encryptionEnabled]);

  return {
    encryptionEnabled,
    generateKeyPair,
    encryptMessage,
    decryptMessage,
    toggleEncryption,
    storeUserKey,
    getUserKey
  };
};
