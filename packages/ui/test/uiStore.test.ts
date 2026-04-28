import { describe, expect, it } from 'vitest';
import { useUiStore } from '@/stores/uiStore';

describe('useUiStore', () => {
  it('선택한 섹션 상태를 변경한다', () => {
    useUiStore.setState({ selectedSection: '영화 탐색' });

    useUiStore.getState().setSelectedSection('좌석 선택');

    expect(useUiStore.getState().selectedSection).toBe('좌석 선택');
  });
});
