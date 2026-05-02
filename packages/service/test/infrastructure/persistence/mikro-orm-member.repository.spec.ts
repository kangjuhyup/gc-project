import { describe, expect, it, vi } from 'vitest';
import { MemberStatus } from '@domain';
import { MemberEntity } from '../../../src/infrastructure/persistence/entities';
import { EntityEncryptionService } from '../../../src/infrastructure/persistence/encryption';
import { MikroOrmMemberRepository } from '../../../src/infrastructure/persistence/repositories';

function memberEntity(params: { id: string; userId: string; status: string }): MemberEntity {
  const entity = new MemberEntity();
  entity.id = params.id;
  entity.userId = params.userId;
  entity.passwordHash = 'hashed-password';
  entity.name = 'Member';
  entity.birthDate = new Date('1990-01-01T00:00:00.000Z');
  entity.phoneNumber = `0100000000${params.id}`;
  entity.address = 'Seoul';
  entity.status = params.status;
  entity.failedLoginCount = 0;
  entity.createdAt = new Date('2026-04-28T00:00:00.000Z');
  entity.updatedAt = new Date('2026-04-28T00:00:00.000Z');

  return entity;
}

function encryption() {
  return {
    encryptEntity: vi.fn((entity: MemberEntity) => {
      entity.phoneNumber = `encrypted:${entity.phoneNumber}`;
      return entity;
    }),
    decryptEntity: vi.fn((entity: MemberEntity) => {
      entity.phoneNumber = entity.phoneNumber.replace(/^encrypted:/, '');
      return entity;
    }),
    encryptedValueCandidates: vi.fn((value: string) => [`encrypted:${value}`, value]),
  } as unknown as EntityEncryptionService;
}

describe('MikroOrmMemberRepository', () => {
  it('회원을 저장할 때 휴대전화번호는 암호화해서 DB에 전달하고 반환 모델은 복호화한다', async () => {
    const entityManager = {
      insert: vi.fn().mockResolvedValue('1'),
    };
    const repository = new MikroOrmMemberRepository(entityManager as never, encryption());

    const saved = await repository.save({
      id: undefined,
      userId: 'member_01',
      passwordHash: 'hashed-password',
      name: 'Member',
      birthDate: new Date('1990-01-01T00:00:00.000Z'),
      phoneNumber: '01000000000',
      address: 'Seoul',
      status: MemberStatus.ACTIVE,
      failedLoginCount: 0,
      lockedAt: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      setPersistence: vi.fn(),
      recordLoginFailure: vi.fn(),
      recordLoginSuccess: vi.fn(),
      changePassword: vi.fn(),
      withdraw: vi.fn(),
      assertCanLogin: vi.fn(),
    } as never);

    expect(entityManager.insert).toHaveBeenCalledWith(
      MemberEntity,
      expect.objectContaining({ phoneNumber: 'encrypted:01000000000' }),
    );
    expect(saved.phoneNumber).toBe('01000000000');
  });

  it('아이디 중복 여부는 탈퇴 회원을 제외하고 확인한다', async () => {
    const entityManager = {
      count: vi.fn().mockResolvedValue(0),
    };
    const repository = new MikroOrmMemberRepository(entityManager as never, encryption());

    const exists = await repository.existsByUserId('member_01');

    expect(exists).toBe(false);
    expect(entityManager.count).toHaveBeenCalledWith(MemberEntity, {
      userId: 'member_01',
      status: { $ne: MemberStatus.WITHDRAWN },
    });
  });

  it('휴대전화번호 중복 여부는 탈퇴 회원을 제외하고 확인한다', async () => {
    const entityManager = {
      findOne: vi.fn().mockResolvedValue(null),
    };
    const repository = new MikroOrmMemberRepository(entityManager as never, encryption());

    const member = await repository.findByPhoneNumber('01000000000');

    expect(member).toBeUndefined();
    expect(entityManager.findOne).toHaveBeenCalledWith(MemberEntity, {
      phoneNumber: { $in: ['encrypted:01000000000', '01000000000'] },
      status: { $ne: MemberStatus.WITHDRAWN },
    });
  });

  it('같은 아이디의 탈퇴 회원과 활성 회원이 있으면 활성 회원을 먼저 조회한다', async () => {
    const activeMember = memberEntity({
      id: '2',
      userId: 'member_01',
      status: MemberStatus.ACTIVE,
    });
    const entityManager = {
      findOne: vi.fn().mockResolvedValueOnce(activeMember),
    };
    const repository = new MikroOrmMemberRepository(entityManager as never, encryption());

    const member = await repository.findByUserId('member_01');

    expect(member?.id).toBe('2');
    expect(entityManager.findOne).toHaveBeenCalledOnce();
    expect(entityManager.findOne).toHaveBeenCalledWith(MemberEntity, {
      userId: 'member_01',
      status: { $ne: MemberStatus.WITHDRAWN },
    });
  });

  it('활성 회원이 없고 탈퇴 회원만 있으면 탈퇴 회원을 반환해 로그인 거부 사유를 유지한다', async () => {
    const withdrawnMember = memberEntity({
      id: '1',
      userId: 'member_01',
      status: MemberStatus.WITHDRAWN,
    });
    const entityManager = {
      findOne: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(withdrawnMember),
    };
    const repository = new MikroOrmMemberRepository(entityManager as never, encryption());

    const member = await repository.findByUserId('member_01');

    expect(member?.id).toBe('1');
    expect(member?.status).toBe(MemberStatus.WITHDRAWN);
    expect(entityManager.findOne).toHaveBeenNthCalledWith(1, MemberEntity, {
      userId: 'member_01',
      status: { $ne: MemberStatus.WITHDRAWN },
    });
    expect(entityManager.findOne).toHaveBeenNthCalledWith(2, MemberEntity, { userId: 'member_01' });
  });
});
