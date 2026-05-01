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

  it('관리자는 상영 일정이 없는 영화도 목록에서 조회할 수 있다', async () => {
    const accessToken = await loginAdmin(e2e);
    const auth = { Authorization: `Bearer ${accessToken}` };
    const created = await e2e.post('/admin/movies', {
      title: '목록 조회용 관리자 영화',
      runningTime: 110,
      director: '목록 감독',
      genre: '스릴러',
      rating: '12',
      releaseDate: '2026-05-02',
    }, auth);
    expect(created.status).toBe(201);

    const list = await e2e.get(
      '/admin/movies?keyword=%EB%AA%A9%EB%A1%9D&currentPage=1&countPerPage=5',
      auth,
    );

    expect(list.status).toBe(200);
    expect(list.body.currentPage).toBe(1);
    expect(list.body.countPerPage).toBe(5);
    expect(list.body.totalCount).toBeGreaterThanOrEqual(1);
    expect(list.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.body.movieId,
          title: '목록 조회용 관리자 영화',
          runningTime: 110,
          director: '목록 감독',
          genre: '스릴러',
          rating: '12',
          releaseDate: '2026-05-02',
        }),
      ]),
    );
  });

  it('관리자 access token이 없으면 영화 목록을 조회할 수 없다', async () => {
    const list = await e2e.get('/admin/movies');

    expect(list.status).toBe(401);
    expect(list.body.message).toBe('AUTHORIZATION_REQUIRED');
  });
});
