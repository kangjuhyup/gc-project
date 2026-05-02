import { describe, expect, it } from 'vitest';
import { Aes256StringEncryptor } from '@infrastructure/crypto';
import { MemberEntity } from '../../../src/infrastructure/persistence/entities';
import { EntityEncryptionService } from '../../../src/infrastructure/persistence/encryption';

describe('EntityEncryptionService', () => {
  it('EncryptedProperty 데코레이터가 붙은 필드만 암호화하고 복호화한다', () => {
    const service = new EntityEncryptionService(
      new Aes256StringEncryptor('test-phone-number-encryption-key'),
    );
    const entity = new MemberEntity();
    entity.userId = 'member_01';
    entity.phoneNumber = '01012345678';

    const encrypted = service.encryptEntity(entity);

    expect(encrypted.userId).toBe('member_01');
    expect(encrypted.phoneNumber).not.toBe('01012345678');
    expect(service.decryptEntity(encrypted).phoneNumber).toBe('01012345678');
  });
});
