import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Block {
  id: string;
  time?: string;
  type: string;
  colorClass?: string;
  content: string;
}

interface TunniKavaState {
  schoolStage: string;
  subject: string;
  topic: string;
  duration: number;
  goals: string;
  needs: string;
  draftContent: string;
  blocks: Block[];
  setLessonDetails: (details: {
    schoolStage?: string;
    subject?: string;
    topic?: string;
    duration?: number;
    goals?: string;
    needs?: string;
  }) => void;
  setDraftContent: (html: string) => void;
  setBlocks: (blocks: Block[]) => void;
  updateBlockContent: (id: string, content: string) => void;
  updateBlockType: (id: string, type: string) => void;
  initializeBlocks: () => void;
  resetBlocks: () => void;
}

export const useStore = create<TunniKavaState>()(
  persist(
    (set, get) => ({
      schoolStage: '',
      subject: '',
      topic: '',
      duration: 45,
      goals: '',
      needs: '',
      draftContent: '',
      blocks: [],
      setLessonDetails: (details) =>
        set((state) => ({ ...state, ...details })),
      setDraftContent: (draftContent) => set({ draftContent }),
      setBlocks: (blocks) => set({ blocks }),
      updateBlockContent: (id, content) =>
        set({
          blocks: get().blocks.map((b) =>
            b.id === id ? { ...b, content } : b
          ),
        }),
      updateBlockType: (id, type) =>
        set({
          blocks: get().blocks.map((b) =>
            b.id === id ? { ...b, type } : b
          ),
        }),
      initializeBlocks: () => {
        if (get().blocks.length > 0) return;
        
        // Vormistame faili nullist tühjade blocks'idega
        const emptyBlocks: Block[] = [];
        let currentMinute = 0;
        while (currentMinute < 45) {
          emptyBlocks.push({
            id: `init-${get().duration}-${currentMinute}`,
            time: `${currentMinute}-${currentMinute + 5} min`,
            type: "Indiv. töö",
            colorClass: "bg-green-300",
            content: "Iseseisev töö / Varu"
          });
          currentMinute += 5;
        }
        set({ blocks: emptyBlocks });
      },
      resetBlocks: () => {
        // Vormistame faili nullist tühjade blocks'idega sunnitult (manuaalseks sisestuseks)
        const emptyBlocks: Block[] = [];
        let currentMinute = 0;
        const totalDuration = get().duration || 45;
        while (currentMinute < totalDuration) {
          emptyBlocks.push({
            id: `manual-${currentMinute}`,
            time: `${currentMinute}-${currentMinute + 5} min`,
            type: "Indiv. töö",
            colorClass: "bg-green-300",
            content: "Sisesta tegevus siia"
          });
          currentMinute += 5;
        }
        set({ blocks: emptyBlocks });
      },
    }),
    {
      name: 'tunnikava-storage',
    }
  )
);
