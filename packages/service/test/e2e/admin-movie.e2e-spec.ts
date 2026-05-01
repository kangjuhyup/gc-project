import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ServiceE2eContext } from './support/service-e2e';

async function loginAdmin(e2e: ServiceE2eContext): Promise<string> {
  const login = await e2e.post('/admin/login', {
    userId: 'admin',
    password: 'admin-password123!',
  });
  expect(login.status).toBe(201);
  return String(login.body.accessToken);
}

describe('관리자 영화 관리 e2e', () => {
  let e2e: ServiceE2eContext;

  beforeAll(async () => {
    e2e = await ServiceE2eContext.create();
  });

  beforeEach(async () => {
    await e2e.reset();
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it('관리자는 영화 기본 정보를 등록할 수 있다', async () => {
    const accessToken = await loginAdmin(e2e);

    const response = await e2e.post('/admin/movies', {
      title: '관리자 등록 영화',
      runningTime: 121,
      director: '관리자 감독',
      genre: '드라마',
      rating: '15',
      releaseDate: '2026-05-01',
      posterUrl: 'https://images.example.com/admin-movie.jpg',
      description: '관리자가 등록한 영화입니다.',
    }, {
      Authorization: `Bearer ${accessToken}`,
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      movieId: expect.any(String),
      title: '관리자 등록 영화',
      runningTime: 121,
      director: '관리자 감독',
      genre: '드라마',
      rating: '15',
      releaseDate: '2026-05-01',
      posterUrl: 'https://images.example.com/admin-movie.jpg',
      description: '관리자가 등록한 영화입니다.',
    });
    expect(await e2e.countRows('movie', 'title = ?', ['관리자 등록 영화'])).toBe(1);
  });

  it('관리자 access token이 없으면 영화 기본 정보를 등록할 수 없다', async () => {
    const response = await e2e.post('/admin/movies', {
      title: '인증 없는 등록',
      runningTime: 100,
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('AUTHORIZATION_REQUIRED');
  });
});
