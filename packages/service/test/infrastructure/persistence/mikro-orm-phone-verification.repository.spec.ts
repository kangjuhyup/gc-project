import { describe, expect, it, vi } from 'vitest';
import { PhoneVerificationModel } from '@domain';
import { PhoneVerificationEntity } from '../../../src/infrastructure/persistence/entities';
import { EntityEncryptionService } from '../../../src/infrastructure/persistence/encryption';
import { MikroOrmPhoneVerificationRepository } from '../../../src/infrastructure/persistence/repositories';

function encryption() {
  return {
    encryptEntity: vi.fn((entity: PhoneVerificationEntity) => {
      entity.phoneNumber = `encrypted:${entity.phoneNumber}`;
      return entity;
    }),
    decryptEntity: vi.fn((entity: PhoneVerificationEntity) => {
      entity.phoneNumber = entity.phoneNumber.replace(/^encrypted:/, '');
      return entity;
    }),
    encryptedValueCandidates: vi.fn((value: string) => [`encrypted:${value}`, value]),
  } as unknown as EntityEncryptionService;
}

describe('MikroOrmPhoneVerificationRepository', () => {
  it('휴대전화 인증번호를 저장할 때 휴대전화번호는 암호화해서 DB에 전달하고 반환 모델은 복호화한다', async () => {
    const entityManager = {
      insert: vi.fn().mockResolvedValue('1'),
    };
    const repository = new MikroOrmPhoneVerificationRepository(
      entityManager as never,
      encryption(),
    );
    const verification = PhoneVerificationModel.issue({
      phoneNumber: '01000000000',
      code: '123456',
      expiresAt: new Date('2026-04-28T00:05:00.000Z'),
    });

    const saved = await repository.save(verification);

    expect(entityManager.insert).toHaveBeenCalledWith(
      PhoneVerificationEntity,
      expect.objectContaining({ phoneNumber: 'encrypted:01000000000' }),
    );
    expect(saved.phoneNumber).toBe('01000000000');
  });

  it('인증된 휴대전화번호 조회는 암호문과 기존 평문 값을 함께 후보로 사용한다', async () => {
    const entityManager = {
      findOne: vi.fn().mockResolvedValue(null),
    };
    const repository = new MikroOrmPhoneVerificationRepository(
      entityManager as never,
      encryption(),
    );

    const found = await repository.findVerifiedByPhoneNumber('01000000000');

    expect(found).toBeUndefined();
    expect(entityManager.findOne).toHaveBeenCalledWith(PhoneVerificationEntity, {
      phoneNumber: { $in: ['encrypted:01000000000', '01000000000'] },
      status: 'VERIFIED',
    });
  });
});
