import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  timingSafeEqual,
} from 'node:crypto';

const PREFIX = 'aes256-cbc:v1';

export class Aes256StringEncryptor {
  private readonly encryptionKey: Buffer;
  private readonly macKey: Buffer;

  constructor(secret: string) {
    this.encryptionKey = createHash('sha256').update(`enc:${secret}`).digest();
    this.macKey = createHash('sha256').update(`mac:${secret}`).digest();
  }

  encrypt(value: string): string {
    if (this.isEncrypted(value)) {
      return value;
    }

    const iv = this.ivFor(value);
    const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const mac = this.mac(iv, encrypted);

    return [
      PREFIX,
      iv.toString('base64url'),
      encrypted.toString('base64url'),
      mac.toString('base64url'),
    ].join(':');
  }

  decrypt(value: string): string {
    if (!this.isEncrypted(value)) {
      return value;
    }

    const [, , ivText, encryptedText, macText] = value.split(':');
    const iv = Buffer.from(ivText, 'base64url');
    const encrypted = Buffer.from(encryptedText, 'base64url');
    const expectedMac = this.mac(iv, encrypted);
    const actualMac = Buffer.from(macText, 'base64url');

    if (actualMac.length !== expectedMac.length || !timingSafeEqual(actualMac, expectedMac)) {
      throw new Error('ENCRYPTED_VALUE_TAMPERED');
    }

    const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  isEncrypted(value: string): boolean {
    return value.startsWith(`${PREFIX}:`);
  }

  private ivFor(value: string): Buffer {
    return createHmac('sha256', this.macKey).update(`iv:${value}`).digest().subarray(0, 16);
  }

  private mac(iv: Buffer, encrypted: Buffer): Buffer {
    return createHmac('sha256', this.macKey)
      .update(iv)
      .update(encrypted)
      .digest();
  }
}
