'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useStore } from '@/store/useStore';
import { BlockItem } from './BlockItem';
import { useState, useEffect } from 'react';

interface TimelineProps {
  onBlockClick: (id: string) => void;
  selectedBlockId: string | null;
}

export function Timeline({ onBlockClick, selectedBlockId }: TimelineProps) {
  const { blocks, setBlocks } = useStore();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch for dnd-kit
  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      
      setBlocks(arrayMove(blocks, oldIndex, newIndex));
    }
  }

  if (!mounted) return <div className="h-[140px] bg-slate-100 rounded-xl w-full animate-pulse" />;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-slate-200">
      <div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map(b => b.id)}
            strategy={rectSortingStrategy}
          >
            <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto px-4 py-4 min-h-[220px]">
              {/* Esimene rida */}
              <div className="flex flex-wrap gap-3 justify-center">
                {blocks.slice(0, blocks.length > 9 ? Math.ceil(blocks.length / 2) : blocks.length).map((block, index) => (
                  <BlockItem 
                    key={block.id} 
                    block={block} 
                    index={index}
                    onClick={() => onBlockClick(block.id)}
                    isSelected={block.id === selectedBlockId}
                  />
                ))}
              </div>
              
              {/* Teine rida (ainult siis kui üle 9 klotsi) */}
              {blocks.length > 9 && (
                <div className="flex flex-wrap gap-3 justify-center border-t border-slate-100 pt-6">
                  {blocks.slice(Math.ceil(blocks.length / 2)).map((block, index) => (
                    <BlockItem 
                      key={block.id} 
                      block={block} 
                      index={index + Math.ceil(blocks.length / 2)}
                      onClick={() => onBlockClick(block.id)}
                      isSelected={block.id === selectedBlockId}
                    />
                  ))}
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
