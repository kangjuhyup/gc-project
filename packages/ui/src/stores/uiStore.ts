import { create } from 'zustand';

interface UiState {
  selectedSection: string;
  setSelectedSection: (section: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedSection: '영화 탐색',
  setSelectedSection: (selectedSection) => set({ selectedSection }),
}));
