import { describe, expect, it } from 'vitest';
import { buildCorsOptions } from '@infrastructure/config/cors.config';

describe('buildCorsOptions', () => {
  it('development 모드에서는 UI 개발 서버 origin만 CORS로 허용한다', () => {
    expect(buildCorsOptions('development')).toEqual({
      origin: 'http://localhost:5173',
    });
  });

  it('development 모드가 아니면 CORS 옵션을 반환하지 않는다', () => {
    expect(buildCorsOptions('production')).toBeUndefined();
    expect(buildCorsOptions('test')).toBeUndefined();
    expect(buildCorsOptions(undefined)).toBeUndefined();
  });
});
