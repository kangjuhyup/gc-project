import { describe, expect, it } from 'vitest';
import { Aes256StringEncryptor } from '@infrastructure/crypto';

describe('Aes256StringEncryptor', () => {
  it('문자열을 AES-256으로 암호화하고 다시 복호화한다', () => {
    const encryptor = new Aes256StringEncryptor('test-phone-number-encryption-key');

    const encrypted = encryptor.encrypt('01012345678');

    expect(encrypted).not.toBe('01012345678');
    expect(encrypted).toMatch(/^aes256-cbc:v1:/);
    expect(encryptor.decrypt(encrypted)).toBe('01012345678');
  });

  it('같은 값은 같은 암호문으로 변환해 유니크 제약과 동등 조회에 사용할 수 있다', () => {
    const encryptor = new Aes256StringEncryptor('test-phone-number-encryption-key');

    expect(encryptor.encrypt('01012345678')).toBe(encryptor.encrypt('01012345678'));
    expect(encryptor.encrypt('01012345678')).not.toBe(encryptor.encrypt('01087654321'));
  });

  it('이미 암호화된 값이나 기존 평문 값은 안전하게 처리한다', () => {
    const encryptor = new Aes256StringEncryptor('test-phone-number-encryption-key');
    const encrypted = encryptor.encrypt('01012345678');

    expect(encryptor.encrypt(encrypted)).toBe(encrypted);
    expect(encryptor.decrypt('01012345678')).toBe('01012345678');
  });
});
