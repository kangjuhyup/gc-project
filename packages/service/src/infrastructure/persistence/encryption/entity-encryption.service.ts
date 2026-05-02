import { Inject, Injectable } from '@nestjs/common';
import { Aes256StringEncryptor, AES256_STRING_ENCRYPTOR } from '../../crypto';
import { getEncryptedProperties } from './encrypted-property.decorator';

@Injectable()
export class EntityEncryptionService {
  constructor(
    @Inject(AES256_STRING_ENCRYPTOR)
    private readonly encryptor: Aes256StringEncryptor,
  ) {}

  encryptEntity<T extends object>(entity: T): T {
    return this.transformEntity(entity, (value) => this.encryptor.encrypt(value));
  }

  decryptEntity<T extends object>(entity: T): T {
    return this.transformEntity(entity, (value) => this.encryptor.decrypt(value));
  }

  encryptValue(value: string): string {
    return this.encryptor.encrypt(value);
  }

  decryptValue(value: string): string {
    return this.encryptor.decrypt(value);
  }

  encryptedValueCandidates(value: string): string[] {
    const encrypted = this.encryptValue(value);
    return encrypted === value ? [value] : [encrypted, value];
  }

  private transformEntity<T extends object>(entity: T, transform: (value: string) => string): T {
    for (const property of getEncryptedProperties(entity)) {
      const value = (entity as Record<string, unknown>)[property];

      if (typeof value === 'string') {
        (entity as Record<string, unknown>)[property] = transform(value);
      }
    }

    return entity;
  }
}
